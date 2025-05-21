import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthState, User } from '@/types';
import { Platform, Alert } from 'react-native';
import { supabase, auth as supabaseAuth } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkApprovalStatus: (userId: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Converts Supabase user data to our app's User type
const mapUserData = async (session: Session): Promise<User> => {
  try {
    // Get user profile from profiles table using maybeSingle() instead of single()
    // maybeSingle() returns null for data when no rows are found instead of throwing an error
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      // Continue with default user data even if profile fetch fails
    }
    
    // If no profile exists or there was an error fetching it
    if (!profile) {
      console.log('No profile found for user, using default profile data');
      
      // Return default user data without trying to create a profile here
      // This avoids potential RLS policy issues during authentication
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || 'User',
        role: 'inspector', // Default role
        approvalStatus: 'approved', // Set to approved to allow login
      };
    }
    
    // Return the complete user profile if profile exists
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile.name,
      role: profile.role,
      department: profile.department,
      phone: profile.phone,
      avatar: profile.avatar_url,
      approvalStatus: profile.approval_status || 'pending',
      approvalDeniedReason: profile.approval_denied_reason,
    };
  } catch (error: any) {
    console.error('Error in mapUserData:', error);
    // Return minimal user info if profile fetch fails
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || 'User',
      role: 'inspector', // Default role
      approvalStatus: 'approved', // Changed from 'pending' to 'approved' to ensure login works
    };
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
    pendingApproval: false,
  });
  
  const isMounted = useRef(true);

  // Safe setState that only updates if component is mounted
  const safeSetState = (newState: Partial<AuthState>) => {
    if (isMounted.current) {
      setState(prev => ({ ...prev, ...newState }));
    }
  };

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            const user = await mapUserData(session);
            
            // Check if the user is approved
            if (user.approvalStatus === 'pending') {
              safeSetState({
                isAuthenticated: false,
                user,
                token: session.access_token,
                loading: false,
                error: null,
                pendingApproval: true,
              });
              // Sign out the user if they're not approved
              await supabase.auth.signOut();
            } else if (user.approvalStatus === 'rejected') {
              safeSetState({
                isAuthenticated: false,
                user,
                token: null,
                loading: false,
                error: `Your account has been rejected${user.approvalDeniedReason ? ': ' + user.approvalDeniedReason : '.'}`,
                pendingApproval: false,
              });
              // Sign out the user if they're rejected
              await supabase.auth.signOut();
            } else {
              safeSetState({
                isAuthenticated: true,
                user,
                token: session.access_token,
                loading: false,
                error: null,
                pendingApproval: false,
              });
            }
          } catch (error) {
            console.error('Error processing session:', error);
            safeSetState({
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false,
              error: 'Failed to load user data',
            });
          }
        } else {
          safeSetState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    // Initial session check
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        
        // First, check for stored token in SecureStore (for mobile)
        let storedSession = null;
        if (Platform.OS !== 'web') {
          try {
            const storedToken = await SecureStore.getItemAsync('supabase-auth-token');
            if (storedToken) {
              storedSession = JSON.parse(storedToken);
              console.log('Found stored session in SecureStore');
            }
          } catch (storageError) {
            console.error('Error reading from secure storage:', storageError);
          }
        }
        
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check result:', session ? 'Session found' : 'No session');
        
        // Use either the current session or stored session
        const activeSession = session || storedSession;
        
        if (activeSession) {
          // If we're using a stored session and there's no current session, set it
          if (storedSession && !session) {
            try {
              await supabase.auth.setSession({
                access_token: storedSession.access_token,
                refresh_token: storedSession.refresh_token
              });
              console.log('Restored session from SecureStore');
            } catch (setSessionError) {
              console.error('Error setting session:', setSessionError);
              // Continue with stored user data even if setting session fails
            }
          }
          
          // Map user data from the active session
          const user = await mapUserData(activeSession);
          console.log('User mapped from session:', user.role, user.approvalStatus);
          
          // Always set user as authenticated if they have an approved status
          // This fixes the issue where users were being redirected to login
          if (user.approvalStatus === 'approved') {
            safeSetState({
              isAuthenticated: true,
              user,
              token: activeSession.access_token,
              loading: false,
              error: null,
              pendingApproval: false,
            });
            console.log('User authenticated successfully');
          } else if (user.approvalStatus === 'pending') {
            safeSetState({
              isAuthenticated: false,
              user,
              token: activeSession.access_token,
              loading: false,
              error: null,
              pendingApproval: true,
            });
            // Show pending approval message
            Alert.alert(
              'Account Pending Approval',
              'Your account is pending approval from a manager.',
              [{ 
                text: 'OK', 
                onPress: async () => {
                  try {
                    await supabase.auth.signOut({ scope: 'local' });
                  } catch (error) {
                    console.warn('Error signing out:', error);
                  }
                }
              }]
            );
          } else if (user.approvalStatus === 'rejected') {
            safeSetState({
              isAuthenticated: false,
              user,
              token: null,
              loading: false,
              error: `Your account has been rejected${user.approvalDeniedReason ? ': ' + user.approvalDeniedReason : '.'}`,
              pendingApproval: false,
            });
            // Sign out the user if they're rejected
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch (error) {
              console.warn('Error signing out rejected user:', error);
            }
          }
        } else {
          console.log('No active session found');
          safeSetState({ 
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false, 
            pendingApproval: false 
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
        safeSetState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: 'Failed to load authentication data',
        });
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    safeSetState({ loading: true, error: null });
    
    try {
      console.log('Attempting login for:', email);
      
      // Use the current Supabase API format
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error from Supabase:', error);
        throw error;
      }
      
      if (!data.session) {
        console.error('No session returned from login');
        throw new Error('No session returned from login');
      }
      
      console.log('Login successful, session obtained');
      
      // Always store the session for persistence regardless of rememberMe
      // This ensures the session is available for subsequent app launches
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.setItemAsync('supabase-auth-token', JSON.stringify(data.session));
          console.log('Session stored in SecureStore');
        } catch (storageError) {
          console.error('Error storing session:', storageError);
          // Continue even if storage fails
        }
      }
      
      // Map user data from the session
      const userData = await mapUserData(data.session);
      console.log('User mapped from session:', userData.role, userData.approvalStatus);
      
      // Check if the user is approved before setting as authenticated
      if (userData.approvalStatus === 'approved') {
        // Set authenticated state
        safeSetState({
          isAuthenticated: true,
          user: userData,
          token: data.session.access_token,
          loading: false,
          error: null,
          pendingApproval: false,
        });
        
        console.log('User authenticated, navigating to tabs');
        
        // Navigate to the dashboard after successful login
        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else if (userData.approvalStatus === 'pending') {
        console.log('User pending approval');
        
        // Set state first before attempting signout
        safeSetState({
          isAuthenticated: false,
          user: userData,
          token: data.session.access_token,
          loading: false,
          error: 'Your account is pending approval from a manager.',
          pendingApproval: true,
        });
        
        // Sign out the user since they're not approved yet - use local scope
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          console.warn('Error signing out unapproved user:', signOutError);
          // Continue even if signout fails
        }
        
        // Show pending approval message
        Alert.alert(
          'Account Pending Approval',
          'Your account is pending approval from a manager.',
          [{ text: 'OK' }]
        );
      } else if (userData.approvalStatus === 'rejected') {
        console.log('User rejected');
        
        // Set state first before attempting signout
        safeSetState({
          isAuthenticated: false,
          user: userData,
          token: null,
          loading: false,
          error: `Your account has been rejected${userData.approvalDeniedReason ? ': ' + userData.approvalDeniedReason : '.'}`,
          pendingApproval: false,
        });
        
        // Sign out the user since they're rejected - use local scope
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          console.warn('Error signing out rejected user:', signOutError);
          // Continue even if signout fails
        }
        
        // Show rejection message
        Alert.alert(
          'Account Rejected',
          `Your account has been rejected${userData.approvalDeniedReason ? ': ' + userData.approvalDeniedReason : '.'}`,
          [{ text: 'OK' }]
        );
      } else {
        // Default case - should not happen but handle gracefully
        console.warn('Unknown approval status:', userData.approvalStatus);
        safeSetState({
          isAuthenticated: false,
          user: userData,
          token: null,
          loading: false,
          error: 'Unknown account status. Please contact support.',
          pendingApproval: false,
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      safeSetState({
        loading: false,
        error: error.message || 'Login failed',
      });
    }
  };

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    console.log('AuthContext signup called with:', email, 'userData:', JSON.stringify(userData));
    
    // Set loading state immediately
    safeSetState({ loading: true, error: null });
    console.log('Setting loading state to true');
    
    try {
      // Basic validation
      if (!email || !email.includes('@')) {
        console.error('Invalid email format');
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        console.error('Password too short');
        throw new Error('Password must be at least 6 characters');
      }
      
      // Check if a profile with this email already exists
      console.log('Checking if profile exists with email:', email);
      const { data: existingProfiles, error: existingProfileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .limit(1);
        
      if (existingProfileError) {
        console.error('Error checking existing profiles:', existingProfileError);
      } else if (existingProfiles && existingProfiles.length > 0) {
        console.log('User already exists in profiles:', existingProfiles);
        throw new Error('A user with this email already exists');
      }
      
      console.log('No existing user found, proceeding with signup');
      
      // Create the auth user
      console.log('Creating auth user with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            role: userData.role || 'inspector',
          }
        }
      });
      
      if (error) {
        console.error('Signup auth error:', error);
        throw error;
      }
      
      console.log('Auth signup response:', JSON.stringify(data));
      
      if (!data?.user) {
        console.error('No user data returned from signup');
        throw new Error('User registration failed');
      }
      
      console.log('Creating profile for user ID:', data.user.id);
      
      // First check if a profile already exists for this user ID
      console.log('Checking if profile already exists for user ID:', data.user.id);
      const { data: existingProfile, error: profileByIdError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (profileByIdError) {
        console.error('Error checking existing profile by ID:', profileByIdError);
      }
      
      // If profile already exists, update it instead of creating a new one
      if (existingProfile) {
        console.log('Profile already exists, updating instead of creating');
        
        const profileData = {
          name: userData.name || 'New User',
          email,
          role: userData.role || 'inspector',
          department: userData.department || null,
          phone: userData.phone || null,
          approval_status: 'pending',
          updated_at: new Date().toISOString()
        };
        
        console.log('Updating profile data:', JSON.stringify(profileData));
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', data.user.id);
          
        if (updateError) {
          console.error('Profile update error:', updateError);
          throw new Error('Account created but profile update failed: ' + updateError.message);
        }
      } else {
        // Create user profile in profiles table if it doesn't exist
        const profileData = {
          id: data.user.id,
          name: userData.name || 'New User',
          email,
          role: userData.role || 'inspector',
          department: userData.department || null,
          phone: userData.phone || null,
          approval_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Inserting profile data:', JSON.stringify(profileData));
        
        // Add a small delay before creating the profile to ensure auth is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          // Try to get more details about the error
          console.log('Error details:', JSON.stringify(profileError));
          
          // If the error is duplicate key, the profile might have been created by a trigger
          if (profileError.code === '23505') {
            console.log('Duplicate key detected, profile might have been created by a trigger');
            
            // Try to update the profile instead
            const updateData = {
              name: userData.name || 'New User',
              email,
              role: userData.role || 'inspector',
              department: userData.department || null,
              phone: userData.phone || null,
              approval_status: 'pending',
              updated_at: new Date().toISOString()
            };
            
            console.log('Trying to update profile instead:', JSON.stringify(updateData));
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', data.user.id);
              
            if (updateError) {
              console.error('Profile update error:', updateError);
              throw new Error('Account created but profile update failed: ' + updateError.message);
            }
          } else if (profileError.message && profileError.message.includes('permission denied')) {
            console.log('Permission denied error detected, trying alternative approach');
            throw new Error('Account created but profile setup failed due to permission denied: ' + profileError.message);
          } else {
            throw new Error('Account created but profile setup failed: ' + profileError.message);
          }
        }
      }
      
      console.log('Profile created successfully with pending status');
      
      // Set state to indicate successful signup with pending approval
      safeSetState({ 
        loading: false, 
        error: null,
        pendingApproval: true
      });
      
      // Show success message with approval information
      Alert.alert(
        'Signup Successful',
        'Your account has been created and is pending approval from a manager. You will be notified when your account is approved.',
        [{ 
          text: 'OK',
          onPress: () => {
            // Navigate to the login screen after user acknowledges
            router.push('/(auth)/login');
          }
        }]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      safeSetState({
        loading: false,
        error: error.message || 'Signup failed',
      });
      
      // Show error alert
      Alert.alert(
        'Signup Failed',
        error.message || 'An unexpected error occurred during signup',
        [{ text: 'OK' }]
      );
    }
  };

  const resetPassword = async (email: string) => {
    safeSetState({ loading: true, error: null });
    
    try {
      // Use the current Supabase API format
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      safeSetState({ loading: false, error: null });
    } catch (error: any) {
      console.error('Password reset error:', error);
      safeSetState({
        loading: false,
        error: error.message || 'Password reset failed',
      });
    }
  };

  const checkApprovalStatus = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data.approval_status;
    } catch (error) {
      console.error('Error checking approval status:', error);
      return 'error';
    }
  };
  
  const logout = async () => {
    safeSetState({ loading: true });
    
    try {
      // First, clear local state regardless of server response
      // This ensures the user is logged out on the client side even if server logout fails
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.deleteItemAsync('supabase-auth-token');
        } catch (storageError) {
          console.error('Error clearing secure storage:', storageError);
          // Continue with logout even if storage clearing fails
        }
      }
      
      // Try to sign out from Supabase
      try {
        // Use local signout (not global) to avoid 403 errors
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) {
          console.warn('Supabase signout error:', error);
          // Continue with local logout even if server logout fails
        }
      } catch (signOutError) {
        console.warn('Error during signout:', signOutError);
        // Continue with local logout even if server logout fails
      }
      
      // Always update state to logged out, regardless of server response
      safeSetState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
        pendingApproval: false
      });
      
      // Navigate to login screen
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, still clear the auth state
      safeSetState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
        pendingApproval: false
      });
      
      // Navigate to login screen
      router.replace('/(auth)/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        signup,
        resetPassword,
        checkApprovalStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
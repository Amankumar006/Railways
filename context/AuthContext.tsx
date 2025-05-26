import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthState, User } from '@/types';
import { Platform, Alert } from 'react-native';
import { supabase, auth as supabaseAuth } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import Constants from 'expo-constants';

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
        approvalStatus: 'pending', // Set to pending by default - users need approval
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
      approvalStatus: 'pending', // Users need approval by default
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
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        if (session) {
          try {
            const user = await mapUserData(session);
            console.log('User mapped:', user.email, user.approvalStatus);
            
            // Check if the user is approved
            if (user.approvalStatus === 'pending') {
              console.log('User pending approval, signing out');
              safeSetState({
                isAuthenticated: false,
                user,
                token: null,
                loading: false,
                error: null,
                pendingApproval: true,
              });
              // Sign out the user if they're not approved
              await supabase.auth.signOut();
            } else if (user.approvalStatus === 'rejected') {
              console.log('User rejected, signing out');
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
              console.log('User approved, setting authenticated');
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
          console.log('No session, setting unauthenticated');
          safeSetState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            pendingApproval: false,
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
    if (__DEV__) {
      console.log('AuthContext signup called with:', email, 'userData:', JSON.stringify(userData));
    }
    
    // Set loading state immediately
    safeSetState({ loading: true, error: null });
    
    try {
      // Basic validation
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Step 1: Create auth user
      if (__DEV__) console.log('Creating auth user...');
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
        throw error;
      }
      
      if (!data?.user) {
        throw new Error('User registration failed');
      }

      // Step 2: Create user profile
      if (__DEV__) console.log('Creating user profile...');
      const profileData = {
        id: data.user.id,
        name: userData.name || 'New User',
        email,
        role: userData.role || 'inspector',
        department: userData.department || undefined,
        phone: userData.phone || undefined,
        approval_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (profileError) {
        // If profile creation fails, attempt to clean up auth user
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          if (__DEV__) console.error('Cleanup error:', cleanupError);
        }
        throw new Error('Account creation failed: ' + profileError.message);
      }
      
      // Step 3: Sign out user since they need approval
      if (__DEV__) console.log('Signing out user for approval process...');
      await supabase.auth.signOut();
      
      // Step 4: Update state to indicate successful signup with pending approval
      const finalState = {
        loading: false,
        error: null,
        pendingApproval: true,
        isAuthenticated: false,
        user: {
          ...profileData,
          id: data.user.id,
          approvalStatus: 'pending' as const,
        },
        token: null
      };
      
      if (__DEV__) console.log('Setting final state:', finalState);
      safeSetState(finalState);
      
      // Success - the signup screen will handle navigation
      
    } catch (error: any) {
      if (__DEV__) console.error('Signup error:', error);
      
      // Ensure we're signed out in case of error
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        if (__DEV__) console.error('Error signing out after failure:', signOutError);
      }
      
      safeSetState({
        loading: false,
        error: error.message || 'Signup failed',
        isAuthenticated: false,
        user: null,
        token: null,
        pendingApproval: false
      });
      
      throw error;
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
    // Immediately set loading state
    safeSetState({ loading: true });
    
    try {
      console.log('Starting logout process...');
      
      // For web platform, handle logout specially
      if (Platform.OS === 'web') {
        // Set user as logged out immediately to prevent UI issues
        safeSetState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: null,
          pendingApproval: false
        });
        
        // Get the Supabase URL for key generation
        const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
        
        // First navigate to login screen
        console.log('Navigating to login screen first...');
        router.replace('/(auth)/login');
        
        // Then perform logout operations asynchronously
        setTimeout(async () => {
          try {
            // Sign out from Supabase
            console.log('Calling Supabase signOut after navigation...');
            await supabase.auth.signOut({ scope: 'global' });
            
            // Clear all localStorage manually
            console.log('Clearing localStorage...');
            const supabaseKeys = [];
            
            // Find all auth-related keys
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (!key) continue;
              
              if (key.startsWith('sb-') || 
                  key.includes('supabase') || 
                  key.includes('auth') ||
                  (supabaseUrl && key.includes(supabaseUrl.split('//')[1]?.split('.')[0] || ''))) {
                supabaseKeys.push(key);
              }
            }
            
            // Remove all found keys
            supabaseKeys.forEach(key => {
              try {
                localStorage.removeItem(key);
                console.log(`Removed localStorage key: ${key}`);
              } catch (e) {
                console.warn(`Failed to remove key: ${key}`, e);
              }
            });
            
            // Force refresh page after a delay
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }, 300);
          } catch (innerError) {
            console.error('Error in delayed logout tasks:', innerError);
            // Force refresh the page even if there's an error
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        }, 200);
        
        // Return early for web to prevent further processing
        return;
      }
      
      // For mobile platforms, continue with the existing flow
      try {
        // Step 1: Sign out from Supabase
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) {
          console.warn('Supabase signout error:', error);
        }
      } catch (signOutError) {
        console.warn('Error during supabase signout:', signOutError);
      }
      
      // Step 2: Clear mobile secure storage
      try {
        await SecureStore.deleteItemAsync('supabase-auth-token');
        console.log('Cleared SecureStore auth token');
      } catch (storageError) {
        console.error('Error clearing secure storage:', storageError);
      }
      
      // Step 3: Update state to logged out
      safeSetState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
        pendingApproval: false
      });
      
      console.log('Auth state cleared, navigating to login');
      
      // Step 4: Navigate to login screen
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
      
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
      
      // For web, force reload even on error
      if (Platform.OS === 'web') {
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 500);
      }
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

// Default export to satisfy router requirements
export default AuthProvider;
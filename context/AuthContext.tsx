import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthState, User } from '@/types';
import { Platform } from 'react-native';
import { supabase, auth as supabaseAuth } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Converts Supabase user data to our app's User type
const mapUserData = async (session: Session): Promise<User> => {
  // Get user profile from profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    // Return minimal user info if profile fetch fails
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || 'User',
      role: 'inspector', // Default role
    };
  }
  
  // Return the complete user profile
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: profile.name,
    role: profile.role,
    department: profile.department,
    phone: profile.phone,
    avatar: profile.avatar_url,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
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
            safeSetState({
              isAuthenticated: true,
              user,
              token: session.access_token,
              loading: false,
              error: null,
            });
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const user = await mapUserData(session);
          safeSetState({
            isAuthenticated: true,
            user,
            token: session.access_token,
            loading: false,
            error: null,
          });
        } else {
          safeSetState({ loading: false });
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

  const login = async (email: string, password: string) => {
    safeSetState({ loading: true, error: null });
    
    try {
      const { data, error } = await supabaseAuth.signIn(email, password);
      
      if (error) throw error;
      if (!data.session) throw new Error('No session returned from login');
      
      const userData = await mapUserData(data.session);
      
      safeSetState({
        isAuthenticated: true,
        user: userData,
        token: data.session.access_token,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      safeSetState({
        loading: false,
        error: error.message || 'Login failed',
      });
    }
  };

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    safeSetState({ loading: true, error: null });
    
    try {
      const { data, error } = await supabaseAuth.signUp(email, password);
      
      if (error) throw error;
      if (!data.user) throw new Error('User registration failed');
      
      // Create user profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: userData.name || 'New User',
          email,
          role: userData.role || 'inspector',
          department: userData.department,
          phone: userData.phone,
          avatar_url: userData.avatar,
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
      
      safeSetState({ loading: false, error: null });
    } catch (error: any) {
      console.error('Signup error:', error);
      safeSetState({
        loading: false,
        error: error.message || 'Signup failed',
      });
    }
  };

  const resetPassword = async (email: string) => {
    safeSetState({ loading: true, error: null });
    
    try {
      await supabaseAuth.resetPassword(email);
      safeSetState({ loading: false, error: null });
    } catch (error: any) {
      console.error('Password reset error:', error);
      safeSetState({
        loading: false,
        error: error.message || 'Password reset failed',
      });
    }
  };

  const logout = async () => {
    safeSetState({ loading: true });
    
    try {
      await supabaseAuth.signOut();
      
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('supabase-auth-token');
      }
      
      safeSetState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      safeSetState({
        loading: false,
        error: error.message || 'Logout failed',
      });
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
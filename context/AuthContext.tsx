import React, { createContext, useState, useContext, useEffect } from 'react';
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

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            const user = await mapUserData(session);
            setState({
              isAuthenticated: true,
              user,
              token: session.access_token,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error('Error processing session:', error);
            setState({
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false,
              error: 'Failed to load user data',
            });
          }
        } else {
          setState({
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
          setState({
            isAuthenticated: true,
            user,
            token: session.access_token,
            loading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Session check error:', error);
        setState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: 'Failed to load authentication data',
        });
      }
    };

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { user, session } = await supabaseAuth.signIn(email, password);
      
      if (!session) {
        throw new Error('No session returned from login');
      }
      
      const userData = await mapUserData(session);
      
      setState({
        isAuthenticated: true,
        user: userData,
        token: session.access_token,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed',
      }));
    }
  };

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Sign up with Supabase Auth
      const { user, session } = await supabaseAuth.signUp(email, password);
      
      if (!user) {
        throw new Error('User registration failed');
      }
      
      // Create user profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: userData.name || 'New User',
          email,
          role: userData.role || 'inspector',
          department: userData.department,
          phone: userData.phone,
          avatar_url: userData.avatar,
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue despite profile error, it will be handled in onAuthStateChange
      }
      
      // Auth state will be updated by the listener
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: null, 
        // Don't set auth info here, wait for onAuthStateChange 
      }));
    } catch (error: any) {
      console.error('Signup error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Signup failed',
      }));
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await supabaseAuth.resetPassword(email);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: null,
      }));
    } catch (error: any) {
      console.error('Password reset error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Password reset failed',
      }));
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Use the auth.signOut() function from our lib/supabase.ts
      await auth.signOut();
      
      // Clear any stored session data
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('supabase-auth-token');
      }
      
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Logout failed',
      }));
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
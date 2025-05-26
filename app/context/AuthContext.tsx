import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthState, User } from '@/types';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
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

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    console.log('AuthContext signup called with:', email, 'userData:', JSON.stringify(userData));
    
    // Set loading state immediately
    safeSetState({ loading: true, error: null });
    console.log('Setting loading state to true');
    
    try {
      // Basic validation
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
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
      
      if (!data?.user) {
        throw new Error('User registration failed');
      }
      
      // Create user profile in profiles table
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
      
      console.log('Creating profile with data:', JSON.stringify(profileData));
      
      // Add a small delay to ensure auth is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Account created but profile setup failed: ' + profileError.message);
      }
      
      console.log('Profile created successfully with pending status');
      
      // Sign out the user since they need approval
      await supabase.auth.signOut();
      
      // Set state to indicate successful signup with pending approval
      safeSetState({ 
        loading: false, 
        error: null,
        pendingApproval: true,
        isAuthenticated: false,
        user: {
          ...profileData,
          id: data.user.id,
        },
        token: null
      });
    } catch (error: any) {
      console.error('Signup error:', error);
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

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    // Implementation will be added later
    throw new Error('Not implemented');
  };

  const logout = async () => {
    // Implementation will be added later
    throw new Error('Not implemented');
  };

  const resetPassword = async (email: string) => {
    // Implementation will be added later
    throw new Error('Not implemented');
  };

  const checkApprovalStatus = async (userId: string): Promise<string> => {
    // Implementation will be added later
    throw new Error('Not implemented');
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signup,
        login,
        logout,
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
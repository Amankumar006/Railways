import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false, // We'll handle session persistence ourselves
      detectSessionInUrl: false, // Disable session detection in URL for mobile
      storage: {
        getItem: async (key: string) => {
          try {
            return await SecureStore.getItemAsync(key);
          } catch {
            // Fallback for web
            return localStorage.getItem(key);
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await SecureStore.setItemAsync(key, value);
          } catch {
            // Fallback for web
            localStorage.setItem(key, value);
          }
        },
        removeItem: async (key: string) => {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch {
            // Fallback for web
            localStorage.removeItem(key);
          }
        },
      },
    },
  }
);

// Helper function to check if we're running in a browser
export const isBrowser = () => typeof window !== 'undefined';

// Type-safe database functions
export const db = {
  // Users
  users: {
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    updateProfile: async (id: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      return data;
    },
  },
  
  // Schedules
  schedules: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          coach:coaches(*),
          assigned_to:profiles!assigned_to_id(*),
          supervised_by:profiles!supervised_by_id(*)
        `)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          coach:coaches(*),
          assigned_to:profiles!assigned_to_id(*),
          supervised_by:profiles!supervised_by_id(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    create: async (schedule: Database['public']['Tables']['schedules']['Insert']) => {
      const { data, error } = await supabase
        .from('schedules')
        .insert(schedule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: Partial<Database['public']['Tables']['schedules']['Update']>) => {
      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  },
  
  // Coaches
  coaches: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .order('number');
      
      if (error) throw error;
      return data;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  },
  
  // Real-time subscriptions
  subscriptions: {
    schedules: (callback: (payload: any) => void) => {
      return supabase
        .channel('schedules')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'schedules',
          },
          callback
        )
        .subscribe();
    },
  },
};

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },
  
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
    // Disable realtime subscriptions on Android to avoid Node.js module compatibility issues
    realtime: {
      params: {
        // Completely disable WebSocket connections on Android
        eventsPerSecond: Platform.OS === 'android' ? 0 : 1,
      },
    },
    auth: {
      persistSession: true, // Enable session persistence
      detectSessionInUrl: Platform.OS === 'web', // Only detect sessions in URL on web
      storage: {
        getItem: async (key: string) => {
          if (Platform.OS === 'web') {
            return localStorage.getItem(key);
          }
          try {
            return await SecureStore.getItemAsync(key);
          } catch (error) {
            console.error('SecureStore getItem error:', error);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
          }
          try {
            await SecureStore.setItemAsync(key, value);
          } catch (error) {
            console.error('SecureStore setItem error:', error);
          }
        },
        removeItem: async (key: string) => {
          if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
          }
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (error) {
            console.error('SecureStore removeItem error:', error);
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
  
  // Trips functions will replace schedules functionality
  trips: {
    // Get trip reports for a user
    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('inspector_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    
    // Create a new trip report
    create: async (tripData: any) => {
      const { data, error } = await supabase
        .from('trip_reports')
        .insert(tripData)
        .select();
      
      if (error) throw error;
      return data;
    },
    
    // Update an existing trip report
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('trip_reports')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
  },
  
  // Mock trains functionality to prevent errors from missing trains table
  trains: {
    // Return mock train data instead of querying the database
    getAll: async () => {
      console.log('Using mock train data instead of database query');
      // Return mock data
      return [
        { id: '1', number: '12301', name: 'Howrah Rajdhani Express', type: 'Rajdhani' },
        { id: '2', number: '12302', name: 'New Delhi Rajdhani Express', type: 'Rajdhani' },
        { id: '3', number: '12951', name: 'Mumbai Rajdhani Express', type: 'Rajdhani' },
        { id: '4', number: '12309', name: 'Rajendra Nagar Rajdhani Express', type: 'Rajdhani' },
        { id: '5', number: '12259', name: 'Sealdah Duronto Express', type: 'Duronto' },
        { id: '6', number: '12261', name: 'Mumbai CST Duronto Express', type: 'Duronto' },
        { id: '7', number: '12213', name: 'Yesvantpur Duronto Express', type: 'Duronto' },
        { id: '8', number: '12001', name: 'Bhopal Shatabdi Express', type: 'Shatabdi' },
        { id: '9', number: '12002', name: 'New Delhi Shatabdi Express', type: 'Shatabdi' },
        { id: '10', number: '12003', name: 'Lucknow Shatabdi Express', type: 'Shatabdi' }
      ];
    },
    
    // Get a train by ID
    getById: async (id: string) => {
      console.log('Using mock train data instead of database query');
      const mockTrains = [
        { id: '1', number: '12301', name: 'Howrah Rajdhani Express', type: 'Rajdhani' },
        { id: '2', number: '12302', name: 'New Delhi Rajdhani Express', type: 'Rajdhani' },
        { id: '3', number: '12951', name: 'Mumbai Rajdhani Express', type: 'Rajdhani' },
        { id: '4', number: '12309', name: 'Rajendra Nagar Rajdhani Express', type: 'Rajdhani' },
        { id: '5', number: '12259', name: 'Sealdah Duronto Express', type: 'Duronto' },
        { id: '6', number: '12261', name: 'Mumbai CST Duronto Express', type: 'Duronto' },
        { id: '7', number: '12213', name: 'Yesvantpur Duronto Express', type: 'Duronto' },
        { id: '8', number: '12001', name: 'Bhopal Shatabdi Express', type: 'Shatabdi' },
        { id: '9', number: '12002', name: 'New Delhi Shatabdi Express', type: 'Shatabdi' },
        { id: '10', number: '12003', name: 'Lucknow Shatabdi Express', type: 'Shatabdi' }
      ];
      return mockTrains.find(train => train.id === id) || mockTrains[0];
    },
    
    // Get a train by number
    getByNumber: async (number: string) => {
      console.log('Using mock train data instead of database query');
      const mockTrains = [
        { id: '1', number: '12301', name: 'Howrah Rajdhani Express', type: 'Rajdhani' },
        { id: '2', number: '12302', name: 'New Delhi Rajdhani Express', type: 'Rajdhani' },
        { id: '3', number: '12951', name: 'Mumbai Rajdhani Express', type: 'Rajdhani' },
        { id: '4', number: '12309', name: 'Rajendra Nagar Rajdhani Express', type: 'Rajdhani' },
        { id: '5', number: '12259', name: 'Sealdah Duronto Express', type: 'Duronto' },
        { id: '6', number: '12261', name: 'Mumbai CST Duronto Express', type: 'Duronto' },
        { id: '7', number: '12213', name: 'Yesvantpur Duronto Express', type: 'Duronto' },
        { id: '8', number: '12001', name: 'Bhopal Shatabdi Express', type: 'Shatabdi' },
        { id: '9', number: '12002', name: 'New Delhi Shatabdi Express', type: 'Shatabdi' },
        { id: '10', number: '12003', name: 'Lucknow Shatabdi Express', type: 'Shatabdi' }
      ];
      return mockTrains.find(train => train.number === number) || mockTrains[0];
    }
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
    // Trips subscriptions will replace schedules functionality
    trips: (callback: (payload: any) => void) => {
      // Skip real-time subscriptions on Android
      if (Platform.OS === 'android') {
        console.log('Real-time subscriptions are disabled on Android');
        return {
          // Return a dummy subscription object
          unsubscribe: () => {},
        };
      }
      
      // Normal subscription for iOS and web
      return supabase
        .channel('trips')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trip_reports',
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
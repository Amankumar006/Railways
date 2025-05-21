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

// Create a platform-specific Supabase client
export const createSupabaseClient = () => {
  const isAndroid = Platform.OS === 'android';
  
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      // Disable realtime completely on Android
      realtime: {
        params: {
          eventsPerSecond: isAndroid ? 0 : 1,
        },
      },
      global: {
        // Disable WebSockets on Android
        fetch: isAndroid ? customFetchWithoutWebsocket : undefined,
      },
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
};

// Custom fetch function that prevents WebSocket connections on Android
async function customFetchWithoutWebsocket(url: RequestInfo | URL, init?: RequestInit) {
  // If this is a WebSocket connection attempt, block it on Android
  if (typeof url === 'string' && (url.startsWith('ws:') || url.startsWith('wss:'))) {
    console.log('WebSocket connection blocked on Android:', url);
    // Return a fake response to prevent errors
    return new Response(JSON.stringify({ error: 'WebSockets are disabled on Android' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // For regular HTTP requests, use the standard fetch
  return fetch(url, init);
}

// Create a single instance of the client
export const supabase = createSupabaseClient();

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
  
  // Real-time subscriptions - WITH PLATFORM CHECK
  subscriptions: {
    schedules: (callback: (payload: any) => void) => {
      // Skip subscriptions on Android
      if (Platform.OS === 'android') {
        console.log('Real-time subscriptions are not supported on Android');
        return {
          unsubscribe: () => {},
        };
      }
      
      // Normal subscription for other platforms
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
};

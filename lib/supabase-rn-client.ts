import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get Supabase URL and Anon Key from multiple sources for reliability
const getSupabaseConfig = () => {
  // Try multiple ways to get the config
  const urlFromConfig = Constants.expoConfig?.extra?.supabaseUrl;
  const keyFromConfig = Constants.expoConfig?.extra?.supabaseAnonKey;
  
  // Direct environment access as fallback
  const urlFromEnv = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const keyFromEnv = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  // Try manifest as another fallback
  const manifest = Constants.manifest || Constants.manifest2?.extra?.expoClient;
  const urlFromManifest = manifest?.extra?.supabaseUrl;
  const keyFromManifest = manifest?.extra?.supabaseAnonKey;
  
  const finalUrl = urlFromConfig || urlFromEnv || urlFromManifest || 'https://yjymlekomywnuwlzmsen.supabase.co';
  const finalKey = keyFromConfig || keyFromEnv || keyFromManifest || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeW1sZWtvbXl3bnV3bHptc2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDgwMjgsImV4cCI6MjA2MzEyNDAyOH0.w4fF7BgwSmAeMqWMCBG5f4jOqIoHojEJ06csHmlRNMc';
  
  console.log('RN Client - Supabase config resolved:', {
    url: finalUrl,
    keyExists: !!finalKey,
    source: urlFromConfig ? 'config' : urlFromEnv ? 'env' : urlFromManifest ? 'manifest' : 'hardcoded'
  });
  
  return { url: finalUrl, key: finalKey };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

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
  
  // Trips functionality (replacing schedules)
  trips: {
    // Add trip-related functions here when needed
    getAll: async () => {
      const { data, error } = await supabase
        .from('trip_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', id)
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
    trips: (callback: (payload: any) => void) => {
      // Skip subscriptions on Android
      if (Platform.OS === 'android') {
        console.log('Real-time subscriptions are not supported on Android');
        return {
          unsubscribe: () => {},
        };
      }
      
      // Normal subscription for other platforms
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
};

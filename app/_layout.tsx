// This is the root layout component for the entire application
// It manages fonts, authentication state, and navigation structure

import React, { useEffect, useState } from 'react';
import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider, { useAuth } from '@/context/AuthContext';
import { Platform, useColorScheme, View, ActivityIndicator } from 'react-native';
import { colorScheme, colors } from '../constants/Colors';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';

// Prevent splash screen from hiding until we're ready
SplashScreen.preventAutoHideAsync();

// Create a client for React Query
const queryClient = new QueryClient();

// Export unstable_settings to configure router behavior
export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
};

// Root layout component that wraps the entire application
export default function RootLayout() {
  const [urlProcessed, setUrlProcessed] = useState(false);
  
  // Handle auth redirects before rendering anything else
  useEffect(() => {
    // Function to clean up auth parameters from URL to prevent expo-router errors
    async function cleanupAuthParams() {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        try {
          const url = window.location.href;
          
          // Using safer indexOf instead of includes()
          const hasAuthParams = 
            url.indexOf('#access_token=') !== -1 || 
            url.indexOf('&refresh_token=') !== -1 || 
            url.indexOf('type=recovery') !== -1 || 
            url.indexOf('type=signup') !== -1;
          
          if (hasAuthParams) {
            console.log('Auth parameters detected in URL, processing...');
            
            // First, immediately clean the URL to prevent Expo Router from parsing it
            const baseUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, baseUrl);
            
            // Then let Supabase process the session after URL is cleaned
            try {
              await supabase.auth.getSession();
            } catch (sessionError) {
              console.error('Error getting session:', sessionError);
            }
          }
          
          // Mark URL as processed regardless of outcome
          setUrlProcessed(true);
        } catch (error) {
          console.error('Error cleaning auth params:', error);
          setUrlProcessed(true); // Continue even if there was an error
        }
      } else {
        // No need to process URLs on native platforms
        setUrlProcessed(true);
      }
    }
    
    cleanupAuthParams();
  }, []);
  
  // Show loading state until URL is processed to prevent navigation errors
  if (!urlProcessed && Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }
  
  // Provide authentication context and React Query to the entire app
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Handle authentication-based navigation
function RootLayoutNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  // While determining auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }
  
  // Set up navigation structure based on authentication state
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="admin" options={{ animation: 'fade' }} />
          </>
        )}
        <Stack.Screen name="not-found" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={colorScheme[colorMode].statusBar as 'light' | 'dark' | 'auto' | undefined} />
    </>
  );
}
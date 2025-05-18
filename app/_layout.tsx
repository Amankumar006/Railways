import React, { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from 'react-native';
import { colorScheme } from '@/constants/Colors';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  useFrameworkReady();

  // Hide splash screen once everything is ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNavigator />
    </AuthProvider>
  );
}

function RootLayoutNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  
  // Wait until auth state is determined
  if (loading) {
    return null;
  }
  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        ) : (
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme[colorMode].statusBar} />
    </>
  );
}
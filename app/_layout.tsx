// This is the root layout component for the entire application
// It manages fonts, authentication state, and navigation structure

import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { colorScheme, colors } from '../constants/Colors';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from hiding until we're ready
SplashScreen.preventAutoHideAsync();

// Export unstable_settings to configure router behavior
export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
};

// Root layout component that wraps the entire application
export default function RootLayout() {
  // Load custom fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });
  
  // Hide splash screen once resources are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  
  // Keep splash screen visible while resources load
  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  // Provide authentication context to the entire app
  return (
    <AuthProvider>
      <RootLayoutNavigator />
    </AuthProvider>
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
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        )}
        <Stack.Screen name="not-found" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={colorScheme[colorMode].statusBar as 'light' | 'dark' | 'auto' | undefined} />
    </>
  );
}
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { colorScheme, colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export default function AdminLayout() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  // Check if the user has admin/manager permissions
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'manager')) {
      // Redirect to home screen if not authenticated or not a manager
      router.replace('/');
    }
  }, [isAuthenticated, user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={{ marginTop: 16, color: themeColors.text }}>Loading...</Text>
      </View>
    );
  }

  // Only render the stack if the user is a manager
  if (user?.role !== 'manager') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: themeColors.background }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: themeColors.text, textAlign: 'center' }}>
          Admin Access Required
        </Text>
        <Text style={{ fontSize: 14, color: themeColors.textSecondary, marginTop: 8, textAlign: 'center' }}>
          You need manager privileges to access the admin dashboard.
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.card,
        },
        headerTintColor: themeColors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: themeColors.background },
      }}
    />
  );
}
import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colorScheme } from '@/constants/Colors';
import { Chrome as Home, Calendar, Bell, User } from 'lucide-react-native';
import { RequireAuth } from '@/components/auth/RequireAuth';

export default function TabLayout() {
  const colorMode = useColorScheme() ?? 'light';
  const colors = colorScheme[colorMode];

  return (
    <RequireAuth>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: colors.tabBarActiveIcon,
        tabBarInactiveTintColor: colors.tabBarIcon,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: 'Schedules',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Bell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      </Tabs>
    </RequireAuth>
  );
}
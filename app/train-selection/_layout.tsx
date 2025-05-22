import React from 'react';
import { Stack } from 'expo-router';
import { RequireAuth } from '@/components/auth/RequireAuth';

export default function TrainSelectionLayout() {
  return (
    <RequireAuth>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Select Train',
            headerShown: false,
          }}
        />
      </Stack>
    </RequireAuth>
  );
}

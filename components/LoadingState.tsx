import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StyledText } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

/**
 * Standardized loading state component with customizable message and size
 */
export function LoadingState({
  message = 'Loading...',
  size = 'large',
  fullScreen = false,
}: LoadingStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color="#0056b3" />
      {message && <StyledText style={styles.message}>{message}</StyledText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StyledText } from './StyledText';
import { useTheme } from '@/hooks/useTheme';

type ProgressVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  progress: number; // 0 to 100
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const { colors, theme } = useTheme();
  
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  // Get color based on variant
  const getColor = () => {
    switch (variant) {
      case 'primary':
        return theme.indianRailways.blue;
      case 'secondary':
        return theme.indianRailways.saffron;
      case 'success':
        return theme.indianRailways.green;
      case 'warning':
        return theme.indianRailways.yellow;
      case 'error':
        return theme.indianRailways.red;
      default:
        return theme.indianRailways.blue;
    }
  };
  
  // Get height based on size
  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 4;
      case 'md':
        return 8;
      case 'lg':
        return 12;
      default:
        return 8;
    }
  };
  
  const color = getColor();
  const height = getHeight();
  
  // Animation setup
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: normalizedProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(normalizedProgress);
    }
  }, [normalizedProgress, animated]);
  
  // Calculate the width based on the animated value
  const width = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <View style={styles.container}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label ? (
            <StyledText size="sm" color={colors.textSecondary}>
              {label}
            </StyledText>
          ) : null}
          {showLabel && (
            <StyledText size="sm" weight="semibold">
              {normalizedProgress}%
            </StyledText>
          )}
        </View>
      )}
      
      <View 
        style={[
          styles.progressBackground, 
          { 
            height,
            backgroundColor: `${color}20`,
            borderRadius: height / 2,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBackground: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  animated: {
    // Note: React Native doesn't support CSS transitions directly
    // Animation would need to be implemented using Animated API
  },
});

export default ProgressBar;

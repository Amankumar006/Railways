import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StyledText } from './StyledText';
import { useTheme } from '@/hooks/useTheme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  outlined?: boolean;
}

export function Badge({
  text,
  variant = 'primary',
  size = 'md',
  icon,
  outlined = false,
}: BadgeProps) {
  const { colors, theme } = useTheme();
  
  // Get background color based on variant
  const getBackgroundColor = () => {
    if (outlined) return 'transparent';
    
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
      case 'info':
        return colors.primary[400];
      case 'neutral':
        return colors.neutral[200];
      default:
        return theme.indianRailways.blue;
    }
  };
  
  // Get text color based on variant
  const getTextColor = () => {
    if (outlined) {
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
        case 'info':
          return colors.primary[500];
        case 'neutral':
          return colors.neutral[700];
        default:
          return theme.indianRailways.blue;
      }
    }
    
    // For non-outlined badges
    return variant === 'neutral' ? colors.neutral[800] : colors.white;
  };
  
  // Get border color for outlined badges
  const getBorderColor = () => {
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
      case 'info':
        return colors.primary[500];
      case 'neutral':
        return colors.neutral[300];
      default:
        return theme.indianRailways.blue;
    }
  };
  
  return (
    <View
      style={[
        styles.badge,
        styles[`badge-${size}`],
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: outlined ? 1 : 0,
          borderColor: outlined ? getBorderColor() : undefined,
        },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <StyledText
        size={size === 'lg' ? 'sm' : 'xs'}
        weight="semibold"
        color={getTextColor()}
      >
        {text}
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    paddingHorizontal: 8,
  },
  'badge-sm': {
    height: 20,
    paddingHorizontal: 6,
  },
  'badge-md': {
    height: 24,
    paddingHorizontal: 8,
  },
  'badge-lg': {
    height: 28,
    paddingHorizontal: 10,
  },
  iconContainer: {
    marginRight: 4,
  },
});

export default Badge;

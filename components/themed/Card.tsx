import React from 'react';
import { StyleSheet, ViewProps, TouchableOpacity, useColorScheme } from 'react-native';
import { StyledView } from './StyledView';
import { colorScheme, colors } from '@/constants/Colors';

interface CardProps extends ViewProps {
  onPress?: () => void;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'filled' | 'outlined' | 'accent' | 'secondary' | 'success' | 'warning' | 'error';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderLeft?: boolean;
  borderLeftColor?: string;
  borderLeftWidth?: number;
}

export function Card({ 
  children, 
  style, 
  onPress, 
  elevation = 'sm',
  radius = 'md',
  variant = 'filled',
  padding = 'md',
  borderLeft = false,
  borderLeftColor,
  borderLeftWidth = 4,
  ...otherProps 
}: CardProps) {
  const theme = useColorScheme() ?? 'light';
  const themeColors = colorScheme[theme];

  // Get background color based on variant
  const getBackgroundColor = () => {
    if (variant === 'outlined') return 'transparent';
    
    switch (variant) {
      case 'accent':
        return colors.primary[50];
      case 'secondary':
        return colors.secondary[50];
      case 'success':
        return colors.success[50];
      case 'warning':
        return colors.warning[50];
      case 'error':
        return colors.error[50];
      default:
        return themeColors.card;
    }
  };

  // Get border color based on variant
  const getBorderColor = () => {
    switch (variant) {
      case 'accent':
        return colors.primary[500];
      case 'secondary':
        return colors.secondary[500];
      case 'success':
        return colors.success[500];
      case 'warning':
        return colors.warning[500];
      case 'error':
        return colors.error[500];
      default:
        return themeColors.border;
    }
  };

  const cardStyles = [
    styles.card,
    padding !== 'none' && styles[`padding-${padding}`],
    radius !== 'none' && styles[`radius-${radius}`],
    elevation !== 'none' && styles[`elevation-${elevation}-${theme}`],
    variant === 'outlined' && {
      borderWidth: 1,
      borderColor: getBorderColor(),
      backgroundColor: 'transparent',
    },
    borderLeft && {
      borderLeftWidth: borderLeftWidth,
      borderLeftColor: borderLeftColor || getBorderColor(),
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
        {...otherProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <StyledView style={cardStyles} backgroundColor={getBackgroundColor()} {...otherProps}>
      {React.Children.map(children, child => {
        // Filter out text nodes that are just whitespace or periods
        if (typeof child === 'string' && (child.trim() === '' || child === '.')) {
          return null;
        }
        return child;
      })}
    </StyledView>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  'padding-none': {
    padding: 0,
  },
  'padding-sm': {
    padding: 8,
  },
  'padding-md': {
    padding: 16,
  },
  'padding-lg': {
    padding: 24,
  },
  'radius-sm': {
    borderRadius: 4,
  },
  'radius-md': {
    borderRadius: 8,
  },
  'radius-lg': {
    borderRadius: 16,
  },
  'radius-full': {
    borderRadius: 9999,
  },
  'elevation-sm-light': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  'elevation-md-light': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  'elevation-lg-light': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  'elevation-sm-dark': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 1,
  },
  'elevation-md-dark': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
  },
  'elevation-lg-dark': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
});
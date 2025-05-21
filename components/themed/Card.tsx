import React from 'react';
import { StyleSheet, ViewProps, TouchableOpacity, useColorScheme } from 'react-native';
import { StyledView } from './StyledView';
import { colorScheme } from '@/constants/Colors';

interface CardProps extends ViewProps {
  onPress?: () => void;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'filled' | 'outlined';
}

export function Card({ 
  children, 
  style, 
  onPress, 
  elevation = 'sm',
  radius = 'md',
  variant = 'filled',
  ...otherProps 
}: CardProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = colorScheme[theme];

  const cardStyles = [
    styles.card,
    radius !== 'none' && styles[`radius-${radius}`],
    elevation !== 'none' && styles[`elevation-${elevation}-${theme}`],
    variant === 'outlined' && {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
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
    <StyledView style={cardStyles} backgroundColor={colors.card} {...otherProps}>
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
    padding: 16,
    overflow: 'hidden',
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
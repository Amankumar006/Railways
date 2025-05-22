import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { StyledText } from './StyledText';
import { Button } from './Button';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  title: string;
  description?: string;
  image?: ImageSourcePropType;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

export function EmptyState({
  title,
  description,
  image,
  icon,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const { colors, theme } = useTheme();
  
  const isCompact = variant === 'compact';
  
  return (
    <View style={[styles.container, isCompact && styles.compactContainer]}>
      {image && (
        <Image 
          source={image} 
          style={[styles.image, isCompact && styles.compactImage]} 
          resizeMode="contain"
        />
      )}
      
      {icon && !image && (
        <View 
          style={[
            styles.iconContainer, 
            { backgroundColor: `${theme.indianRailways.blue}10` },
            isCompact && styles.compactIconContainer
          ]}
        >
          {icon}
        </View>
      )}
      
      <StyledText 
        size={isCompact ? 'lg' : 'xl'} 
        weight="bold" 
        style={styles.title}
        align="center"
      >
        {title}
      </StyledText>
      
      {description && (
        <StyledText 
          size={isCompact ? 'sm' : 'md'} 
          color={colors.textSecondary} 
          style={styles.description}
          align="center"
        >
          {description}
        </StyledText>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size={isCompact ? 'sm' : 'md'}
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  compactContainer: {
    padding: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  compactImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  compactIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    maxWidth: 300,
  },
  actionButton: {
    minWidth: 120,
  },
});

export default EmptyState;

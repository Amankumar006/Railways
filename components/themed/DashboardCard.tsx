import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { StyledText } from './StyledText';
import { useTheme } from '@/hooks/useTheme';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onPress?: () => void;
}

export function DashboardCard({
  title,
  value,
  icon,
  trend,
  variant = 'primary',
  onPress,
}: DashboardCardProps) {
  const { colors, theme } = useTheme();
  
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
  
  const color = getColor();
  
  return (
    <Card
      onPress={onPress}
      elevation="sm"
      radius="md"
      variant="filled"
      style={styles.card}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
      </View>
      
      <StyledText size="sm" color={colors.textSecondary} style={styles.title}>
        {title}
      </StyledText>
      
      <View style={styles.valueContainer}>
        <StyledText size="2xl" weight="bold" style={styles.value}>
          {value}
        </StyledText>
        
        {trend && (
          <View 
            style={[
              styles.trendContainer, 
              { 
                backgroundColor: trend.isPositive 
                  ? `${theme.indianRailways.green}20` 
                  : `${theme.indianRailways.red}20` 
              }
            ]}
          >
            <StyledText 
              size="xs" 
              weight="semibold" 
              color={trend.isPositive ? theme.indianRailways.green : theme.indianRailways.red}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </StyledText>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    marginRight: 8,
  },
  trendContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default DashboardCard;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StyledText } from './themed/StyledText';
import { colors } from '@/constants/Colors';
import { InspectionStatus } from '@/types';

interface StatusBadgeProps {
  status: InspectionStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return colors.warning[500];
      case 'in-progress':
        return colors.primary[500];
      case 'completed':
        return colors.success[500];
      case 'canceled':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };

  return (
    <View
      style={[
        styles.container,
        styles[size],
        { backgroundColor: getStatusColor() + '20' },  // 20% opacity of the status color
      ]}
    >
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <StyledText
        size={size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md'}
        weight="medium"
        style={{ color: getStatusColor() }}
      >
        {getStatusText()}
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  lg: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});
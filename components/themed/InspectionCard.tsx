import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { StyledText } from './StyledText';
import { useTheme } from '@/hooks/useTheme';
import { Calendar, Clock, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react-native';

type InspectionStatus = 'completed' | 'pending' | 'overdue' | 'in-progress';

interface InspectionCardProps {
  coachNumber: string;
  coachType: string;
  inspectionDate: string;
  inspectionTime?: string;
  status: InspectionStatus;
  assignedTo?: string;
  onPress?: () => void;
}

export function InspectionCard({
  coachNumber,
  coachType,
  inspectionDate,
  inspectionTime,
  status,
  assignedTo,
  onPress,
}: InspectionCardProps) {
  const { colors, theme } = useTheme();
  
  // Get status configuration based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          color: theme.indianRailways.green,
          icon: <CheckCircle size={18} color={theme.indianRailways.green} />,
          text: 'Completed',
          variant: 'success' as const,
        };
      case 'pending':
        return {
          color: theme.indianRailways.blue,
          icon: <Clock size={18} color={theme.indianRailways.blue} />,
          text: 'Pending',
          variant: 'accent' as const,
        };
      case 'overdue':
        return {
          color: theme.indianRailways.red,
          icon: <AlertCircle size={18} color={theme.indianRailways.red} />,
          text: 'Overdue',
          variant: 'error' as const,
        };
      case 'in-progress':
        return {
          color: theme.indianRailways.yellow,
          icon: <AlertTriangle size={18} color={theme.indianRailways.yellow} />,
          text: 'In Progress',
          variant: 'warning' as const,
        };
      default:
        return {
          color: colors.textSecondary,
          icon: <Clock size={18} color={colors.textSecondary} />,
          text: 'Unknown',
          variant: 'filled' as const,
        };
    }
  };
  
  const statusConfig = getStatusConfig();
  
  return (
    <Card
      onPress={onPress}
      elevation="sm"
      radius="md"
      variant={statusConfig.variant}
      borderLeft
      style={styles.card}
    >
      <View style={styles.header}>
        <StyledText size="lg" weight="semibold" style={styles.coachNumber}>
          {coachNumber}
        </StyledText>
        <View style={styles.statusContainer}>
          {statusConfig.icon}
          <StyledText 
            size="xs" 
            weight="medium" 
            color={statusConfig.color}
            style={styles.statusText}
          >
            {statusConfig.text}
          </StyledText>
        </View>
      </View>
      
      <StyledText size="sm" color={colors.textSecondary} style={styles.coachType}>
        {coachType}
      </StyledText>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Calendar size={16} color={theme.indianRailways.blue} style={styles.detailIcon} />
          <StyledText size="sm">
            {inspectionDate}
          </StyledText>
        </View>
        
        {inspectionTime && (
          <View style={styles.detailItem}>
            <Clock size={16} color={theme.indianRailways.blue} style={styles.detailIcon} />
            <StyledText size="sm">
              {inspectionTime}
            </StyledText>
          </View>
        )}
      </View>
      
      {assignedTo && (
        <StyledText size="xs" color={colors.textSecondary} style={styles.assignedTo}>
          Assigned to: {assignedTo}
        </StyledText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  coachNumber: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
  },
  coachType: {
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailIcon: {
    marginRight: 4,
  },
  assignedTo: {
    marginTop: 4,
  },
});

export default InspectionCard;

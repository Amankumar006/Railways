import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card } from './Card';
import { StyledText } from './StyledText';
import { useTheme } from '@/hooks/useTheme';
import { Train, Calendar, Clock, MapPin, AlertTriangle, Shield } from 'lucide-react-native';

interface CoachCardProps {
  coachNumber: string;
  coachType: string;
  coachClass?: string;
  manufacturingYear?: string;
  lastInspectionDate?: string;
  maintenanceStatus?: 'good' | 'needs-attention' | 'critical';
  currentLocation?: string;
  onPress?: () => void;
}

export function CoachCard({
  coachNumber,
  coachType,
  coachClass,
  manufacturingYear,
  lastInspectionDate,
  maintenanceStatus = 'good',
  currentLocation,
  onPress,
}: CoachCardProps) {
  const { colors, theme } = useTheme();
  
  // Get status configuration based on maintenance status
  const getStatusConfig = () => {
    switch (maintenanceStatus) {
      case 'good':
        return {
          color: theme.indianRailways.green,
          icon: <Shield size={18} color={theme.indianRailways.green} />,
          text: 'Good Condition',
          variant: 'success' as const,
        };
      case 'needs-attention':
        return {
          color: theme.indianRailways.yellow,
          icon: <AlertTriangle size={18} color={theme.indianRailways.yellow} />,
          text: 'Needs Attention',
          variant: 'warning' as const,
        };
      case 'critical':
        return {
          color: theme.indianRailways.red,
          icon: <AlertTriangle size={18} color={theme.indianRailways.red} />,
          text: 'Critical',
          variant: 'error' as const,
        };
      default:
        return {
          color: theme.indianRailways.green,
          icon: <Shield size={18} color={theme.indianRailways.green} />,
          text: 'Good Condition',
          variant: 'success' as const,
        };
    }
  };
  
  const statusConfig = getStatusConfig();
  
  return (
    <Card
      onPress={onPress}
      elevation="sm"
      radius="md"
      variant="filled"
      borderLeft
      borderLeftColor={statusConfig.color}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Train size={24} color={theme.indianRailways.blue} style={styles.coachIcon} />
          <View>
            <StyledText size="lg" weight="semibold" style={styles.coachNumber}>
              {coachNumber}
            </StyledText>
            <StyledText size="sm" color={colors.textSecondary}>
              {coachType}
            </StyledText>
          </View>
        </View>
        
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
      
      <View style={styles.divider} />
      
      <View style={styles.detailsContainer}>
        {coachClass && (
          <View style={styles.detailItem}>
            <StyledText size="xs" color={colors.textSecondary}>
              Class
            </StyledText>
            <StyledText size="sm" weight="medium">
              {coachClass}
            </StyledText>
          </View>
        )}
        
        {manufacturingYear && (
          <View style={styles.detailItem}>
            <StyledText size="xs" color={colors.textSecondary}>
              Manufactured
            </StyledText>
            <StyledText size="sm" weight="medium">
              {manufacturingYear}
            </StyledText>
          </View>
        )}
        
        {lastInspectionDate && (
          <View style={styles.detailItem}>
            <StyledText size="xs" color={colors.textSecondary}>
              Last Inspection
            </StyledText>
            <StyledText size="sm" weight="medium">
              {lastInspectionDate}
            </StyledText>
          </View>
        )}
      </View>
      
      {currentLocation && (
        <View style={styles.locationContainer}>
          <MapPin size={16} color={theme.indianRailways.blue} style={styles.locationIcon} />
          <StyledText size="sm" color={colors.textSecondary}>
            {currentLocation}
          </StyledText>
        </View>
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
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachIcon: {
    marginRight: 12,
  },
  coachNumber: {
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
  statusText: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    marginRight: 24,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationIcon: {
    marginRight: 4,
  },
});

export default CoachCard;

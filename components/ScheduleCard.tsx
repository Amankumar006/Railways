import React from 'react';
import { StyleSheet, Image, View, useColorScheme } from 'react-native';
import { Card } from './themed/Card';
import { StyledText } from './themed/StyledText';
import { StyledView } from './themed/StyledView';
import { StatusBadge } from './StatusBadge';
import { Schedule } from '@/types';
import { CalendarClock, MapPin, User } from 'lucide-react-native';
import { colors, colorScheme } from '@/constants/Colors';

interface ScheduleCardProps {
  schedule: Schedule;
  onPress: (schedule: Schedule) => void;
}

export function ScheduleCard({ schedule, onPress }: ScheduleCardProps) {
  const theme = useColorScheme() ?? 'light';
  const themeColors = colorScheme[theme];
  
  // Format date to readable string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return colors.success[500];
      case 'medium':
        return colors.warning[500];
      case 'high':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  return (
    <Card 
      style={styles.card} 
      elevation="md"
      onPress={() => onPress(schedule)}
    >
      <View style={styles.header}>
        <View style={styles.coachInfo}>
          <StyledText size="lg" weight="bold" numberOfLines={1}>
            Coach {schedule.coach.number}
          </StyledText>
          <StyledText 
            size="xs" 
            color={themeColors.textSecondary}
            style={styles.coachType}
          >
            {schedule.coach.type} | {schedule.inspectionType.charAt(0).toUpperCase() + schedule.inspectionType.slice(1)} Inspection
          </StyledText>
        </View>
        <StatusBadge status={schedule.status} />
      </View>

      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: schedule.coach.image || 'https://images.pexels.com/photos/5857862/pexels-photo-5857862.jpeg' }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <View 
          style={[
            styles.priorityBadge, 
            { backgroundColor: getPriorityColor(schedule.priority) }
          ]}
        >
          <StyledText size="xs" weight="bold" color={colors.white}>
            {schedule.priority.toUpperCase()}
          </StyledText>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <CalendarClock size={16} color={themeColors.textSecondary} />
          <StyledText size="sm" style={styles.detailText}>
            {formatDate(schedule.scheduledDate)}
          </StyledText>
        </View>
        
        <View style={styles.detailRow}>
          <MapPin size={16} color={themeColors.textSecondary} />
          <StyledText size="sm" style={styles.detailText} numberOfLines={1}>
            {schedule.location}
          </StyledText>
        </View>

        <View style={styles.detailRow}>
          <User size={16} color={themeColors.textSecondary} />
          <StyledText size="sm" style={styles.detailText} numberOfLines={1}>
            {schedule.assignedTo.name}
          </StyledText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  coachInfo: {
    flex: 1,
    marginRight: 8,
  },
  coachType: {
    marginTop: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priorityBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  detailsContainer: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
  },
});
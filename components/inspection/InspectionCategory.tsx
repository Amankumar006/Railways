import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/themed';
import { InspectionCategory as InspectionCategoryType } from '@/types/inspection';
import { InspectionActivity } from './InspectionActivity';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface InspectionCategoryProps {
  category: InspectionCategoryType;
  onCheckStatusChange: (
    categoryId: string,
    activityId: string,
    status: 'pending' | 'checked-okay' | 'checked-not-okay'
  ) => void;
  onRemarksChange: (
    categoryId: string,
    activityId: string,
    remarks: string
  ) => void;
}

export const InspectionCategory: React.FC<InspectionCategoryProps> = ({
  category,
  onCheckStatusChange,
  onRemarksChange,
}) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(true);

  // Calculate progress
  const totalActivities = category.activities.length;
  const completedActivities = category.activities.filter(
    activity => activity.checkStatus === 'checked-okay' || activity.checkStatus === 'checked-not-okay'
  ).length;
  
  const progressPercentage = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 0;

  const handleActivityStatusChange = (
    activityId: string, 
    status: 'pending' | 'checked-okay' | 'checked-not-okay'
  ) => {
    onCheckStatusChange(category.id, activityId, status);
  };

  const handleActivityRemarksChange = (
    activityId: string, 
    remarks: string
  ) => {
    onRemarksChange(category.id, activityId, remarks);
  };

  return (
    <View style={[styles.container, { borderColor: '#e0e0e0' }]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <StyledText style={styles.categoryNumber}>
            {category.category_number}
          </StyledText>
          <StyledText style={styles.categoryName}>
            {category.name}
          </StyledText>
        </View>
        
        <View style={styles.headerRight}>
          <StyledText style={styles.progressText}>
            {completedActivities}/{totalActivities} ({progressPercentage}%)
          </StyledText>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#333333" 
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.activitiesContainer}>
          {category.description && (
            <StyledText style={styles.description}>
              {category.description}
            </StyledText>
          )}
          
          {category.activities.map(activity => (
            <InspectionActivity
              key={activity.id}
              activity={activity}
              onCheckStatusChange={handleActivityStatusChange}
              onRemarksChange={handleActivityRemarksChange}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryNumber: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 40,
  },
  categoryName: {
    fontWeight: 'bold',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    marginRight: 8,
    fontSize: 12,
  },
  activitiesContainer: {
    padding: 12,
    paddingTop: 0,
  },
  description: {
    fontStyle: 'italic',
    marginBottom: 12,
    opacity: 0.8,
  },
});

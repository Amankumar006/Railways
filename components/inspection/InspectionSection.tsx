import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/themed';
import { InspectionSection as InspectionSectionType } from '@/types/inspection';
import { InspectionCategory } from './InspectionCategory';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface InspectionSectionProps {
  section: InspectionSectionType;
  onToggleExpand: (sectionId: string) => void;
  onCheckStatusChange: (
    sectionId: string,
    categoryId: string,
    activityId: string,
    status: 'pending' | 'checked-okay' | 'checked-not-okay'
  ) => void;
  onRemarksChange: (
    sectionId: string,
    categoryId: string,
    activityId: string,
    remarks: string
  ) => void;
}

export const InspectionSection: React.FC<InspectionSectionProps> = ({
  section,
  onToggleExpand,
  onCheckStatusChange,
  onRemarksChange,
}) => {
  const { colors } = useTheme();

  // Calculate progress for the entire section
  let totalActivities = 0;
  let completedActivities = 0;

  section.categories.forEach(category => {
    totalActivities += category.activities.length;
    completedActivities += category.activities.filter(
      activity => activity.checkStatus === 'checked-okay' || activity.checkStatus === 'checked-not-okay'
    ).length;
  });

  const progressPercentage = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 0;

  const handleCategoryStatusChange = (
    categoryId: string,
    activityId: string,
    status: 'pending' | 'checked-okay' | 'checked-not-okay'
  ) => {
    onCheckStatusChange(section.id, categoryId, activityId, status);
  };

  const handleCategoryRemarksChange = (
    categoryId: string,
    activityId: string,
    remarks: string
  ) => {
    onRemarksChange(section.id, categoryId, activityId, remarks);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.header, { backgroundColor: '#0056b3' }]} 
        onPress={() => onToggleExpand(section.id)}
        activeOpacity={0.8}
      >
        <View style={styles.titleContainer}>
          <StyledText style={[styles.sectionNumber, { color: '#ffffff' }]}>
            {section.section_number}
          </StyledText>
          <StyledText style={[styles.sectionName, { color: '#ffffff' }]}>
            {section.name}
          </StyledText>
        </View>
        
        <View style={styles.headerRight}>
          <StyledText style={[styles.progressText, { color: '#ffffff' }]}>
            {completedActivities}/{totalActivities} ({progressPercentage}%)
          </StyledText>
          <Ionicons 
            name={section.expanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#ffffff" 
          />
        </View>
      </TouchableOpacity>

      {section.expanded && (
        <View style={styles.categoriesContainer}>
          {section.description && (
            <StyledText style={styles.description}>
              {section.description}
            </StyledText>
          )}
          
          {section.categories.map(category => (
            <InspectionCategory
              key={category.id}
              category={category}
              onCheckStatusChange={handleCategoryStatusChange}
              onRemarksChange={handleCategoryRemarksChange}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  sectionNumber: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  sectionName: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    marginRight: 8,
    fontSize: 14,
  },
  categoriesContainer: {
    padding: 16,
    paddingTop: 8,
  },
  description: {
    marginBottom: 16,
  },
});

import React, { useState, memo } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { StyledText, Button } from '@/components/themed';
import { InspectionActivity as InspectionActivityType } from '@/types/inspection';
import { useTheme } from '@/hooks/useTheme';
import { getColorValue, COLORS } from '@/utils/colorUtils';

interface InspectionActivityProps {
  activity: InspectionActivityType;
  onCheckStatusChange: (
    activityId: string,
    status: 'pending' | 'checked-okay' | 'checked-not-okay'
  ) => void;
  onRemarksChange: (activityId: string, remarks: string) => void;
}

// Define the component with proper TypeScript typing for memo
const InspectionActivityComponent: React.FC<InspectionActivityProps> = ({
  activity,
  onCheckStatusChange,
  onRemarksChange,
}) => {
  const { colors } = useTheme();
  const [showRemarks, setShowRemarks] = useState(
    activity.checkStatus === 'checked-not-okay' || activity.remarks.length > 0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-okay':
        return getColorValue(colors.success, COLORS.SUCCESS);
      case 'checked-not-okay':
        return getColorValue(colors.error, COLORS.ERROR);
      default:
        return getColorValue(colors.border, COLORS.BORDER);
    }
  };

  const handleStatusChange = (status: 'pending' | 'checked-okay' | 'checked-not-okay') => {
    onCheckStatusChange(activity.id, status);
    
    // Automatically show remarks field when status is not okay
    if (status === 'checked-not-okay') {
      setShowRemarks(true);
    }
  };

  return (
    <View style={[styles.container, { borderColor: getColorValue(colors.border, COLORS.BORDER) }]}>
      <View style={styles.header}>
        <StyledText style={styles.activityNumber}>
          {activity.activity_number}
        </StyledText>
        <StyledText 
          style={[
            styles.activityText,
            activity.is_compulsory && { fontWeight: 'bold' }
          ]}
        >
          {activity.activity_text}
          {activity.is_compulsory && <StyledText style={{ color: '#f44336' }}> *</StyledText>}
        </StyledText>
      </View>

      <View style={styles.actionRow}>
        <Button
          title="OK"
          size="sm"
          variant={activity.checkStatus === 'checked-okay' ? 'primary' : 'outline'}
          onPress={() => handleStatusChange('checked-okay')}
          style={{ ...styles.actionButton, ...(activity.checkStatus === 'checked-okay' ? { backgroundColor: '#4caf50' } : {}) }}
        />
        <Button
          title="Not OK"
          size="sm"
          variant={activity.checkStatus === 'checked-not-okay' ? 'primary' : 'outline'}
          onPress={() => handleStatusChange('checked-not-okay')}
          style={{ ...styles.actionButton, ...(activity.checkStatus === 'checked-not-okay' ? { backgroundColor: '#f44336' } : {}) }}
        />
        <Button
          title="Remarks"
          size="sm"
          variant="outline"
          onPress={() => setShowRemarks(!showRemarks)}
          style={styles.actionButton}
        />
      </View>

      {showRemarks && (
        <TextInput
          style={[
            styles.remarksInput,
            { 
              borderColor: getColorValue(colors.border, COLORS.BORDER),
              backgroundColor: getColorValue(colors.card, COLORS.CARD_BACKGROUND),
              color: getColorValue(colors.text, COLORS.TEXT)
            }
          ]}
          placeholder="Enter remarks here..."
          placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
          multiline
          value={activity.remarks}
          onChangeText={(text) => onRemarksChange(activity.id, text)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  activityNumber: {
    minWidth: 40,
    fontWeight: '500',
  },
  activityText: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  actionButton: {
    marginRight: 8,
    minWidth: 80,
  },
  remarksInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    minHeight: 80,
  },
});

// Export the memoized component
export const InspectionActivity = memo(InspectionActivityComponent);


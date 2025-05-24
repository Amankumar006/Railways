import React from 'react';
import { View, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { StyledText, Button, Card } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { getColorValue, COLORS } from '@/utils/colorUtils';

interface TripReportFormProps {
  trainNumber: string;
  trainName: string;
  location: string;
  redOnTime: string;
  redOffTime: string;
  onTrainNumberChange: (value: string) => void;
  onTrainNameChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onRedOnTimeChange: (value: string) => void;
  onRedOffTimeChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export const TripReportForm: React.FC<TripReportFormProps> = ({
  trainNumber,
  trainName,
  location,
  redOnTime,
  redOffTime,
  onTrainNumberChange,
  onTrainNameChange,
  onLocationChange,
  onRedOnTimeChange,
  onRedOffTimeChange,
  onSubmit,
  submitting,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.container}>
      <StyledText style={styles.title}>Trip Information</StyledText>
      
      <View style={styles.formRow}>
        <View style={styles.formGroup}>
          <StyledText style={styles.label}>Train Number *</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: colors.border,
                backgroundColor: colors.card,
                color: colors.text
              }
            ]}
            value={trainNumber}
            onChangeText={onTrainNumberChange}
            placeholder="Enter train number"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <StyledText style={styles.label}>Train Name</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: colors.border,
                backgroundColor: colors.card,
                color: colors.text
              }
            ]}
            value={trainName}
            onChangeText={onTrainNameChange}
            placeholder="Enter train name"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
          />
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <StyledText style={styles.label}>Location *</StyledText>
        <TextInput
          style={[
            styles.input,
            { 
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text
            }
          ]}
          value={location}
          onChangeText={onLocationChange}
          placeholder="Enter inspection location"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      
      <View style={styles.formRow}>
        <View style={styles.formGroup}>
          <StyledText style={styles.label}>RED On Time</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: colors.border,
                backgroundColor: colors.card,
                color: colors.text
              }
            ]}
            value={redOnTime}
            onChangeText={onRedOnTimeChange}
            placeholder="HH:MM"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <StyledText style={styles.label}>RED Off Time</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: colors.border,
                backgroundColor: colors.card,
                color: colors.text
              }
            ]}
            value={redOffTime}
            onChangeText={onRedOffTimeChange}
            placeholder="HH:MM"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <StyledText style={styles.requiredNote}>* Required fields</StyledText>
        <Button
          title={!submitting ? "Submit Report" : undefined}
          onPress={onSubmit}
          disabled={submitting || !trainNumber || !location}
          style={styles.submitButton}
          icon={submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formGroup: {
    flex: 1,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  requiredNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  submitButton: {
    minWidth: 150,
  },
});

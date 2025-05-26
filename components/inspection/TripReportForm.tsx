import React from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Text, Platform } from 'react-native';
import { StyledText, Button, Card } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { getColorValue, COLORS } from '@/utils/colorUtils';
import { Picker } from '@react-native-picker/picker';

interface TripReportFormProps {
  trainNumber: string;
  trainName: string;
  location: string;
  lineNumber: string;
  redOnTime: string;
  redOffTime: string;
  onTrainNumberChange: (value: string) => void;
  onTrainNameChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onLineNumberChange: (value: string) => void;
  onRedOnTimeChange: (value: string) => void;
  onRedOffTimeChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  disableLocation?: boolean;
}

export const TripReportForm: React.FC<TripReportFormProps> = ({
  trainNumber,
  trainName,
  location,
  lineNumber,
  redOnTime,
  redOffTime,
  onTrainNumberChange,
  onTrainNameChange,
  onLocationChange,
  onLineNumberChange,
  onRedOnTimeChange,
  onRedOffTimeChange,
  onSubmit,
  submitting,
  disableLocation = false,
}) => {
  const { colors, theme } = useTheme();

  return (
    <Card 
      style={styles.formCard}
      variant="accent"
      borderLeft={true}
      borderLeftColor={theme.indianRailways.blue}
    >
      <StyledText style={[styles.title, { color: theme.indianRailways.blue }]}>Trip Informations</StyledText>
      
      <View style={styles.formRow}>
        <View style={styles.formGroup}>
          <StyledText style={[styles.label, { color: theme.indianRailways.blue }]}>Train Number *</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: theme.indianRailways.blue,
                backgroundColor: '#FFFFFF',
                color: '#000000'
              }
            ]}
            value={trainNumber}
            onChangeText={onTrainNumberChange}
            placeholder="Enter train number"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <StyledText style={[styles.label, { color: theme.indianRailways.blue }]}>Train Name</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: theme.indianRailways.blue,
                backgroundColor: '#FFFFFF',
                color: '#000000'
              }
            ]}
            value={trainName}
            onChangeText={onTrainNameChange}
            placeholder="Enter train name"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
          />
        </View>
      </View>
      
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <StyledText style={[styles.label, { color: theme.indianRailways.blue }]}>Location * <StyledText style={styles.fixedText}>{disableLocation ? '(Fixed)' : ''}</StyledText></StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: theme.indianRailways.blue,
                backgroundColor: disableLocation ? '#f0f0f0' : '#FFFFFF',
                color: disableLocation ? '#555' : '#000000',
                fontWeight: disableLocation ? 'bold' : 'normal'
              }
            ]}
            value={location}
            onChangeText={onLocationChange}
            placeholder="Enter inspection location"
            placeholderTextColor={colors.textSecondary}
            editable={!disableLocation}
          />
        </View>
        
        <View style={[styles.formGroup, { flex: 1 }]}>
          <StyledText style={[styles.label, { color: theme.indianRailways.blue }]}>Line No.</StyledText>
          <View style={[
            styles.input,
            {
              borderColor: theme.indianRailways.blue,
              backgroundColor: '#FFFFFF',
              padding: 0,
              overflow: 'hidden'
            }
          ]}>
            <Picker
              selectedValue={lineNumber}
              onValueChange={onLineNumberChange}
              style={{ 
                height: 40, 
                width: '100%',
                backgroundColor: '#FFFFFF',
                color: '#666666',
              }}
              itemStyle={{
                backgroundColor: '#FFFFFF',
                color: '#666666',
                fontSize: 16  
              }}
              dropdownIconColor={theme.indianRailways.blue}
            >
              <Picker.Item label="Select Line No." value="" />
              <Picker.Item label="09" value="09" color="#000000" />
              <Picker.Item label="10" value="10" color="#000000" />
              <Picker.Item label="11" value="11" color="#000000" />
              <Picker.Item label="12" value="12" color="#000000" />
            </Picker>
          </View>
        </View>
      </View>
      
      <View style={styles.formRow}>
        <View style={styles.formGroup}>
          <StyledText style={[styles.label, { color: theme.indianRailways.blue }]}>Red On Time</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: theme.indianRailways.blue,
                backgroundColor: '#FFFFFF',
                color: '#000000'
              }
            ]}
            value={redOnTime}
            onChangeText={(text) => {
              // Only allow digits and colon in format HH:MM
              const formattedText = text.replace(/[^0-9:]/g, '');
              
              // Auto-insert colon after hours are entered
              let finalText = formattedText;
              if (formattedText.length === 2 && !formattedText.includes(':') && text.length > redOnTime.length) {
                finalText = `${formattedText}:`;
              }
              
              // Basic format validation for HH:MM (24-hour format)
              if (finalText === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(finalText) || /^([0-1]?[0-9]|2[0-3])(:[0-5]?)?$/.test(finalText)) {
                onRedOnTimeChange(finalText);
              }
            }}
            placeholder="HH:MM (24-hour)"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
        
        <View style={styles.formGroup}>
          <StyledText style={[styles.label, { color: theme.indianRailways.blue }]}>Red Off Time</StyledText>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: theme.indianRailways.blue,
                backgroundColor: '#FFFFFF',
                color: '#000000'
              }
            ]}
            value={redOffTime}
            onChangeText={(text) => {
              // Only allow digits and colon in format HH:MM
              const formattedText = text.replace(/[^0-9:]/g, '');
              
              // Auto-insert colon after hours are entered
              let finalText = formattedText;
              if (formattedText.length === 2 && !formattedText.includes(':') && text.length > redOffTime.length) {
                finalText = `${formattedText}:`;
              }
              
              // Basic format validation for HH:MM (24-hour format)
              if (finalText === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(finalText) || /^([0-1]?[0-9]|2[0-3])(:[0-5]?)?$/.test(finalText)) {
                onRedOffTimeChange(finalText);
              }
            }}
            placeholder="HH:MM (24-hour)"
            placeholderTextColor={getColorValue(colors.textSecondary, COLORS.TEXT_SECONDARY)}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
      </View>
      
      <StyledText style={[styles.requiredNote, { color: theme.indianRailways.blue }]}>* Required fields</StyledText>
    </Card>
  );
};

// Create a separate submit section component
interface SubmitSectionProps {
  onSubmit: () => void;
  submitting: boolean;
  inspectionProgress: number;
  disabled: boolean;
}

export const SubmitSection: React.FC<SubmitSectionProps> = ({
  onSubmit,
  submitting,
  inspectionProgress,
  disabled
}) => {
  const { colors, theme } = useTheme();
  
  // Debug logging
  console.log('SubmitSection render:', {
    inspectionProgress,
    disabled,
    submitting,
    canSubmit: !disabled && !submitting && inspectionProgress >= 80
  });
  
  return (
    <Card 
      style={[styles.submitCard, { backgroundColor: colors.card }]}
      variant="accent"
      borderLeft={true}
      borderLeftColor={theme.indianRailways.blue}
    >
      <View style={styles.progressInfo}>
        <StyledText style={[styles.progressText, { color: theme.indianRailways.blue }]}>
          Inspection Progress: {inspectionProgress}%
        </StyledText>
        {inspectionProgress < 80 && (
          <StyledText style={[styles.progressNote, { color: colors.textSecondary }]}>
            Complete at least 80% of inspection activities to submit the report
          </StyledText>
        )}
      </View>
      <Button
        title={!submitting ? "Submit Report" : undefined}
        onPress={onSubmit}
        disabled={disabled || submitting || inspectionProgress < 80}
        style={styles.submitButton}
        variant="primary"
        icon={submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  formCard: {
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
    color: '#B8B8B8',
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    height: 40,
  },
  requiredNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  submitCard: {
    padding: 16,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  submitButton: {
    minWidth: '100%',
    height: 48,
  },
  fixedText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#555',
  },
});

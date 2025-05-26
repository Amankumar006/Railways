import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { logDebug, logError } from '@/utils/logger';
import { showError } from '@/utils/errorHandler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header, StyledText } from '@/components/themed';
import { useAuth } from '@/context/AuthContext';
import { useInspectionData } from '@/hooks/useInspectionData';
import { 
  InspectionSection, 
  TripReportForm,
  SubmitSection
} from '@/components/inspection';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
export default function TripsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    loading,
    sections,
    tripReportId,
    trainNumber,
    trainName,
    redOnTime,
    redOffTime,
    location,
    lineNumber,
    submitting,
    setTrainNumber,
    setTrainName,
    setRedOnTime,
    setRedOffTime,
    setLocation,
    setLineNumber,
    checkExistingDraftReport,
    loadExistingReport,
    toggleSection,
    handleCheckStatusChange,
    handleRemarksChange,
    submitReport,
    ensureAllActivitiesHaveResults,
    status
  } = useInspectionData();

  useEffect(() => {
    logDebug('TripsScreen useEffect triggered with tripId:', tripId);
    if (tripId) {
      // If a specific trip ID is provided, load that report
      logDebug('Loading existing report with ID:', tripId);
      loadExistingReport(tripId);
    } else {
      // Otherwise check for existing drafts or create a new one
      logDebug('Checking for existing draft report or creating new one');
      checkExistingDraftReport();
    }
  }, [tripId]);

  // Set location to JSDG permanently
  useEffect(() => {
    // Always set location to JSDG regardless of what's loaded from DB
    setLocation("JSDG");
    // Run this effect on every render to ensure location is always JSDG
  }, []); // Empty dependency array to run once, but we'll force the value in the UI



  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (tripReportId) {
        await loadExistingReport(tripReportId);
      } else if (tripId) {
        await loadExistingReport(tripId);
      } else {
        await checkExistingDraftReport();
      }
    } catch (error) {
      logError('Error refreshing data:', error);
      showError({ message: 'Failed to refresh data. Please try again.' });
    } finally {
      setRefreshing(false);
    }
  }, [tripReportId, tripId]);

  const handleSubmitReport = async () => {
    try {
      if (!tripReportId) {
        showError({ message: 'Report ID is missing. Cannot submit report.' });
        return;
      }
      
      // First ensure all activities have results
      await ensureAllActivitiesHaveResults(tripReportId);
      
      // Then submit the report
      await submitReport();
      
      // Navigate back after successful submission
      router.push('/reports');
    } catch (error) {
      logError('Error submitting report:', error);
      showError({ message: 'Failed to submit report. Please try again.' });
    }
  };

  // Calculate inspection progress
  const calculateInspectionProgress = () => {
    let totalActivities = 0;
    let completedActivities = 0;

    sections.forEach(section => {
      section.categories.forEach(category => {
        category.activities.forEach(activity => {
          totalActivities++;
          if (activity.checkStatus === 'checked-okay' || activity.checkStatus === 'checked-not-okay') {
            completedActivities++;
          }
        });
      });
    });

    return totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  };



  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <StyledText style={styles.loadingText}>Loading inspection data...</StyledText>
      </View>
    );
  }

  const inspectionProgress = calculateInspectionProgress();
  
  // Debug the submit button state
  // Temporarily remove trainNumber requirement for testing
  const isDisabled = !location;
  console.log('Submit button debug:', {
    trainNumber: `"${trainNumber}"`,
    location: `"${location}"`,
    isDisabled,
    inspectionProgress,
    submitting,
    status,
    tripId
  });

  logDebug('TripsScreen render - loading:', loading, 'sections.length:', sections.length, 'tripReportId:', tripReportId);

  return (
    <View style={styles.container}>
      <Header title="Inspection Checklist" showBackButton />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        <TripReportForm
          trainNumber={trainNumber}
          trainName={trainName}
          location={"JSDG"}
          lineNumber={lineNumber}
          redOnTime={redOnTime}
          redOffTime={redOffTime}
          onTrainNumberChange={setTrainNumber}
          onTrainNameChange={setTrainName}
          onLocationChange={(value) => {
            // Always preserve JSDG value
            setLocation("JSDG");
          }}
          onLineNumberChange={setLineNumber}
          onRedOnTimeChange={setRedOnTime}
          onRedOffTimeChange={setRedOffTime}
          disableLocation={true}
          onSubmit={handleSubmitReport}
          submitting={submitting}
        />
        
        {sections.length > 0 ? (
          sections.map(section => (
            <InspectionSection
              key={section.id}
              section={section}
              onToggleExpand={toggleSection}
              onCheckStatusChange={handleCheckStatusChange}
              onRemarksChange={handleRemarksChange}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <StyledText style={styles.emptyText}>
              No inspection checklist available. Please try refreshing.
            </StyledText>
          </View>
        )}

        {/* Submit section at the bottom of the scrollable content */}
        {(!tripId || status === 'draft') && (
          <SubmitSection
            onSubmit={handleSubmitReport}
            submitting={submitting}
            inspectionProgress={inspectionProgress}
            disabled={isDisabled}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32, // Extra padding at the bottom for better spacing
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },

});

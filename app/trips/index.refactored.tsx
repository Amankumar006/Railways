import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header, StyledText } from '@/components/themed';
import { useAuth } from '@/context/AuthContext';
import { useInspectionData } from '@/hooks/useInspectionData';
import { 
  InspectionSection, 
  TripReportForm 
} from '@/components/inspection';
import { useTheme } from '@/hooks/useTheme';

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
    submitting,
    setTrainNumber,
    setTrainName,
    setRedOnTime,
    setRedOffTime,
    setLocation,
    checkExistingDraftReport,
    loadExistingReport,
    toggleSection,
    handleCheckStatusChange,
    handleRemarksChange,
    submitReport
  } = useInspectionData();

  useEffect(() => {
    if (tripId) {
      // If a specific trip ID is provided, load that report
      loadExistingReport(tripId);
    } else {
      // Otherwise check for existing drafts or create a new one
      checkExistingDraftReport();
    }
  }, [tripId]);

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
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [tripReportId, tripId]);

  const handleSubmitReport = async () => {
    await submitReport();
    // Navigate back after successful submission
    router.push('/reports');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StyledText style={styles.loadingText}>Loading inspection data...</StyledText>
      </View>
    );
  }

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
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <TripReportForm
          trainNumber={trainNumber}
          trainName={trainName}
          location={location}
          redOnTime={redOnTime}
          redOffTime={redOffTime}
          onTrainNumberChange={setTrainNumber}
          onTrainNameChange={setTrainName}
          onLocationChange={setLocation}
          onRedOnTimeChange={setRedOnTime}
          onRedOffTimeChange={setRedOffTime}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
});

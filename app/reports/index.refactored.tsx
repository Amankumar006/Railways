import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Header, Button } from '@/components/themed';
import { ReportFilter, ReportsList } from '@/components/reports';
import { useReportsData } from '@/hooks/useReportsData';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reports screen with pagination, filtering, and optimized performance
 */
export default function ReportsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // Use our custom hook for reports data
  const {
    reports,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    filterStatus,
    setFilterStatus,
    deleteReport
  } = useReportsData();

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing reports:', error);
      Alert.alert('Error', 'Failed to refresh reports. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle delete
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  };

  // Navigate to new inspection
  const handleNewInspection = () => {
    router.push('/trips');
  };

  // Show inspector names in report cards for supervisors and managers
  const showInspectorNames = user?.role === 'supervisor' || user?.role === 'manager';

  return (
    <View style={styles.container}>
      <Header title="Inspection Reports" />
      
      <View style={styles.content}>
        <View style={styles.topBar}>
          <ReportFilter
            currentFilter={filterStatus}
            onFilterChange={setFilterStatus}
          />
          
          <Button
            title="New Inspection"
            onPress={handleNewInspection}
            icon={() => <Ionicons name="add-circle-outline" size={18} color={colors.white} />}
          />
        </View>
        
        <ReportsList
          reports={reports}
          isLoading={isLoading}
          isError={isError}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onDelete={handleDeleteReport}
          showInspectorName={showInspectorNames}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

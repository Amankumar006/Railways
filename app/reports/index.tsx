import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from 'react-native';
import { colorScheme } from '@/constants/Colors';
import { Check, X, Eye } from 'lucide-react-native';

// Define the trip report type
type TripReport = {
  id: string;
  inspector_id: string;
  train_number: string;
  location: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at: string | null;
  inspector: {
    id: string;
    name: string;
    email: string;
  } | null;
  stats?: {
    total_activities: number;
    checked_okay: number;
    checked_not_okay: number;
    unchecked: number;
  };
};

export default function ReportsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  const [reports, setReports] = useState<TripReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load reports on component mount
  useEffect(() => {
    if (user?.role !== 'manager') {
      // Redirect non-managers
      Alert.alert('Access Denied', 'You need manager privileges to access this page.');
      router.replace('/');
      return;
    }
    
    fetchReports();
  }, [user]);
  
  // Fetch submitted trip reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Get all submitted trip reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('trip_reports')
        .select(`
          *,
          inspector:inspector_id(id, name, email)
        `)
        .in('status', ['submitted', 'approved', 'rejected'])
        .order('created_at', { ascending: false });
        
      if (reportsError) {
        throw reportsError;
      }
      
      // Get activity statistics for each report
      const reportsWithStats = await Promise.all(
        (reportsData || []).map(async (report) => {
          // Get total activities count
          const { count: totalActivities, error: countError } = await supabase
            .from('inspection_activities')
            .select('*', { count: 'exact', head: true });
            
          if (countError) {
            console.error('Error counting activities:', countError);
            return report;
          }
          
          // Get checked-okay activities
          const { data: checkedOkay, error: okError } = await supabase
            .from('trip_activity_results')
            .select('*', { count: 'exact' })
            .eq('trip_report_id', report.id)
            .eq('check_status', 'checked-okay');
            
          if (okError) {
            console.error('Error counting checked-okay:', okError);
            return report;
          }
          
          // Get checked-not-okay activities
          const { data: checkedNotOkay, error: notOkError } = await supabase
            .from('trip_activity_results')
            .select('*', { count: 'exact' })
            .eq('trip_report_id', report.id)
            .eq('check_status', 'checked-not-okay');
            
          if (notOkError) {
            console.error('Error counting checked-not-okay:', notOkError);
            return report;
          }
          
          return {
            ...report,
            stats: {
              total_activities: totalActivities || 0,
              checked_okay: checkedOkay?.length || 0,
              checked_not_okay: checkedNotOkay?.length || 0,
              unchecked: (totalActivities || 0) - ((checkedOkay?.length || 0) + (checkedNotOkay?.length || 0))
            }
          };
        })
      );
      
      setReports(reportsWithStats);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };
  
  // View report details
  const handleViewReport = (reportId: string) => {
    router.push(`/trips?id=${reportId}&mode=review`);
  };
  
  // Approve a report
  const handleApproveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('trip_reports')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', reportId);
        
      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Report has been approved.');
      fetchReports();
    } catch (error) {
      console.error('Error approving report:', error);
      Alert.alert('Error', 'Failed to approve report. Please try again.');
    }
  };
  
  // Reject a report
  const handleRejectReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('trip_reports')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id
        })
        .eq('id', reportId);
        
      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Report has been rejected.');
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      Alert.alert('Error', 'Failed to reject report. Please try again.');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#f39c12';
      case 'approved': return '#2ecc71';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading && !refreshing) {
    return (
      <StyledView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <StyledText style={{ marginTop: 20 }}>Loading reports...</StyledText>
      </StyledView>
    );
  }
  
  return (
    <StyledView style={styles.container}>
      <View style={styles.header}>
        <StyledText size="xl" weight="bold">Trip Reports</StyledText>
        <StyledText>Review and manage inspection reports</StyledText>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
      >
        {reports.length === 0 ? (
          <StyledView style={styles.emptyState}>
            <StyledText size="lg">No reports to review</StyledText>
            <StyledText style={{ marginTop: 10, textAlign: 'center' }}>
              When inspectors submit their reports, they will appear here for your review.
            </StyledText>
          </StyledView>
        ) : (
          reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View>
                  <StyledText size="lg" weight="bold">
                    Train {report.train_number || 'Unnamed'}
                  </StyledText>
                  <StyledText size="sm" style={{ marginTop: 5 }}>
                    Location: {report.location || 'Not specified'}
                  </StyledText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                  <StyledText size="sm" style={styles.statusText}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </StyledText>
                </View>
              </View>
              
              <View style={styles.inspector}>
                <StyledText size="sm">
                  Inspector: {report.inspector?.name || 'Unknown'}
                </StyledText>
                <StyledText size="sm">
                  Submitted: {formatDate(report.submitted_at)}
                </StyledText>
              </View>
              
              {report.stats && (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <StyledText size="lg" weight="bold" style={{ color: '#2ecc71' }}>
                      {report.stats.checked_okay}
                    </StyledText>
                    <StyledText size="sm">OK</StyledText>
                  </View>
                  <View style={styles.statItem}>
                    <StyledText size="lg" weight="bold" style={{ color: '#e74c3c' }}>
                      {report.stats.checked_not_okay}
                    </StyledText>
                    <StyledText size="sm">Issues</StyledText>
                  </View>
                  <View style={styles.statItem}>
                    <StyledText size="lg" weight="bold" style={{ color: '#95a5a6' }}>
                      {report.stats.unchecked}
                    </StyledText>
                    <StyledText size="sm">Unchecked</StyledText>
                  </View>
                  <View style={styles.statItem}>
                    <StyledText size="lg" weight="bold">
                      {report.stats.total_activities}
                    </StyledText>
                    <StyledText size="sm">Total</StyledText>
                  </View>
                </View>
              )}
              
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#3498db' }]}
                  onPress={() => handleViewReport(report.id)}
                >
                  <Eye size={18} color="#fff" />
                  <StyledText size="sm" style={styles.actionText}>View</StyledText>
                </TouchableOpacity>
                
                {report.status === 'submitted' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
                      onPress={() => handleApproveReport(report.id)}
                    >
                      <Check size={18} color="#fff" />
                      <StyledText size="sm" style={styles.actionText}>Approve</StyledText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
                      onPress={() => handleRejectReport(report.id)}
                    >
                      <X size={18} color="#fff" />
                      <StyledText size="sm" style={styles.actionText}>Reject</StyledText>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  reportCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inspector: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  actionText: {
    color: 'white',
    marginLeft: 5,
  },
});

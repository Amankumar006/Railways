import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { 
  StyledView, 
  StyledText, 
  Header, 
  Card, 
  DashboardCard, 
  ProgressBar 
} from '@/components/themed';
import { 
  File, 
  Train, 
  BarChart2, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ClipboardList,
  Settings,
  Eye,
  Download
} from 'lucide-react-native';
import { generateTripReport, sharePDF } from '@/utils/pdfGenerator';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { colors, theme } = useTheme();
  const isManager = user?.role === 'manager';
  
  // State for trip reports data
  const [loading, setLoading] = useState(true);
  const [tripReports, setTripReports] = useState<any[]>([]);
  
  // Extra security check - redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
    
    // Log user role for debugging
    console.log('Current user role:', user?.role);
  }, [isAuthenticated, router, user]);
  
  // Fetch trip reports
  useEffect(() => {
    const fetchTripReports = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Check if trip_reports table exists by trying to get schema
        const { error: schemaError } = await supabase
          .from('trip_reports')
          .select('count')
          .limit(1);
        
        // If table doesn't exist or other error, use mock data
        if (schemaError) {
          console.log('Using mock data due to schema error:', schemaError);
          // No data found, use mock data
          const mockReports = [
            {
              id: 'mock-draft',
              train_number: '22222',
              train_name: 'Duronto Express',
              departure_station: 'Chennai',
              arrival_station: 'Kolkata',
              inspection_date: new Date().toISOString(),
              status: 'draft',
              created_at: new Date().toISOString(),
              coach_count: 2,
              issues_count: 1,
              progress: 60
            },
            {
              id: 'mock-1',
              train_number: '12345',
              train_name: 'Rajdhani Express',
              departure_station: 'New Delhi',
              arrival_station: 'Mumbai Central',
              inspection_date: new Date().toISOString(),
              status: 'submitted',
              created_at: new Date().toISOString(),
              coach_count: 3,
              issues_count: 2
            },
            {
              id: 'mock-2',
              train_number: '54321',
              train_name: 'Shatabdi Express',
              departure_station: 'Howrah',
              arrival_station: 'New Delhi',
              inspection_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              status: 'approved',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              coach_count: 5,
              issues_count: 0
            }
          ];
          setTripReports(mockReports);
        } else {
          // Table exists, try to fetch data
          let query;
          
          if (isManager) {
            // Managers only see submitted trip reports
            query = supabase
              .from('trip_reports')
              .select('*')
              .eq('status', 'submitted')
              .order('created_at', { ascending: false });
          } else {
            // Inspectors only see their own reports
            query = supabase
              .from('trip_reports')
              .select('*')
              .eq('inspector_id', user.id)
              .order('created_at', { ascending: false });
          }
          
          const { data, error } = await query;
          
          if (error) {
            console.error('Error fetching trip reports:', error);
            setTripReports([]);
          } else if (data && data.length > 0) {
            console.log('Fetched trip reports:', data.length);
            setTripReports(data);
          } else {
            // No data found, use mock data
            const mockReports = [
              {
                id: 'mock-1',
                train_number: '12345',
                train_name: 'Rajdhani Express',
                departure_station: 'New Delhi',
                arrival_station: 'Mumbai Central',
                inspection_date: new Date().toISOString(),
                status: 'submitted',
                created_at: new Date().toISOString(),
                coach_count: 3,
                issues_count: 2
              },
              {
                id: 'mock-2',
                train_number: '54321',
                train_name: 'Shatabdi Express',
                departure_station: 'Howrah',
                arrival_station: 'New Delhi',
                inspection_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                status: 'approved',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                coach_count: 5,
                issues_count: 0
              }
            ];
            setTripReports(mockReports);
          }
        }
      } catch (error) {
        console.error('Failed to fetch trip reports:', error);
        // Fallback to mock data on any error
        const mockReports = [
          {
            id: 'mock-draft',
            train_number: '22222',
            train_name: 'Duronto Express',
            departure_station: 'Chennai',
            arrival_station: 'Kolkata',
            inspection_date: new Date().toISOString(),
            status: 'draft',
            created_at: new Date().toISOString(),
            coach_count: 2,
            issues_count: 1,
            progress: 60
          },
          {
            id: 'mock-1',
            train_number: '12345',
            train_name: 'Rajdhani Express',
            departure_station: 'New Delhi',
            arrival_station: 'Mumbai Central',
            inspection_date: new Date().toISOString(),
            status: 'submitted',
            created_at: new Date().toISOString(),
            coach_count: 3,
            issues_count: 2
          },
          {
            id: 'mock-2',
            train_number: '54321',
            train_name: 'Shatabdi Express',
            departure_station: 'Howrah',
            arrival_station: 'New Delhi',
            inspection_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            status: 'approved',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            coach_count: 5,
            issues_count: 0
          }
        ];
        setTripReports(mockReports);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripReports();
  }, [user, isManager]);
  
  // Navigation handlers
  const handleTripPress = () => {
    router.push('/trips');
  };
  
  const handleReportsPress = () => {
    if (isManager) {
      router.push('/reports');
    }
  };
  
  const handleUsersPress = () => {
    if (isManager) {
      router.push('/users');
    }
  };
  
  // Handler for viewing a report
  const handleViewReport = (reportId: string) => {
    router.push(`/trips?id=${reportId}`);
  };
  
  // Handler for downloading a report as PDF
  const handleDownloadReport = async (reportId: string) => {
    try {
      // Show loading indicator or toast message
      alert('Generating PDF report...');
      
      // Generate and share the HTML report
      const filePath = await generateTripReport(reportId);
      await sharePDF(filePath);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };
  
  return isManager ? (
    <StyledView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.indianRailways.blue} />
      
      {/* Header */}
      <Header 
        title="Manager Dashboard"
        subtitle={`Welcome, ${user?.name || 'Manager'}`}
        backgroundColor={theme.indianRailways.blue}
        textColor={colors.white}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Manager's View - Submitted reports */}
        <StyledView style={styles.section}>
          <StyledText size="lg" weight="semibold" style={styles.sectionTitle}>
            Inspection Reports
          </StyledText>
          
          {loading ? (
            <StyledView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.indianRailways.blue} />
              <StyledText size="sm" style={{ marginTop: 10 }}>Loading reports...</StyledText>
            </StyledView>
          ) : tripReports.length === 0 ? (
            <Card
              elevation="sm"
              radius="md"
              style={styles.emptyStateCard}
              variant="outlined"
            >
              <StyledView style={styles.emptyStateContainer}>
                <ClipboardList size={40} color={theme.indianRailways.blue} style={{ marginBottom: 16 }} />
                <StyledText size="md" weight="semibold" style={styles.emptyStateTitle}>
                  No Reports Yet
                </StyledText>
                <StyledText size="sm" color={colors.textSecondary} style={styles.emptyStateText}>
                  Submitted inspection reports from officers will appear here.
                </StyledText>
                <StyledText size="xs" color={colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
                  You can view and download inspection reports submitted by your team.
                </StyledText>
              </StyledView>
            </Card>
          ) : (
            <>
              {/* Display the reports */}
              {tripReports.map((report: any) => (
                <Card key={report.id} style={styles.reportCard} elevation="sm" radius="md">
                  <StyledView style={styles.reportHeader}>
                    <StyledView>
                      <StyledText size="md" weight="bold">
                        Train {report.train_number}
                      </StyledText>
                      {report.train_name && (
                        <StyledText size="sm" color={colors.textSecondary}>
                          {report.train_name}
                        </StyledText>
                      )}
                    </StyledView>
                    
                    <StyledView style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status, theme) }]}>
                      <StyledText size="xs" color={colors.white}>
                        {formatStatus(report.status)}
                      </StyledText>
                    </StyledView>
                  </StyledView>
                  
                  <StyledView style={styles.reportMeta}>
                    <StyledView style={{ flex: 1 }}>
                      <StyledText size="xs" color={colors.textSecondary}>
                        Location
                      </StyledText>
                      <StyledText size="sm">
                        {report.location || 'Not specified'}
                      </StyledText>
                    </StyledView>
                    
                    <StyledView style={{ flex: 1 }}>
                      <StyledText size="xs" color={colors.textSecondary}>
                        Date
                      </StyledText>
                      <StyledText size="sm">
                        {formatDate(report.date)}
                      </StyledText>
                    </StyledView>
                  </StyledView>
                  
                  <StyledView style={styles.reportActions}>
                    <TouchableOpacity 
                      style={[styles.viewButton, { backgroundColor: theme.indianRailways.blue }]}
                      onPress={() => handleViewReport(report.id)}
                    >
                      <Eye size={16} color="#fff" style={{ marginRight: 5 }} />
                      <StyledText size="sm" color={colors.white}>
                        View Report
                      </StyledText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.viewButton, { backgroundColor: theme.indianRailways.green, marginLeft: 8 }]}
                      onPress={() => handleDownloadReport(report.id)}
                    >
                      <Download size={16} color="#fff" style={{ marginRight: 5 }} />
                      <StyledText size="sm" color={colors.white}>
                        Download PDF
                      </StyledText>
                    </TouchableOpacity>
                  </StyledView>
                </Card>
              ))}
            </>
          )}
          
          <TouchableOpacity 
            style={[styles.adminButton, { marginTop: 20 }]}
            onPress={handleUsersPress}
          >
            <StyledText size="sm" color={colors.white}>
              Manage Users
            </StyledText>
          </TouchableOpacity>
        </StyledView>
      </ScrollView>
    </StyledView>
  ) : renderInspectorDashboard();
}

// Inspector Dashboard - Shows their own reports and ability to create new ones
function renderInspectorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tripReports, setTripReports] = useState<any[]>([]);
  
  // Fetch trip reports for inspector
  useEffect(() => {
    const fetchInspectorReports = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Check if trip_reports table exists by trying to get schema
        const { error: schemaError } = await supabase
          .from('trip_reports')
          .select('count')
          .limit(1);
        
        // If table doesn't exist or other error, use mock data
        if (schemaError) {
          console.log('Using mock data due to schema error in inspector view:', schemaError);
          // Always use mock data for demo
          const mockReports = [
            {
              id: 'mock-draft',
              train_number: '22222',
              train_name: 'Duronto Express',
              departure_station: 'Chennai',
              arrival_station: 'Kolkata',
              inspection_date: new Date().toISOString(),
              status: 'draft',
              created_at: new Date().toISOString(),
              coach_count: 2,
              issues_count: 1,
              progress: 60
            },
            {
              id: 'mock-1',
              train_number: '12345',
              train_name: 'Rajdhani Express',
              departure_station: 'New Delhi',
              arrival_station: 'Mumbai Central',
              inspection_date: new Date().toISOString(),
              status: 'submitted',
              created_at: new Date().toISOString(),
              coach_count: 3,
              issues_count: 2
            },
            {
              id: 'mock-2',
              train_number: '54321',
              train_name: 'Shatabdi Express',
              departure_station: 'Howrah',
              arrival_station: 'New Delhi',
              inspection_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              status: 'approved',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              coach_count: 5,
              issues_count: 0
            }
          ];
          setTripReports(mockReports);
        } else {
          // Table exists, try to fetch data
          const query = supabase
            .from('trip_reports')
            .select('*')
            .eq('inspector_id', user.id)
            .order('created_at', { ascending: false });
          
          const { data, error } = await query;
          
          if (error) {
            console.error('Error fetching trip reports:', error);
            setTripReports([]);
          } else if (data && data.length > 0) {
            console.log('Fetched trip reports:', data.length);
            setTripReports(data);
          } else {
            // No data found, use mock data
            const mockReports = [
              {
                id: 'mock-1',
                train_number: '12345',
                train_name: 'Rajdhani Express',
                departure_station: 'New Delhi',
                arrival_station: 'Mumbai Central',
                inspection_date: new Date().toISOString(),
                status: 'submitted',
                created_at: new Date().toISOString(),
                coach_count: 3,
                issues_count: 2
              },
              {
                id: 'mock-2',
                train_number: '54321',
                train_name: 'Shatabdi Express',
                departure_station: 'Howrah',
                arrival_station: 'New Delhi',
                inspection_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                status: 'approved',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                coach_count: 5,
                issues_count: 0
              }
            ];
            setTripReports(mockReports);
          }
        }
      } catch (error) {
        console.error('Failed to fetch trip reports:', error);
        // Fallback to mock data on any error
        const mockReports = [
          {
            id: 'mock-draft',
            train_number: '22222',
            train_name: 'Duronto Express',
            departure_station: 'Chennai',
            arrival_station: 'Kolkata',
            inspection_date: new Date().toISOString(),
            status: 'draft',
            created_at: new Date().toISOString(),
            coach_count: 2,
            issues_count: 1,
            progress: 60
          },
          {
            id: 'mock-1',
            train_number: '12345',
            train_name: 'Rajdhani Express',
            departure_station: 'New Delhi',
            arrival_station: 'Mumbai Central',
            inspection_date: new Date().toISOString(),
            status: 'submitted',
            created_at: new Date().toISOString(),
            coach_count: 3,
            issues_count: 2
          },
          {
            id: 'mock-2',
            train_number: '54321',
            train_name: 'Shatabdi Express',
            departure_station: 'Howrah',
            arrival_station: 'New Delhi',
            inspection_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            status: 'approved',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            coach_count: 5,
            issues_count: 0
          }
        ];
        setTripReports(mockReports);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInspectorReports();
  }, [user]);
  
  // Navigation handlers
  const handleTripPress = () => {
    router.push('/trips');
  };
  
  const handleReportsPress = () => {
    alert('Analytics reporting coming soon!');
    // Future implementation when reports page is created
    // router.push('/reports');
  };
  
  const handleUsersPress = () => {
    // For now, just show an alert since these pages don't exist yet
    alert('User management coming soon!');
    // Future implementation when users page is created
    // router.push('/users');
  };
  
  // Handler for viewing a report
  const handleViewReport = (reportId: string) => {
    router.push(`/trips?id=${reportId}`);
  };
  
  // Return the inspector dashboard UI
  return (
    <StyledView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.indianRailways.blue} />
      
      {/* Header */}
      <Header 
        title="Inspector Dashboard"
        subtitle={`Welcome, ${user?.name || 'Inspector'}`}
        backgroundColor={theme.indianRailways.blue}
        textColor={colors.white}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Inspector's View - Their own reports */}
        <StyledView style={styles.section}>
          <StyledText size="lg" weight="semibold" style={styles.sectionTitle}>
            My Inspection Reports
          </StyledText>
          
          {loading ? (
            <StyledView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.indianRailways.blue} />
              <StyledText size="sm" style={{ marginTop: 10 }}>Loading reports...</StyledText>
            </StyledView>
          ) : tripReports.length === 0 ? (
            <Card
              elevation="sm"
              radius="md"
              style={styles.emptyStateCard}
              variant="outlined"
            >
              <StyledView style={styles.emptyStateContainer}>
                <ClipboardList size={40} color={theme.indianRailways.blue} style={{ marginBottom: 16 }} />
                <StyledText size="md" weight="semibold" style={styles.emptyStateTitle}>
                  No Reports Yet
                </StyledText>
                <StyledText size="sm" color={colors.textSecondary} style={styles.emptyStateText}>
                  You haven't created any inspection reports yet.
                </StyledText>
                <TouchableOpacity
                  style={[styles.startInspectionButton, { backgroundColor: theme.indianRailways.blue }]}
                  onPress={handleTripPress}
                >
                  <StyledText size="sm" color={colors.white}>
                    Start New Inspection
                  </StyledText>
                </TouchableOpacity>
              </StyledView>
            </Card>
          ) : (
            <>
              {/* Display the reports */}
              {tripReports.map((report: any) => (
                <Card key={report.id} style={styles.reportCard} elevation="sm" radius="md">
                  <StyledView style={styles.reportHeader}>
                    <StyledView>
                      <StyledText size="md" weight="bold">
                        Train {report.train_number}
                      </StyledText>
                      {report.train_name && (
                        <StyledText size="sm" color={colors.textSecondary}>
                          {report.train_name}
                        </StyledText>
                      )}
                    </StyledView>
                    
                    <StyledView style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status, theme) }]}>
                      <StyledText size="xs" color={colors.white}>
                        {formatStatus(report.status)}
                      </StyledText>
                    </StyledView>
                  </StyledView>
                  
                  <StyledView style={styles.reportMeta}>
                    <StyledView style={{ flex: 1 }}>
                      <StyledText size="xs" color={colors.textSecondary}>
                        Location
                      </StyledText>
                      <StyledText size="sm">
                        {report.location || 'Not specified'}
                      </StyledText>
                    </StyledView>
                    
                    <StyledView style={{ flex: 1 }}>
                      <StyledText size="xs" color={colors.textSecondary}>
                        Date
                      </StyledText>
                      <StyledText size="sm">
                        {formatDate(report.date)}
                      </StyledText>
                    </StyledView>
                  </StyledView>
                  
                  {report.status === 'draft' && report.progress !== undefined && (
                    <StyledView style={{ marginVertical: 8 }}>
                      <StyledView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <StyledText size="xs" color={colors.textSecondary}>
                          Inspection Progress
                        </StyledText>
                        <StyledText size="xs" color={colors.textSecondary}>
                          {report.progress}%
                        </StyledText>
                      </StyledView>
                      <ProgressBar progress={report.progress / 100} />
                    </StyledView>
                  )}
                  
                  <StyledView style={styles.reportActions}>
                    {report.status === 'draft' ? (
                      <TouchableOpacity 
                        style={[styles.resumeButton, { backgroundColor: theme.indianRailways.saffron }]}
                        onPress={() => handleViewReport(report.id)}
                      >
                        <Clock size={16} color="#fff" style={{ marginRight: 5 }} />
                        <StyledText size="sm" color={colors.white}>
                          Resume Inspection
                        </StyledText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.viewButton, { backgroundColor: theme.indianRailways.blue }]}
                        onPress={() => handleViewReport(report.id)}
                      >
                        <Eye size={16} color="#fff" style={{ marginRight: 5 }} />
                        <StyledText size="sm" color={colors.white}>
                          View Report
                        </StyledText>
                      </TouchableOpacity>
                    )}
                  </StyledView>
                </Card>
              ))}
              
              {/* Button to start a new inspection */}
              <TouchableOpacity
                style={[styles.startInspectionButton, { backgroundColor: theme.indianRailways.green, marginTop: 16 }]}
                onPress={handleTripPress}
              >
                <StyledText size="sm" color={colors.white}>
                  Start New Inspection
                </StyledText>
              </TouchableOpacity>
            </>
          )}
        </StyledView>
      </ScrollView>
    </StyledView>
  );
}

// Helper functions for formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reportDate = new Date(date);
  reportDate.setHours(0, 0, 0, 0);
  
  if (reportDate.getTime() === today.getTime()) {
    return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (reportDate.getTime() === yesterday.getTime()) {
    return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'draft': return 'Draft';
    case 'submitted': return 'Submitted';
    case 'reviewed': return 'Reviewed';
    case 'approved': return 'Approved';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'draft': return theme.indianRailways.blue;
    case 'submitted': return theme.indianRailways.saffron;
    case 'reviewed': return theme.indianRailways.green;
    case 'approved': return theme.indianRailways.green;
    default: return theme.indianRailways.blue;
  }
};

// Continue with the rest of the component

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptyStateCard: {
    padding: 24,
    marginTop: 16,
  },
  emptyStateTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    marginBottom: 4,
    textAlign: 'center',
  },
  startInspectionButton: {
    backgroundColor: '#1e88e5', // Indian Railways blue
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  adminButton: {
    backgroundColor: '#f57c00', // Indian Railways saffron
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 24,
  },
  emptyStateContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  newReportButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCard: {
    marginBottom: 16,
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportInfo: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  reportMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inspectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  guideCard: {
    marginBottom: 16,
  },
  guideCardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  guideCardContent: {
    padding: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

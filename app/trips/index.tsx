import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Card } from '@/components/themed/Card';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colorScheme } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

// Types for the new database schema
interface InspectionSection {
  id: string;
  section_number: string;
  name: string;
  description?: string;
  display_order: number;
  expanded: boolean;
  categories: InspectionCategory[];
}

interface InspectionCategory {
  id: string;
  category_number: string;
  name: string;
  description?: string;
  applicable_coaches: string[];
  display_order: number;
  activities: InspectionActivity[];
}

interface InspectionActivity {
  id: string;
  activity_number: string;
  activity_text: string;
  is_compulsory: boolean;
  display_order: number;
  checkStatus: 'pending' | 'checked-okay' | 'checked-not-okay';
  remarks: string;
}

export default function TripReport() {
  const router = useRouter();
  const { user } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tripReportId, setTripReportId] = useState<string | null>(null);
  const [trainNumber, setTrainNumber] = useState('22301');
  const [redOnTime, setRedOnTime] = useState('');
  const [redOffTime, setRedOffTime] = useState('');
  const [location, setLocation] = useState('');
  const [sections, setSections] = useState<InspectionSection[]>([]);
  
  // Check for URL parameters that might specify a report ID and mode
  useEffect(() => {
    // For Expo Router, we can try to get the search parameters from the URL
    let reportId = undefined;
    let mode = undefined;
    
    // Access URL parameters from location which is safer than directly accessing router properties
    try {
      const url = new URL(window.location.href);
      reportId = url.searchParams.get('id');
      mode = url.searchParams.get('mode');
      console.log('Extracted params from URL:', { reportId, mode });
    } catch (error) {
      console.log('Could not parse URL params, using default behavior');
    }
    
    console.log('TripReport component mounted with params:', { reportId, mode });
    console.log('Auth state:', user ? `Authenticated as ${user.role}` : 'Not authenticated');
    
    if (user) {
      if (reportId && mode === 'review' && user.role === 'manager') {
        // Manager reviewing existing report
        loadExistingReport(reportId);
      } else if (user.role === 'inspector') {
        // Inspector creating new report
        initializeReport();
      } else {
        // Handle other cases
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user, router]);
  
  // Load an existing report (for managers to review)
  const loadExistingReport = async (reportId: string) => {
    console.log('Loading existing report:', reportId);
    try {
      setLoading(true);
      
      // Get the specified trip report
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        throw reportError;
      }
      
      if (!reportData) {
        throw new Error('Report not found');
      }
      
      setTripReportId(reportData.id);
      setTrainNumber(reportData.train_number || '');
      setLocation(reportData.location || '');
      setRedOnTime(reportData.red_on_time || '');
      setRedOffTime(reportData.red_off_time || '');
      
      // Step 2: Fetch all inspection sections with categories and activities
      await fetchInspectionData(reportId);
      
      // Step 3: Fetch the results for this report
      await fetchTripResults(reportId);
      
    } catch (error) {
      console.error('Error loading existing report:', error);
      Alert.alert('Error', 'Failed to load trip report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch trip results for an existing report
  const fetchTripResults = async (reportId: string) => {
    try {
      const { data: resultsData, error: resultsError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', reportId);
        
      if (resultsError) {
        throw resultsError;
      }
      
      if (resultsData && resultsData.length > 0) {
        // Update sections with results
        setSections(prev => {
          const updatedSections = [...prev];
          
          // For each result, update the corresponding activity
          resultsData.forEach(result => {
            for (const section of updatedSections) {
              for (const category of section.categories) {
                const activityIndex = category.activities.findIndex(a => a.id === result.activity_id);
                if (activityIndex !== -1) {
                  category.activities[activityIndex].checkStatus = result.check_status;
                  category.activities[activityIndex].remarks = result.remarks || '';
                }
              }
            }
          });
          
          return updatedSections;
        });
      }
    } catch (error) {
      console.error('Error fetching trip results:', error);
    }
  };
  
  // Create a new trip report and fetch inspection checklist
  const initializeReport = async () => {
    console.log('Initializing report...');
    console.log('Current user ID:', user?.id);
    try {
      setLoading(true);
      
      // Step 1: Create a new trip report
      if (!user?.id) {
        console.error('No user ID available for trip report');
        throw new Error('User not authenticated');
      }
      
      const { data: tripReport, error: tripError } = await supabase
        .from('trip_reports')
        .insert({
          train_number: trainNumber,
          inspector_id: user.id,
          date: new Date().toISOString(),
          status: 'draft',
          location: location
        })
        .select()
        .single();
        
      if (tripError) {
        console.error('Error creating trip report:', tripError);
        throw tripError;
      }
      
      setTripReportId(tripReport.id);
      
      // Step 2: Fetch all inspection sections with categories and activities
      await fetchInspectionData();
      
    } catch (error) {
      console.error('Error initializing report:', error);
      Alert.alert('Error', 'Failed to initialize trip report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch and organize inspection data
  const fetchInspectionData = async (existingReportId?: string) => {
    try {
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('inspection_sections')
        .select('*')
        .eq('active', true)
        .order('display_order');
        
      if (sectionsError) {
        throw sectionsError;
      }
      
      const formattedSections: InspectionSection[] = [];
      
      // Process each section
      for (const section of sectionsData) {
        // Fetch categories for this section
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('inspection_categories')
          .select('*')
          .eq('section_id', section.id)
          .eq('active', true)
          .order('display_order');
          
        if (categoriesError) {
          throw categoriesError;
        }
        
        const formattedCategories: InspectionCategory[] = [];
        
        // Process each category
        for (const category of categoriesData) {
          // Fetch activities for this category
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('inspection_activities')
            .select('*')
            .eq('category_id', category.id)
            .eq('active', true)
            .order('display_order');
            
          if (activitiesError) {
            throw activitiesError;
          }
          
          // Format activities with initial check status
          const formattedActivities: InspectionActivity[] = activitiesData.map(activity => ({
            ...activity,
            checkStatus: 'pending',
            remarks: ''
          }));
          
          formattedCategories.push({
            ...category,
            activities: formattedActivities
          });
        }
        
        formattedSections.push({
          ...section,
          expanded: true, // Set to true so sections are expanded by default
          categories: formattedCategories
        });
        
        // Debug log section data
        console.log(`Loaded section: ${section.name} with ${formattedCategories.length} categories`);
      }
      
      console.log(`Setting ${formattedSections.length} sections to state`);
      setSections(formattedSections);
      
    } catch (error) {
      console.error('Error fetching inspection data:', error);
      Alert.alert('Error', 'Failed to load inspection checklist. Please try again.');
    }
  };
  
  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };
  
  // Handle check status change
  const handleCheckStatusChange = async (
    sectionId: string, 
    categoryId: string, 
    activityId: string, 
    status: InspectionActivity['checkStatus']
  ) => {
    if (!tripReportId) return;
    
    // Update local state
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              categories: section.categories.map(category => 
                category.id === categoryId 
                  ? {
                      ...category,
                      activities: category.activities.map(activity => 
                        activity.id === activityId 
                          ? { ...activity, checkStatus: status }
                          : activity
                      )
                    }
                  : category
              )
            }
          : section
      )
    );
    
    // Save to database
    try {
      // First check if a record already exists for this activity in this trip
      const { data: existingData, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId)
        .eq('activity_id', activityId)
        .single();
        
      if (existingError && existingError.code !== 'PGRST116') {
        // An error other than 'no rows returned' occurred
        console.error('Error checking existing activity result:', existingError);
        return;
      }
      
      // If the record exists, update it; otherwise, insert it
      const { error } = await supabase
        .from('trip_activity_results')
        .upsert({
          id: existingData?.id || undefined,  // Use existing ID if available
          trip_report_id: tripReportId,
          activity_id: activityId,
          check_status: status,
          inspector_id: user?.id
        }, { onConflict: 'trip_report_id,activity_id' });
        
      if (error) {
        console.error('Error saving activity status:', error);
      }
    } catch (error) {
      console.error('Error updating check status:', error);
    }
  };
  
  // Handle remarks change
  const handleRemarksChange = async (
    sectionId: string, 
    categoryId: string, 
    activityId: string, 
    remarks: string
  ) => {
    if (!tripReportId) return;
    
    // Update local state
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              categories: section.categories.map(category => 
                category.id === categoryId 
                  ? {
                      ...category,
                      activities: category.activities.map(activity => 
                        activity.id === activityId 
                          ? { ...activity, remarks }
                          : activity
                      )
                    }
                  : category
              )
            }
          : section
      )
    );
    
    // Save to database
    try {
      // Check if a record already exists for this activity in this trip
      const { data: existingData, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId)
        .eq('activity_id', activityId)
        .single();
        
      if (existingError && existingError.code !== 'PGRST116') {
        // An error other than 'no rows returned' occurred
        console.error('Error checking existing activity result:', existingError);
        return;
      }
      
      // If the record exists, update it; otherwise, insert it
      const { error } = await supabase
        .from('trip_activity_results')
        .upsert({
          id: existingData?.id || undefined,  // Use existing ID if available
          trip_report_id: tripReportId,
          activity_id: activityId,
          remarks: remarks,
          inspector_id: user?.id
        }, { onConflict: 'trip_report_id,activity_id' });
        
      if (error) {
        console.error('Error saving activity remarks:', error);
      }
    } catch (error) {
      console.error('Error updating remarks:', error);
    }
  };
  
  // Render check status options
  const renderCheckOptions = (
    sectionId: string,
    categoryId: string,
    activity: InspectionActivity
  ) => {
    return (
      <View style={styles.checkOptionsContainer}>
        <TouchableOpacity 
          style={[
            styles.checkOption, 
            activity.checkStatus === 'checked-okay' && styles.activeOptionOkay
          ]}
          onPress={() => handleCheckStatusChange(
            sectionId, 
            categoryId, 
            activity.id, 
            'checked-okay'
          )}
        >
          <StyledText size="sm">Checked Okay</StyledText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.checkOption, 
            activity.checkStatus === 'checked-not-okay' && styles.activeOptionNotOkay
          ]}
          onPress={() => handleCheckStatusChange(
            sectionId, 
            categoryId, 
            activity.id, 
            'checked-not-okay'
          )}
        >
          <StyledText size="sm">Checked Not Okay</StyledText>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Submit the trip report
  const handleSubmitReport = async () => {
    if (!tripReportId) return;
    
    try {
      setSubmitting(true);
      
      // Validate input fields
      if (!trainNumber) {
        Alert.alert('Missing Information', 'Please enter a train number.');
        setSubmitting(false);
        return;
      }
      
      if (!location) {
        Alert.alert('Missing Information', 'Please enter a location.');
        setSubmitting(false);
        return;
      }
      
      // Confirm submission to manager review
      Alert.alert(
        'Submit for Manager Review',
        'Your completed inspection report will be submitted to managers for review and approval. Continue?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
          { text: 'Submit', onPress: () => validateActivities() }
        ]
      );
      return;
    } catch (error) {
      console.error('Error in submission process:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Validate if all activities are checked
  const validateActivities = async () => {
    try {
      
      // Check if any activities are unchecked
      let allActivitiesChecked = true;
      let totalActivities = 0;
      
      for (const section of sections) {
        for (const category of section.categories) {
          for (const activity of category.activities) {
            totalActivities++;
            if (activity.checkStatus === 'pending') {
              allActivitiesChecked = false;
            }
          }
        }
      }
      
      if (!allActivitiesChecked) {
        // Ask for confirmation
        Alert.alert(
          'Unchecked Activities',
          `Some activities (${totalActivities - (sections.reduce((total, section) => 
            total + section.categories.reduce((catTotal, category) => 
              catTotal + category.activities.filter(a => a.checkStatus !== 'pending').length, 0), 0))} of ${totalActivities}) are not checked. Do you want to submit anyway?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
            { text: 'Submit Anyway', onPress: () => completeSubmission() }
          ]
        );
      } else {
        completeSubmission();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Complete the submission process
  const completeSubmission = async () => {
    try {
      // Update the trip report status
      const { error } = await supabase
        .from('trip_reports')
        .update({
          status: 'submitted',
          train_number: trainNumber,
          red_on_time: redOnTime,
          red_off_time: redOffTime,
          location: location,
          submitted_at: new Date().toISOString()
        })
        .eq('id', tripReportId);
        
      if (error) {
        throw error;
      }
      
      Alert.alert(
        'Success',
        'Trip report has been submitted to managers for review!',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error) {
      console.error('Error completing submission:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <StyledView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <StyledText style={{ marginTop: 20 }}>Loading inspection checklist...</StyledText>
      </StyledView>
    );
  }

  // If no user is authenticated, show login prompt
  if (!user) {
    return (
      <StyledView style={[styles.container, styles.centered]}>
        <StyledText size="lg" weight="bold" style={{ marginBottom: 20 }}>Authentication Required</StyledText>
        <StyledText style={{ marginBottom: 30, textAlign: 'center' }}>You need to be logged in to view and create trip reports.</StyledText>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => router.replace('/login')}
        >
          <StyledText size="md" weight="bold" style={styles.buttonText}>Go to Login</StyledText>
        </TouchableOpacity>
      </StyledView>
    );
  }

  return (
    <StyledView style={styles.container}>
      {user?.role === 'manager' && (
        <View style={styles.reviewBanner}>
          <StyledText size="md" weight="bold" style={{ color: '#fff' }}>
            Manager Review Mode
          </StyledText>
        </View>
      )}
      <ScrollView>
        {/* Header Section */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, styles.headerLabelCell]}>
              <StyledText size="sm" weight="bold">Date:</StyledText>
            </View>
            <View style={[styles.headerCell, { flex: 1 }]}>
              <StyledText>{new Date().toLocaleDateString()}</StyledText>
            </View>
          </View>
          
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { borderLeftWidth: 1 }]}>
              <StyledText size="sm" weight="bold">Train No:</StyledText>
            </View>
            <View style={[styles.headerCell, { flex: 1 }]}>
              <TextInput
                style={styles.trainInput}
                value={trainNumber}
                onChangeText={setTrainNumber}
              />
            </View>
          </View>
          
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { borderLeftWidth: 1 }]}>
              <StyledText size="sm" weight="bold">RED On:</StyledText>
            </View>
            <View style={[styles.headerCell, { flex: 1 }]}>
              <TextInput
                style={styles.timeInput}
                value={redOnTime}
                onChangeText={setRedOnTime}
                placeholder="HH:MM"
              />
            </View>
            <View style={[styles.headerCell, { borderLeftWidth: 1 }]}>
              <StyledText size="sm" weight="bold">RED Off:</StyledText>
            </View>
            <View style={[styles.headerCell, { flex: 1 }]}>
              <TextInput
                style={styles.timeInput}
                value={redOffTime}
                onChangeText={setRedOffTime}
                placeholder="HH:MM"
              />
            </View>
          </View>
          
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { borderLeftWidth: 1 }]}>
              <StyledText size="sm" weight="bold">Location:</StyledText>
            </View>
            <View style={[styles.headerCell, { flex: 1 }]}>
              <TextInput
                style={styles.trainInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
              />
            </View>
          </View>
        </Card>
        
        {/* Inspection Sections */}
        {sections.map((section) => (
          <Card key={section.id} style={styles.sectionCard}>
            {/* Section Header */}
            <TouchableOpacity 
              onPress={() => toggleSection(section.id)}
              style={styles.sectionHeader}
            >
              <StyledText size="md" weight="bold">{section.section_number}. {section.name}</StyledText>
              {section.expanded ? (
                <ChevronUp size={24} color={themeColors.text} />
              ) : (
                <ChevronDown size={24} color={themeColors.text} />
              )}
            </TouchableOpacity>
            
            {section.expanded && (
              <View>
                {/* Categories */}
                {section.categories.map((category) => (
                  <View key={category.id}>
                    {/* Category Header */}
                    <View style={styles.categoryHeader}>
                      <StyledText size="sm" weight="bold">
                        {category.category_number} {category.name} ({category.applicable_coaches.join(', ')})
                      </StyledText>
                    </View>
                    
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <View style={[styles.tableHeaderCell, { width: 40 }]}>
                        <StyledText size="sm" weight="bold">No.</StyledText>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 3 }]}>
                        <StyledText size="sm" weight="bold">Activity</StyledText>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                        <StyledText size="sm" weight="bold">Status</StyledText>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                        <StyledText size="sm" weight="bold">Remarks</StyledText>
                      </View>
                    </View>
                    
                    {/* Activities */}
                    {category.activities.map((activity) => (
                      <View key={activity.id} style={styles.activityRow}>
                        <View style={[styles.tableCell, { width: 40 }]}>
                          <StyledText size="sm">{activity.activity_number}</StyledText>
                        </View>
                        <View style={[styles.tableCell, { flex: 3 }]}>
                          <StyledText>{activity.activity_text}</StyledText>
                        </View>
                        <View style={[styles.tableCell, { flex: 1 }]}>
                          {renderCheckOptions(section.id, category.id, activity)}
                        </View>
                        <View style={[styles.tableCell, { flex: 1 }]}>
                          <TextInput
                            style={styles.remarksInput}
                            placeholder="Add remarks"
                            value={activity.remarks || ''}
                            onChangeText={(text) => handleRemarksChange(section.id, category.id, activity.id, text)}
                            multiline
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
        
        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          {user?.role === 'inspector' ? (
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleSubmitReport}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <StyledText size="md" weight="bold" style={styles.buttonText}>Submit Report for Review</StyledText>
              )}
            </TouchableOpacity>
          ) : user?.role === 'manager' && (
            <View style={styles.managerActions}>
              <TouchableOpacity 
                style={[styles.approveButton]}
                onPress={() => {
                  Alert.alert(
                    'Approve Report',
                    'Are you sure you want to approve this inspection report?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Approve', 
                        onPress: async () => {
                          try {
                            const { error } = await supabase
                              .from('trip_reports')
                              .update({
                                status: 'approved',
                                approved_at: new Date().toISOString(),
                                approved_by: user?.id
                              })
                              .eq('id', tripReportId);
                              
                            if (error) throw error;
                            
                            Alert.alert(
                              'Success', 
                              'Report has been approved.',
                              [{ text: 'OK', onPress: () => router.replace('/reports') }]
                            );
                          } catch (error) {
                            console.error('Error approving report:', error);
                            Alert.alert('Error', 'Failed to approve report');
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <StyledText size="md" weight="bold" style={styles.buttonText}>Approve Report</StyledText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.rejectButton]}
                onPress={() => {
                  Alert.alert(
                    'Reject Report',
                    'Are you sure you want to reject this inspection report?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Reject', 
                        onPress: async () => {
                          try {
                            const { error } = await supabase
                              .from('trip_reports')
                              .update({
                                status: 'rejected',
                                rejected_at: new Date().toISOString(),
                                rejected_by: user?.id
                              })
                              .eq('id', tripReportId);
                              
                            if (error) throw error;
                            
                            Alert.alert(
                              'Success', 
                              'Report has been rejected.',
                              [{ text: 'OK', onPress: () => router.replace('/reports') }]
                            );
                          } catch (error) {
                            console.error('Error rejecting report:', error);
                            Alert.alert('Error', 'Failed to reject report');
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <StyledText size="md" weight="bold" style={styles.buttonText}>Reject Report</StyledText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 10,
    padding: 0,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerLabelCell: {
    width: 60,
  },
  headerCell: {
    padding: 8,
    borderRightWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  subHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  scheduleRow: {
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f0f8f0',
  },
  trainInfoRow: {
    flexDirection: 'row',
  },
  redText: {
    color: 'red',
  },
  greenText: {
    color: 'green',
  },
  compulsoryText: {
    color: '#d9534f',
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#ff6347', // Tomato color for Primary Maintenance
  },
  timeInput: {
    height: 30,
    borderWidth: 0,
    padding: 0,
    width: 60,
  },
  trainInput: {
    height: 30,
    borderWidth: 0,
    padding: 0,
  },
  sectionCard: {
    marginBottom: 10,
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  categoryHeader: {
    padding: 8,
    backgroundColor: '#eaeaea',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  activityRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  checkOptionsContainer: {
    flexDirection: 'column',
  },
  checkOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  activeOptionOkay: {
    backgroundColor: '#d4edda',
  },
  activeOptionNotOkay: {
    backgroundColor: '#f8d7da',
  },
  remarksInput: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    minHeight: 60,
  },
  buttonContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    minWidth: 160,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
  },
  reviewBanner: {
    backgroundColor: '#f39c12',
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  managerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  approveButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
});
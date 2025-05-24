import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InspectionSection, TripReport } from '@/types/inspection';
import { Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to manage inspection data and trip reports
 */
export function useInspectionData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<InspectionSection[]>([]);
  const [tripReportId, setTripReportId] = useState<string | null>(null);
  const [trainNumber, setTrainNumber] = useState('');
  const [trainName, setTrainName] = useState('');
  const [redOnTime, setRedOnTime] = useState('');
  const [redOffTime, setRedOffTime] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Check if a draft report already exists for the current day
   */
  const checkExistingDraftReport = async () => {
    console.log('Checking for existing draft report...');
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('No user ID available for trip report');
        throw new Error('User not authenticated');
      }
      
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date();
      const todayISODate = today.toISOString().split('T')[0];
      
      console.log(`Checking for draft reports on ${todayISODate} for inspector ${user.id}`);
      
      // Check if there's already a draft report for today
      const { data: existingReports, error: queryError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('inspector_id', user.id)
        .eq('status', 'draft')
        .gte('date', `${todayISODate}T00:00:00.000Z`)
        .lt('date', `${todayISODate}T23:59:59.999Z`);
      
      if (queryError) {
        console.error('Error checking existing reports:', queryError);
        throw queryError;
      }
      
      if (existingReports && existingReports.length > 0) {
        // Use the most recent draft report
        const mostRecentDraft = existingReports.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        console.log(`Found existing draft report (ID: ${mostRecentDraft.id}) for today, using it instead of creating a new one`);
        loadExistingReport(mostRecentDraft.id);
      } else {
        // No existing draft for today, create a new one
        console.log('No existing draft report found for today, creating a new one');
        initializeReport();
      }
    } catch (error) {
      console.error('Error checking for existing draft reports:', error);
      Alert.alert('Error', 'Failed to check for existing reports. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Load an existing report by ID
   * Enhanced to ensure proper loading of activity results for admins
   */
  const loadExistingReport = async (reportId: string) => {
    console.log('Loading existing report:', reportId);
    try {
      setLoading(true);
      
      // Get the specified trip report with more detailed logging
      console.log(`Fetching trip report with ID: ${reportId}`);
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        console.error('Error fetching report:', reportError);
        throw reportError;
      }
      
      if (!reportData) {
        console.error('Report not found');
        throw new Error('Report not found');
      }
      
      console.log(`Successfully loaded report: ${reportData.id}, status: ${reportData.status}`);
      console.log(`Report details: Train ${reportData.train_number}, Location: ${reportData.location}`);
      console.log(`Inspector ID: ${reportData.inspector_id}`);

      
      // Set report data in state
      setTripReportId(reportData.id);
      setTrainNumber(reportData.train_number || '');
      setTrainName(reportData.train_name || '');
      setLocation(reportData.location || '');
      setRedOnTime(reportData.red_on_time || '');
      setRedOffTime(reportData.red_off_time || '');
      
      // Step 2: Fetch all inspection sections with categories and activities
      console.log('Fetching inspection data structure...');
      await fetchInspectionData(reportId);
      
      // Step 3: Fetch the results for this report - this is critical for seeing the status markings
      console.log('Fetching activity results...');
      await fetchTripResults(reportId);
      
      console.log('Report loading complete');
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading existing report:', error);
      Alert.alert('Error', 'Failed to load report. Please try again.');
      setLoading(false);
    }  
  };

  /**
   * Create a new trip report
   */
  const initializeReport = async () => {
    console.log('Initializing new report...');
    console.log('Current user ID:', user?.id);
    try {
      // Step 1: Create a new trip report
      if (!user?.id) {
        console.error('No user ID available for trip report');
        throw new Error('User not authenticated');
      }
      
      const { data: tripReport, error: tripError } = await supabase
        .from('trip_reports')
        .insert({
          train_number: trainNumber,
          train_name: trainName,
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

  /**
   * Fetch and organize inspection data with optimized queries
   */
  const fetchInspectionData = async (existingReportId?: string) => {
    try {
      console.log('Fetching inspection data', existingReportId ? `for report ${existingReportId}` : 'for new report');
      setLoading(true);
      
      // Use a single optimized query to fetch the entire inspection structure
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('inspection_sections')
        .select(`
          id, name, section_number, description, display_order,
          inspection_categories!inner(id, name, category_number, description, display_order, section_id, applicable_coaches, 
            inspection_activities!inner(id, activity_number, activity_text, is_compulsory, display_order, category_id))
        `)
        .eq('active', true)
        .order('display_order');
      
      if (sectionsError) {
        console.error('Error fetching inspection structure:', sectionsError);
        throw sectionsError;
      }
      
      if (!sectionsData || sectionsData.length === 0) {
        console.warn('No inspection sections found');
        setSections([]);
        setLoading(false);
        return;
      }
      
      console.log(`Fetched ${sectionsData.length} sections with nested categories and activities`);
      
      // If this is an existing report, fetch all results in a single query
      let allResults = [];
      if (existingReportId) {
        console.log(`Fetching activity results for report ID: ${existingReportId}`);
        
        // First try to get results directly
        const { data: resultsData, error: resultsError } = await supabase
          .from('trip_activity_results')
          .select('*')
          .eq('trip_report_id', existingReportId);
          
        if (resultsError) {
          console.error('Error fetching results:', resultsError);
        } else {
          allResults = resultsData || [];
          console.log(`Fetched ${allResults.length} activity results for report ${existingReportId}`);
          
          // Debug the results
          if (allResults.length > 0) {
            console.log('Sample result:', allResults[0]);
            const okCount = allResults.filter(r => r.check_status === 'checked-okay').length;
            const notOkCount = allResults.filter(r => r.check_status === 'checked-not-okay').length;
            console.log(`Status counts - OK: ${okCount}, Not OK: ${notOkCount}, Pending: ${allResults.length - okCount - notOkCount}`);
          } else {
            console.warn('No activity results found for this report. This may indicate a data issue.');
            
            // As a fallback, try to fetch the report to see if it exists
            const { data: reportData, error: reportError } = await supabase
              .from('trip_reports')
              .select('*')
              .eq('id', existingReportId)
              .single();
              
            if (reportError) {
              console.error('Error fetching report:', reportError);
            } else if (reportData) {
              console.log('Report exists but has no activity results:', reportData);
            }
          }
        }
      }
      
      // Process the nested data into our expected format
      const formattedSections: InspectionSection[] = sectionsData.map(section => {
        // Extract and format categories
        const formattedCategories = section.inspection_categories.map(category => {
          // Extract and format activities
          const formattedActivities = category.inspection_activities.map(activity => {
            // For existing reports, find the corresponding result
            if (existingReportId) {
              const result = allResults.find(r => r.activity_id === activity.id);
              if (result) {
                return {
                  ...activity,
                  checkStatus: result.check_status || 'pending',
                  remarks: result.remarks || ''
                };
              }
            }
            
            // Default for new activities or those without results
            return {
              ...activity,
              checkStatus: 'pending',
              remarks: ''
            };
          }).sort((a, b) => a.display_order - b.display_order); // Sort activities by display order
          
          return {
            ...category,
            activities: formattedActivities
          };
        }).sort((a, b) => a.display_order - b.display_order); // Sort categories by display order
        
        return {
          ...section,
          expanded: true, // Set to true so sections are expanded by default
          categories: formattedCategories
        };
      }).sort((a, b) => a.display_order - b.display_order); // Sort sections by display order
      
      console.log(`Processed ${formattedSections.length} sections with their nested data`);
      setSections(formattedSections);
      
    } catch (error) {
      console.error('Error fetching inspection data:', error);
      Alert.alert('Error', 'Failed to load inspection checklist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch trip results for an existing report
   * This function has been enhanced to ensure proper loading of activity results
   * for both inspectors and admins viewing reports
   */
  const fetchTripResults = async (reportId: string) => {
    try {
      console.log(`Fetching trip results for report: ${reportId}`);
      
      // Force a fresh fetch of results when viewing a submitted report
      // This ensures admins see the latest status
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('status')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        console.error('Error checking report status:', reportError);
      } else {
        console.log(`Report status: ${reportData?.status}`);
      }
      
      // Always fetch results for submitted reports to ensure we have the latest data
      console.log('Fetching trip activity results...');
      const { data: resultsData, error: resultsError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', reportId);
        
      if (resultsError) {
        console.error('Error fetching results:', resultsError);
        throw resultsError;
      }
      
      if (!resultsData || resultsData.length === 0) {
        console.warn(`No activity results found for report ${reportId}. This may indicate a data issue.`);
        
        // Check if this is a submitted report that should have results
        const { data: reportStatus } = await supabase
          .from('trip_reports')
          .select('status')
          .eq('id', reportId)
          .single();
          
        if (reportStatus && reportStatus.status === 'submitted') {
          console.warn('This is a submitted report with no activity results. This is unexpected.');
          Alert.alert(
            'Missing Data', 
            'This report appears to be missing inspection data. The status markings may not be visible.'
          );
        } else if (reportStatus && reportStatus.status === 'draft') {
          console.log('This is a draft report. No activity results are expected yet.');
        }
        
        return;
      }
      
      console.log(`Successfully fetched ${resultsData.length} activity results`);
      
      // Log statistics for debugging
      const okCount = resultsData.filter(r => r.check_status === 'checked-okay').length;
      const notOkCount = resultsData.filter(r => r.check_status === 'checked-not-okay').length;
      const pendingCount = resultsData.length - okCount - notOkCount;
      
      console.log(`Status counts - OK: ${okCount}, Not OK: ${notOkCount}, Pending: ${pendingCount}`);
      
      // Update sections with results
      setSections(prev => {
        const updatedSections = [...prev];
        
        // For each result, update the corresponding activity
        resultsData.forEach(result => {
          let found = false;
          
          for (const section of updatedSections) {
            for (const category of section.categories) {
              const activityIndex = category.activities.findIndex(a => a.id === result.activity_id);
              if (activityIndex !== -1) {
                // Update the activity with the result data
                category.activities[activityIndex].checkStatus = result.check_status;
                category.activities[activityIndex].remarks = result.remarks || '';
                found = true;
                break;
              }
            }
            if (found) break;
          }
          
          if (!found) {
            console.warn(`Could not find activity ${result.activity_id} in sections`);
          }
        });
        
        return updatedSections;
      });
      
      // Verify the update was applied
      let verifiedOkCount = 0;
      let verifiedNotOkCount = 0;
      
      for (const section of sections) {
        for (const category of section.categories) {
          for (const activity of category.activities) {
            if (activity.checkStatus === 'checked-okay') verifiedOkCount++;
            if (activity.checkStatus === 'checked-not-okay') verifiedNotOkCount++;
          }
        }
      }
      
      console.log(`Verified status counts - OK: ${verifiedOkCount}, Not OK: ${verifiedNotOkCount}`);
      
    } catch (error) {
      console.error('Error fetching trip results:', error);
      Alert.alert('Error', 'Failed to load inspection results. Please try again.');
    }
  };

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  /**
   * Handle check status change with enhanced error handling and verification
   */
  const handleCheckStatusChange = async (
    sectionId: string, 
    categoryId: string, 
    activityId: string, 
    status: 'pending' | 'checked-okay' | 'checked-not-okay'
  ) => {
    if (!tripReportId) {
      console.error('No trip report ID available for saving activity status');
      Alert.alert('Error', 'Cannot save inspection data: Report ID is missing.');
      return;
    }
    
    if (!user?.id) {
      console.error('No user ID available for saving activity status');
      Alert.alert('Error', 'Cannot save inspection data: User is not authenticated.');
      return;
    }
    
    console.log(`Changing activity ${activityId} status to ${status}`);
    
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
        Alert.alert('Error', 'Failed to check existing inspection data. Please try again.');
        return;
      }
      
      // Log the data we're about to save for debugging
      console.log('Saving activity status:', {
        id: existingData?.id || undefined,
        trip_report_id: tripReportId,
        activity_id: activityId,
        check_status: status,
        inspector_id: user?.id
      });
      
      // Preserve existing remarks if available
      const existingRemarks = existingData?.remarks || '';
      
      // If the record exists, update it; otherwise, insert it
      const { error } = await supabase
        .from('trip_activity_results')
        .upsert({
          id: existingData?.id || undefined,  // Use existing ID if available
          trip_report_id: tripReportId,
          activity_id: activityId,
          check_status: status,
          remarks: existingRemarks,  // Preserve existing remarks
          inspector_id: user?.id,
          updated_at: new Date().toISOString() // Add updated timestamp
        }, { onConflict: 'trip_report_id,activity_id' });
      
      // Handle save errors  
      if (error) {
        console.error('Error saving activity status:', error);
        Alert.alert('Error', 'Failed to save inspection data. Please try again.');
        return;
      }
      
      // Verify the save operation
      console.log('Successfully saved activity status, verifying...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId)
        .eq('activity_id', activityId)
        .single();
        
      if (verifyError) {
        console.error('Error verifying saved data:', verifyError);
        // Don't alert the user for verification errors, but log them
      } else {
        console.log('Verified saved data:', verifyData);
        
        // Verify the status was saved correctly
        if (verifyData.check_status !== status) {
          console.error(`Status mismatch! Expected: ${status}, Got: ${verifyData.check_status}`);
          // Try to fix the mismatch
          const { error: fixError } = await supabase
            .from('trip_activity_results')
            .update({ check_status: status })
            .eq('id', verifyData.id);
            
          if (fixError) {
            console.error('Error fixing status mismatch:', fixError);
          } else {
            console.log('Fixed status mismatch successfully');
          }
        }
      }
      
      // Count and log the total number of saved results for this report
      const { count, error: countError } = await supabase
        .from('trip_activity_results')
        .select('*', { count: 'exact', head: true })
        .eq('trip_report_id', tripReportId);
        
      if (countError) {
        console.error('Error counting activity results:', countError);
      } else {
        console.log(`Total saved activity results for this report: ${count}`);
      }
      
    } catch (error) {
      console.error('Error updating check status:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving inspection data.');
    }
  };

  /**
   * Handle remarks change
   */
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
      
      // Log the data we're about to save for debugging
      console.log('Saving activity remarks:', {
        id: existingData?.id || undefined,
        trip_report_id: tripReportId,
        activity_id: activityId,
        remarks: remarks,
        inspector_id: user?.id
      });
      
      // If the record exists, update it; otherwise, insert it
      const { error } = await supabase
        .from('trip_activity_results')
        .upsert({
          id: existingData?.id || undefined,  // Use existing ID if available
          trip_report_id: tripReportId,
          activity_id: activityId,
          remarks: remarks,
          // Preserve the existing check_status if available
          check_status: existingData?.check_status || 'pending',
          inspector_id: user?.id,
          updated_at: new Date().toISOString() // Add updated timestamp
        }, { onConflict: 'trip_report_id,activity_id' });
        
      // Verify the save operation
      if (!error) {
        console.log('Successfully saved activity remarks');
        // Double-check that the data was saved correctly
        const { data: verifyData, error: verifyError } = await supabase
          .from('trip_activity_results')
          .select('*')
          .eq('trip_report_id', tripReportId)
          .eq('activity_id', activityId)
          .single();
          
        if (verifyError) {
          console.error('Error verifying saved remarks:', verifyError);
        } else {
          console.log('Verified saved remarks data:', verifyData);
        }
      }
        
      if (error) {
        console.error('Error saving activity remarks:', error);
      }
    } catch (error) {
      console.error('Error updating remarks:', error);
    }
  };

  /**
   * Submit the trip report with enhanced validation
   */
  const submitReport = async () => {
    if (!tripReportId) return;
    
    try {
      setSubmitting(true);
      console.log('Starting report submission process...');
      
      // Validate required fields
      if (!trainNumber.trim()) {
        Alert.alert('Missing Information', 'Please enter a train number');
        setSubmitting(false);
        return;
      }
      
      if (!location.trim()) {
        Alert.alert('Missing Information', 'Please enter a location');
        setSubmitting(false);
        return;
      }
      
      // Validate that at least some activities have been checked
      console.log('Validating activity results...');
      const { data: resultsData, error: resultsError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId);
        
      if (resultsError) {
        console.error('Error checking activity results:', resultsError);
      }
      
      // Count checked activities
      const checkedActivities = resultsData?.filter(r => 
        r.check_status === 'checked-okay' || r.check_status === 'checked-not-okay'
      ).length || 0;
      
      // Count total activities
      let totalActivities = 0;
      sections.forEach(section => {
        section.categories.forEach(category => {
          totalActivities += category.activities.length;
        });
      });
      
      console.log(`Checked activities: ${checkedActivities}/${totalActivities}`);
      
      // If no activities are checked, warn the user
      if (checkedActivities === 0) {
        Alert.alert(
          'No Inspection Data',
          'You haven\'t marked any inspection items as OK or Not OK. Are you sure you want to submit this report?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
            { text: 'Submit Anyway', style: 'destructive', onPress: () => finalizeSubmission() }
          ]
        );
        return;
      }
      
      // If less than 50% of activities are checked, warn the user
      if (totalActivities > 0 && checkedActivities / totalActivities < 0.5) {
        Alert.alert(
          'Incomplete Inspection',
          `You've only completed ${Math.round((checkedActivities / totalActivities) * 100)}% of the inspection items. Are you sure you want to submit this report?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
            { text: 'Submit Anyway', onPress: () => finalizeSubmission() }
          ]
        );
        return;
      }
      
      // If validation passes, finalize the submission
      await finalizeSubmission();
      
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };
  
  /**
   * Finalize the report submission by updating the database
   */
  const finalizeSubmission = async () => {
    try {
      console.log('Finalizing report submission...');
      
      // Validate required fields
      if (!trainNumber.trim()) {
        Alert.alert('Error', 'Train number is required');
        setSubmitting(false);
        return;
      }
      
      if (!location.trim()) {
        Alert.alert('Error', 'Location is required');
        setSubmitting(false);
        return;
      }
      
      console.log(`Submitting report with train number: ${trainNumber}, train name: ${trainName}, location: ${location}`);
      
      // Update the report status to submitted with all required fields
      const { error: updateError } = await supabase
        .from('trip_reports')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          train_number: trainNumber.trim(),
          train_name: trainName.trim(),
          location: location.trim(),
          red_on_time: redOnTime,
          red_off_time: redOffTime
        })
        .eq('id', tripReportId);
        
      if (updateError) {
        console.error('Error submitting report:', updateError);
        Alert.alert('Error', 'Failed to submit report. Please try again.');
        setSubmitting(false);
        return;
      }
      
      console.log('Report details updated successfully!');
      
      // Ensure all activity results are properly saved
      // First, collect all activities from all sections
      let allActivities: {sectionId: string, categoryId: string, activityId: string}[] = [];
      sections.forEach(section => {
        section.categories.forEach(category => {
          category.activities.forEach(activity => {
            allActivities.push({
              sectionId: section.id,
              categoryId: category.id,
              activityId: activity.id
            });
          });
        });
      });
      
      console.log(`Ensuring all ${allActivities.length} activities have results saved...`);
      
      // Verify that activity results were saved
      const { data: verifyData, error: verifyError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId);
        
      if (verifyError) {
        console.error('Error verifying activity results:', verifyError);
      } else {
        console.log(`Found ${verifyData?.length || 0} activity results in database`);
        
        // Check if we're missing any results
        if (verifyData && verifyData.length < allActivities.length) {
          console.warn(`Missing activity results: ${allActivities.length - verifyData.length} activities don't have saved results`);
          
          // For activities without results, create pending results
          const existingResultMap = new Map();
          verifyData.forEach(result => {
            existingResultMap.set(`${result.activity_id}`, true);
          });
          
          // Create missing results
          const missingActivities = allActivities.filter(activity => {
            return !existingResultMap.has(`${activity.activityId}`);
          });
          
          if (missingActivities.length > 0) {
            console.log(`Creating ${missingActivities.length} missing activity results...`);
            
            // Create results for missing activities
            for (const activity of missingActivities) {
              const { error: insertError } = await supabase
                .from('trip_activity_results')
                .insert({
                  trip_report_id: tripReportId,
                  activity_id: activity.activityId,
                  check_status: 'pending',
                  remarks: '',
                  inspector_id: user?.id,
                  updated_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error('Error creating missing activity result:', insertError);
              }
            }
          }
        }
      }
      
      // Final verification
      const { data: finalVerifyData, error: finalVerifyError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId);
        
      if (finalVerifyError) {
        console.error('Error in final verification:', finalVerifyError);
      } else {
        console.log(`Final verification: ${finalVerifyData?.length || 0} activity results saved`);
      }
      
      Alert.alert(
        'Report Submitted',
        'Your inspection report has been submitted successfully.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back or to a confirmation screen
              console.log('Report submission complete');
            } 
          }
        ]
      );
      
      setSubmitting(false);
    } catch (error) {
      console.error('Error in finalizeSubmission:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };

  return {
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
  };
}

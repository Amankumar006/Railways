import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InspectionSection, TripReport } from '@/types/inspection';
import { useAuth } from '@/context/AuthContext';
import { logDebug, logError, logWarn, logInfo } from '@/utils/logger';
import { showError, showWarning, showConfirmation } from '@/utils/errorHandler';

// Interface for database activity
interface ActivityData {
  id: string;
  activity_number?: string;
  category_id?: string;
}

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
  const [lineNumber, setLineNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'draft' | 'submitted' | 'approved' | 'rejected'>('draft');

  /**
   * Check if a draft report already exists for the current day
   */
  const checkExistingDraftReport = async () => {
    logDebug('Checking for existing draft report...');
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
      showError({ message: 'Failed to check for existing reports. Please try again.' });
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
      setLineNumber(reportData.line_number || '');
      setRedOnTime(reportData.red_on_time || '');
      setRedOffTime(reportData.red_off_time || '');
      setStatus(reportData.status || 'draft');
      
      // Step 2: Fetch all inspection sections with categories and activities
      console.log('Fetching inspection data structure...');
      await fetchInspectionData(reportData.id);
      
      // Step 3: Fetch the results for this report - this is critical for seeing the status markings
      console.log('Fetching activity results...');
      await fetchTripResults(reportData.id);
      
      console.log('Report loading complete');
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading existing report:', error);
      showError({ message: 'Failed to load report. Please try again.' });
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
          location: "JSDG"
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
      showError({ message: 'Failed to initialize trip report. Please try again.' });
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
      
      // Check if Supabase is configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'your-supabase-project-url') {
        console.warn('Supabase not configured, using mock inspection data');
        const mockSections = getMockInspectionData();
        setSections(mockSections);
        setLoading(false);
        return;
      }
      
      // First, let's check if we have any sections at all
      const { data: sectionsCheck, error: sectionsCheckError } = await supabase
        .from('inspection_sections')
        .select('id, name, section_number')
        .eq('active', true);
        
      console.log('Sections check:', sectionsCheck?.length || 0, 'sections found');
      if (sectionsCheckError) {
        console.error('Error checking sections:', sectionsCheckError);
        console.warn('Database error, falling back to mock data');
        const mockSections = getMockInspectionData();
        setSections(mockSections);
        setLoading(false);
        return;
      }
      
      // Check categories
      const { data: categoriesCheck, error: categoriesCheckError } = await supabase
        .from('inspection_categories')
        .select('id, name, category_number')
        .eq('active', true);
        
      console.log('Categories check:', categoriesCheck?.length || 0, 'categories found');
      if (categoriesCheckError) {
        console.error('Error checking categories:', categoriesCheckError);
      }
      
      // Check activities
      const { data: activitiesCheck, error: activitiesCheckError } = await supabase
        .from('inspection_activities')
        .select('id, activity_number, activity_text')
        .eq('active', true);
        
      console.log('Activities check:', activitiesCheck?.length || 0, 'activities found');
      if (activitiesCheckError) {
        console.error('Error checking activities:', activitiesCheckError);
      }
      
      // If no sections exist, show a helpful error
      if (!sectionsCheck || sectionsCheck.length === 0) {
        console.error('No inspection sections found in database, using mock data');
        const mockSections = getMockInspectionData();
        setSections(mockSections);
        setLoading(false);
        return;
      }
      
      // Use a more robust query with left joins to get all sections even if they don't have activities
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('inspection_sections')
        .select(`
          id, name, section_number, description, display_order,
          inspection_categories(id, name, category_number, description, display_order, section_id, applicable_coaches, 
            inspection_activities(id, activity_number, activity_text, is_compulsory, display_order, category_id))
        `)
        .eq('active', true)
        .order('display_order');
      
      if (sectionsError) {
        console.error('Error fetching inspection structure:', sectionsError);
        console.warn('Database query failed, using mock data');
        const mockSections = getMockInspectionData();
        setSections(mockSections);
        setLoading(false);
        return;
      }
      
      if (!sectionsData || sectionsData.length === 0) {
        console.warn('No inspection sections found in main query, using mock data');
        const mockSections = getMockInspectionData();
        setSections(mockSections);
        setLoading(false);
        return;
      }
      
      console.log(`Fetched ${sectionsData.length} sections with nested categories and activities`);
      console.log('Raw sections data:', JSON.stringify(sectionsData, null, 2));
      
      // Process the nested data into our expected format (without results yet)
      const formattedSections: InspectionSection[] = sectionsData
        .filter(section => section.inspection_categories && section.inspection_categories.length > 0)
        .map(section => {
          // Extract and format categories
          const formattedCategories = section.inspection_categories
            .filter(category => category.inspection_activities && category.inspection_activities.length > 0)
            .map(category => {
              // Extract and format activities
              const formattedActivities = category.inspection_activities.map(activity => {
                // Default for new activities or those without results
                return {
                  ...activity,
                  checkStatus: 'pending' as 'pending' | 'checked-okay' | 'checked-not-okay',
                  remarks: ''
                };
              }).sort((a: any, b: any) => a.display_order - b.display_order); // Sort activities by display order
              
              return {
                ...category,
                activities: formattedActivities
              };
            }).sort((a: any, b: any) => a.display_order - b.display_order); // Sort categories by display order
          
          return {
            ...section,
            expanded: true, // Set to true so sections are expanded by default
            categories: formattedCategories
          };
        }).sort((a: any, b: any) => a.display_order - b.display_order); // Sort sections by display order
      
      console.log(`Processed ${formattedSections.length} sections with their nested data`);
      
      if (formattedSections.length === 0) {
        console.warn('No sections with activities found after processing, using mock data');
        const mockSections = getMockInspectionData();
        setSections(mockSections);
        setLoading(false);
        return;
      }
      
      setSections(formattedSections);
      
      // If this is an existing report, fetch all results separately to ensure we have all the data
      if (existingReportId) {
        console.log(`Fetching activity results for report ID: ${existingReportId}`);
        await fetchTripResults(existingReportId);
      }
      
    } catch (error) {
      console.error('Error fetching inspection data:', error);
      console.warn('Falling back to mock inspection data due to error');
      const mockSections = getMockInspectionData();
      setSections(mockSections);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch trip results for an existing report
   * This function has been enhanced to ensure proper loading of activity results
   */
  const fetchTripResults = async (reportId: string) => {
    try {
      console.log(`Fetching trip results for report: ${reportId}`);
      
      // Force a fresh fetch of results when viewing a submitted report
      // This ensures admins see the latest status
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        console.error('Error checking report status:', reportError);
        throw reportError;
      } else {
        console.log(`Report data:`, reportData);
        
        // Update report form data
        setTrainNumber(reportData.train_number || '');
        setTrainName(reportData.train_name || '');
        setLocation(reportData.location || '');
        setLineNumber(reportData.line_number || '');
        setRedOnTime(reportData.red_on_time || '');
        setRedOffTime(reportData.red_off_time || '');
      }
      
      // Always fetch results for reports to ensure we have the latest data
      console.log('Fetching trip activity results...');
      const { data: resultsData, error: resultsError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', reportId);
        
      if (resultsError) {
        console.error('Error fetching results:', resultsError);
        throw resultsError;
      }
      
      // Count existing results for comparison
      const existingResultsCount = resultsData?.length || 0;
      console.log(`Fetched ${existingResultsCount} activity results`);
      
      // Check for potential data consistency issues
      // Count how many activities we should have results for
      let expectedActivitiesCount = 0;
      sections.forEach(section => {
        section.categories.forEach(category => {
          expectedActivitiesCount += category.activities.length;
        });
      });
      
      console.log(`Expected ${expectedActivitiesCount} activity results based on sections data`);
      
      // If we're missing results, initialize them
      if (existingResultsCount < expectedActivitiesCount) {
        console.warn(`Missing activity results: ${expectedActivitiesCount - existingResultsCount}. Creating missing entries.`);
        await initializeActivityResults(reportId);
        
        // Fetch the results again after initialization
        const { data: updatedResults, error: updatedError } = await supabase
          .from('trip_activity_results')
          .select('*')
          .eq('trip_report_id', reportId);
          
        if (updatedError) {
          console.error('Error fetching updated results:', updatedError);
          throw updatedError;
        }
        
        // Use the updated results
        if (updatedResults) {
          console.log(`After initialization: ${updatedResults.length} activity results`);
          resultsData.length = 0; // Clear the array
          resultsData.push(...updatedResults); // Add the updated results
        }
      }
      
      if (!resultsData || resultsData.length === 0) {
        console.warn(`No activity results found for report ${reportId} even after initialization. Creating default entries.`);
        await initializeActivityResults(reportId);
        return;
      }
      
      // Log statistics for debugging
      const okCount = resultsData.filter(r => r.check_status === 'checked-okay').length;
      const notOkCount = resultsData.filter(r => r.check_status === 'checked-not-okay').length;
      const pendingCount = resultsData.length - okCount - notOkCount;
      
      console.log(`Status counts - OK: ${okCount}, Not OK: ${notOkCount}, Pending: ${pendingCount}`);
      
      // Update sections with results - create a new copy to ensure state changes
      setSections(prev => {
        const updatedSections = JSON.parse(JSON.stringify(prev));
        
        // For each result, update the corresponding activity
        resultsData.forEach(result => {
          let found = false;
          
          for (const section of updatedSections) {
            for (const category of section.categories) {
              const activityIndex = category.activities.findIndex((a: any) => a.id === result.activity_id);
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
      
    } catch (error) {
      logError('Error fetching trip results:', error);
      showError({ message: 'Failed to load inspection results. Please try again.' });
    }
  };

  /**
   * Initialize activity results for a report that's missing them
   */
  const initializeActivityResults = async (reportId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('Initializing missing activity results');
      
      // First, get all activities from all sections
      const allActivities: {activityId: string}[] = [];
      
      // Collect from sections data
      sections.forEach((section) => {
        section.categories.forEach((category) => {
          category.activities.forEach((activity: { id: string }) => {
            allActivities.push({
              activityId: activity.id
            });
          });
        });
      });
      
      console.log(`Found ${allActivities.length} activities that need results`);
      
      // Verify with database to ensure we have all activities
      try {
        interface DbActivity { id: string; }
        
        const { data, error } = await supabase
          .from('inspection_activities')
          .select('id')
          .eq('active', true);
          
        if (error) {
          console.error('Error fetching all activities:', error);
        } else if (data && Array.isArray(data)) {
          // Check if there are any activities in the database that aren't in our sections
          const sectionActivityIds = new Set(allActivities.map((a: {activityId: string}) => a.activityId));
          
          // Find missing activities with proper typing
          const missingActivities = data as DbActivity[];
          const activitiesToAdd = missingActivities.filter(item => !sectionActivityIds.has(item.id));
          
          if (activitiesToAdd.length > 0) {
            console.warn(`Found ${activitiesToAdd.length} activities in database not in sections data`);
            
            // Add them to our list
            activitiesToAdd.forEach((item: DbActivity) => {
              allActivities.push({ activityId: item.id });
            });
          }
        }
      } catch (err) {
        console.error('Error checking for additional activities:', err);
      }
      
      // Now check which ones already have results
      const { data: existingResults, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('activity_id')
        .eq('trip_report_id', reportId);
        
      if (existingError) {
        console.error('Error fetching existing results:', existingError);
      }
      
      // Filter to only initialize activities that don't have results yet
      const existingActivityIds = new Set(existingResults?.map(r => r.activity_id) || []);
      const activitiesToInitialize = allActivities.filter(a => !existingActivityIds.has(a.activityId));
      
      console.log(`Initializing ${activitiesToInitialize.length} missing activity results`);
      
      // Create default entries for all missing activities
      for (const activity of activitiesToInitialize) {
        await supabase
          .from('trip_activity_results')
          .insert({
            trip_report_id: reportId,
            activity_id: activity.activityId,
            check_status: 'pending' as 'pending' | 'checked-okay' | 'checked-not-okay',
            remarks: '',
            inspector_id: user.id
          });
      }
      
      console.log('Initialized missing activity results');
      
    } catch (error) {
      console.error('Error initializing activity results:', error);
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
    
    // Check if we're using mock data (activity IDs start with 'mock-')
    if (activityId.startsWith('mock-')) {
      console.log('Using mock data, skipping database save');
      return;
    }
    
    if (!tripReportId) {
      logError('No trip report ID available for saving activity status');
      showError({ message: 'Cannot save inspection data: Report ID is missing.' });
      return;
    }
    
    if (!user?.id) {
      logError('No user ID available for saving activity status');
      showError({ message: 'Cannot save inspection data: User is not authenticated.' });
      return;
    }
    
    // Save to database
    try {
      // First check if a record already exists for this activity in this trip
      const { data: existingData, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId)
        .eq('activity_id', activityId)
        .maybeSingle();
        
      if (existingError && existingError.code !== 'PGRST116') {
        // An error other than 'no rows returned' occurred
        logError('Error checking existing activity result:', existingError);
        showError({ message: 'Failed to check existing inspection data. Please try again.' });
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
        logError('Error saving activity status:', error);
        showError({ message: 'Failed to save inspection data. Please try again.' });
        return;
      }
      
      // Verify the save operation
      console.log('Successfully saved activity status, verifying...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId)
        .eq('activity_id', activityId)
        .maybeSingle();
        
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
      logError('Error updating check status:', error);
      showError({ message: 'An unexpected error occurred while saving inspection data.' });
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
    
    // Check if we're using mock data (activity IDs start with 'mock-')
    if (activityId.startsWith('mock-')) {
      console.log('Using mock data, skipping database save for remarks');
      return;
    }
    
    if (!tripReportId) return;
    
    // Save to database
    try {
      // Check if a record already exists for this activity in this trip
      const { data: existingData, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId)
        .eq('activity_id', activityId)
        .maybeSingle();
        
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
      
      // Preserve existing check status if available
      const existingCheckStatus = existingData?.check_status || 'pending';
      
      // If the record exists, update it; otherwise, insert it
      const { error } = await supabase
        .from('trip_activity_results')
        .upsert({
          id: existingData?.id || undefined,  // Use existing ID if available
          trip_report_id: tripReportId,
          activity_id: activityId,
          check_status: existingCheckStatus,  // Preserve existing check status
          remarks: remarks,
          inspector_id: user?.id,
          updated_at: new Date().toISOString() // Add updated timestamp
        }, { onConflict: 'trip_report_id,activity_id' });
      
      if (error) {
        console.error('Error saving activity remarks:', error);
        return;
      }
      
      console.log('Successfully saved activity remarks');
      
    } catch (error) {
      console.error('Error updating remarks:', error);
    }
  };

  /**
   * Submit the trip report with enhanced validation
   */
  const submitReport = async () => {
    if (!tripReportId) {
      showError({ message: 'Report ID is missing. Cannot submit report.' });
      return;
    }
    
    try {
      setSubmitting(true);
      logDebug('Starting report submission process...');
      
      // Validate required fields
      if (!trainNumber.trim()) {
        showError({ message: 'Please enter a train number' });
        setSubmitting(false);
        return;
      }
      
      if (!location.trim()) {
        showError({ message: 'Please enter a location' });
        setSubmitting(false);
        return;
      }
      
      // Ensure that basic trip details are saved (without line_number)
      logDebug('Saving trip details before submission...');
      const { error: updateError } = await supabase
        .from('trip_reports')
        .update({
          train_number: trainNumber.trim(),
          train_name: trainName.trim(),
          location: "JSDG",
          red_on_time: redOnTime,
          red_off_time: redOffTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripReportId);
      
      if (updateError) {
        logError('Error updating trip details:', updateError);
        showError({ message: 'Failed to save trip details. Please try again.' });
        setSubmitting(false);
        return;
      }
      
      // Ensure all sections/activities have corresponding results before submission
      logDebug('Ensuring all activities have corresponding results...');
      const missingCount = await ensureAllActivitiesHaveResults(tripReportId);
      if (missingCount > 0) {
        logDebug(`Created ${missingCount} missing activity results`);
      }
      
      // Perform a comprehensive data check to verify data integrity
      logDebug('Verifying data integrity...');
      let allDataValid = true;
      let validationIssues = [];
      
      // Verify train number is properly saved (without line_number)
      const { data: verifyReport, error: verifyReportError } = await supabase
        .from('trip_reports')
        .select('train_number, train_name, location')
        .eq('id', tripReportId)
        .single();
        
      if (verifyReportError) {
        logError('Error verifying report data:', verifyReportError);
        validationIssues.push('Could not verify report data');
        allDataValid = false;
      } else if (!verifyReport.train_number || verifyReport.train_number !== trainNumber.trim()) {
        logError('Train number mismatch or missing:', verifyReport.train_number);
        validationIssues.push('Train number not saved correctly');
        allDataValid = false;
        
        // Try to fix it
        await supabase
          .from('trip_reports')
          .update({ train_number: trainNumber.trim() })
          .eq('id', tripReportId);
      }
      
      // Verify all activities have results
      const { data: activities, error: activitiesError } = await supabase
        .from('inspection_activities')
        .select('id')
        .eq('active', true);
        
      if (activitiesError) {
        logError('Error fetching activities for validation:', activitiesError);
        validationIssues.push('Could not verify activities');
        allDataValid = false;
      } else {
        const { data: results, error: resultsError } = await supabase
          .from('trip_activity_results')
          .select('activity_id')
          .eq('trip_report_id', tripReportId);
          
        if (resultsError) {
          logError('Error fetching results for validation:', resultsError);
          validationIssues.push('Could not verify activity results');
          allDataValid = false;
        } else {
          const activityIds = activities.map(a => a.id);
          const resultActivityIds = results.map(r => r.activity_id);
          
          // Check if every activity has a result
          const missingResults = activityIds.filter(id => !resultActivityIds.includes(id));
          
          if (missingResults.length > 0) {
            logError(`Missing results for ${missingResults.length} activities`);
            validationIssues.push(`Missing results for ${missingResults.length} activities`);
            allDataValid = false;
            
            // Try to fix by calling ensureAllActivitiesHaveResults again
            await ensureAllActivitiesHaveResults(tripReportId);
          }
        }
      }
      
      if (!allDataValid) {
        logWarn('Data validation found issues:', validationIssues);
        // If there are validation issues, warn the user but allow submission if they confirm
        showWarning(
          `The following issues were found:\n- ${validationIssues.join('\n- ')}\n\nAttempts were made to fix these issues. Do you want to submit anyway?`,
          () => finalizeSubmission()
        );
        return;
      }
      
      // Validate that at least some activities have been checked
      logDebug('Validating activity completion...');
      const { data: resultsData, error: resultsError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', tripReportId);
        
      if (resultsError) {
        logError('Error checking activity results:', resultsError);
        showError({ message: 'Failed to check inspection data. Please try again.' });
        setSubmitting(false);
        return;
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
      
      logDebug(`Checked activities: ${checkedActivities}/${totalActivities}`);
      
      // If no activities are checked, warn the user
      if (checkedActivities === 0) {
        showConfirmation(
          'You haven\'t marked any inspection items as OK or Not OK. Are you sure you want to submit this report?',
          () => finalizeSubmission(),
          () => setSubmitting(false)
        );
        return;
      }
      
      // If less than 50% of activities are checked, warn the user
      if (totalActivities > 0 && checkedActivities / totalActivities < 0.5) {
        showConfirmation(
          `You've only completed ${Math.round((checkedActivities / totalActivities) * 100)}% of the inspection items. Are you sure you want to submit this report?`,
          () => finalizeSubmission(),
          () => setSubmitting(false)
        );
        return;
      }
      
      // If validation passes, finalize the submission
      await finalizeSubmission();
      
    } catch (error) {
      logError('Error submitting report:', error);
      showError({ message: 'Failed to submit report. Please try again.' });
      setSubmitting(false);
    }
  };
  
  /**
   * Ensure all activities have corresponding results
   */
  const ensureAllActivitiesHaveResults = async (reportId: string): Promise<number> => {
    if (!user?.id) return 0;
    
    try {
      // Get all activities IDs from sections
      const allActivityIds: string[] = [];
      sections.forEach((section) => {
        section.categories.forEach((category) => {
          category.activities.forEach((activity: { id: string }) => {
            allActivityIds.push(activity.id);
          });
        });
      });
      
      logDebug(`Total activities in sections: ${allActivityIds.length}`);
      
      // Get existing result activity IDs
      const { data: existingResults, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('activity_id')
        .eq('trip_report_id', reportId);
        
      if (existingError) {
        logError('Error fetching existing results:', existingError);
        return 0;
      }
      
      const existingActivityIds = existingResults?.map(r => r.activity_id) || [];
      logDebug(`Existing activity results: ${existingActivityIds.length}`);
      
      // Find missing activity IDs
      const missingActivityIds = allActivityIds.filter(id => !existingActivityIds.includes(id));
      logDebug(`Missing activity results: ${missingActivityIds.length}`);
      
      // Create missing results
      for (const activityId of missingActivityIds) {
        const { error: insertError } = await supabase
          .from('trip_activity_results')
          .insert({
            trip_report_id: reportId,
            activity_id: activityId,
            check_status: 'pending' as 'pending' | 'checked-okay' | 'checked-not-okay',
            remarks: '',
            inspector_id: user.id
          });
          
        if (insertError) {
          logError(`Error creating result for activity ${activityId}:`, insertError);
        }
      }
      
      return missingActivityIds.length;
    } catch (error) {
      logError('Error ensuring all activities have results:', error);
      return 0;
    }
  };

  /**
   * Finalize the report submission by updating the database
   */
  const finalizeSubmission = async () => {
    try {
      logDebug('Finalizing report submission...');
      
      // Update the report status to submitted with all required fields (without line_number)
      const { error: updateError } = await supabase
        .from('trip_reports')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          train_number: trainNumber.trim(),
          train_name: trainName.trim(),
          location: "JSDG",
          red_on_time: redOnTime,
          red_off_time: redOffTime
        })
        .eq('id', tripReportId);
        
      if (updateError) {
        logError('Error submitting report:', updateError);
        showError({ message: 'Failed to submit report. Please try again.' });
        setSubmitting(false);
        return;
      }
      
      logDebug('Report successfully submitted!');
      
      showError({
        title: 'Report Submitted',
        message: 'Your inspection report has been submitted successfully.',
        onConfirm: () => {
          // Navigate back or to a confirmation screen
          logDebug('Report submission complete');
        }
      });
      
      setSubmitting(false);
    } catch (error) {
      logError('Error in finalizeSubmission:', error);
      showError({ message: 'Failed to submit report. Please try again.' });
      setSubmitting(false);
    }
  };

  // Mock inspection data for testing when database is not available
  const getMockInspectionData = (): InspectionSection[] => {
    return [
      {
        id: 'mock-section-1',
        section_number: '1',
        name: 'Bogie',
        description: 'Bogie inspection activities',
        display_order: 1,
        expanded: true,
        categories: [
          {
            id: 'mock-category-1-1',
            category_number: '1.1',
            name: 'Bogie Frame',
            description: 'Bogie frame inspection',
            applicable_coaches: ['DTC', 'NDTC', 'MC', 'TC'],
            display_order: 1,
            activities: [
              {
                id: 'mock-activity-1-1-1',
                activity_number: '1',
                activity_text: 'Visually inspect the bogie frame for cracks, loose, missing and leakage',
                is_compulsory: true,
                display_order: 1,
                checkStatus: 'pending' as const,
                remarks: ''
              },
              {
                id: 'mock-activity-1-1-2',
                activity_number: '2',
                activity_text: 'Check longitudinal beams and cross beams for cracks and damages',
                is_compulsory: true,
                display_order: 2,
                checkStatus: 'pending' as const,
                remarks: ''
              }
            ]
          },
          {
            id: 'mock-category-1-2',
            category_number: '1.2',
            name: 'Axle Bearings',
            description: 'Axle bearing inspection',
            applicable_coaches: ['DTC', 'NDTC', 'MC', 'TC'],
            display_order: 2,
            activities: [
              {
                id: 'mock-activity-1-2-1',
                activity_number: '1',
                activity_text: 'Visual inspection of bearings for general condition',
                is_compulsory: true,
                display_order: 1,
                checkStatus: 'pending' as const,
                remarks: ''
              },
              {
                id: 'mock-activity-1-2-2',
                activity_number: '2',
                activity_text: 'Check bearings for signs of overheating or hot bearing detection',
                is_compulsory: true,
                display_order: 2,
                checkStatus: 'pending' as const,
                remarks: ''
              }
            ]
          }
        ]
      },
      {
        id: 'mock-section-2',
        section_number: '2',
        name: 'Brakes',
        description: 'Brake system inspection',
        display_order: 2,
        expanded: true,
        categories: [
          {
            id: 'mock-category-2-1',
            category_number: '2.1',
            name: 'Brake Blocks',
            description: 'Brake block inspection',
            applicable_coaches: ['DTC', 'NDTC', 'MC', 'TC'],
            display_order: 1,
            activities: [
              {
                id: 'mock-activity-2-1-1',
                activity_number: '1',
                activity_text: 'Check brake blocks for wear and damage',
                is_compulsory: true,
                display_order: 1,
                checkStatus: 'pending' as const,
                remarks: ''
              },
              {
                id: 'mock-activity-2-1-2',
                activity_number: '2',
                activity_text: 'Verify brake block alignment and clearance',
                is_compulsory: true,
                display_order: 2,
                checkStatus: 'pending' as const,
                remarks: ''
              }
            ]
          }
        ]
      },
      {
        id: 'mock-section-3',
        section_number: '3',
        name: 'Car Body',
        description: 'Car body and underframe inspection',
        display_order: 3,
        expanded: true,
        categories: [
          {
            id: 'mock-category-3-1',
            category_number: '3.1',
            name: 'Underframe',
            description: 'Underframe inspection',
            applicable_coaches: ['DTC', 'NDTC', 'MC', 'TC'],
            display_order: 1,
            activities: [
              {
                id: 'mock-activity-3-1-1',
                activity_number: '1',
                activity_text: 'Visual inspection of coach underframe and components',
                is_compulsory: true,
                display_order: 1,
                checkStatus: 'pending' as const,
                remarks: ''
              },
              {
                id: 'mock-activity-3-1-2',
                activity_number: '2',
                activity_text: 'Check head stock and sole bar for damages',
                is_compulsory: true,
                display_order: 2,
                checkStatus: 'pending' as const,
                remarks: ''
              }
            ]
          }
        ]
      },
      {
        id: 'mock-section-4',
        section_number: '4',
        name: 'Interior',
        description: 'Interior components inspection',
        display_order: 4,
        expanded: true,
        categories: [
          {
            id: 'mock-category-4-1',
            category_number: '4.1',
            name: 'Passenger Seats',
            description: 'Passenger seat inspection',
            applicable_coaches: ['DTC', 'NDTC', 'MC', 'TC'],
            display_order: 1,
            activities: [
              {
                id: 'mock-activity-4-1-1',
                activity_number: '1',
                activity_text: 'Check seats for tears and holes in upholstery',
                is_compulsory: true,
                display_order: 1,
                checkStatus: 'pending' as const,
                remarks: ''
              },
              {
                id: 'mock-activity-4-1-2',
                activity_number: '2',
                activity_text: 'Clean seats, grab rails and armrests',
                is_compulsory: true,
                display_order: 2,
                checkStatus: 'pending' as const,
                remarks: ''
              }
            ]
          }
        ]
      }
    ];
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
    lineNumber,
    submitting,
    status,
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
    initializeActivityResults
  };
}

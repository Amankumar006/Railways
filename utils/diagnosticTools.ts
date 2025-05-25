import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

/**
 * Utility to diagnose issues with trip reports and inspection data
 */
export const diagnosticTools = {
  /**
   * Check a specific trip report for data consistency issues
   */
  checkTripReport: async (reportId: string) => {
    try {
      console.log(`Diagnosing trip report: ${reportId}`);
      
      // 1. Check report basic data
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        console.error('Error fetching report:', reportError);
        return `Error: ${reportError.message}`;
      }
      
      if (!reportData) {
        return 'Error: Report not found';
      }
      
      console.log('Report data:', reportData);
      
      // 2. Check activity results
      const { data: resultsData, error: resultsError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', reportId);
        
      if (resultsError) {
        console.error('Error fetching results:', resultsError);
        return `Error: ${resultsError.message}`;
      }
      
      // 3. Check activities and their counts
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('inspection_sections')
        .select(`
          id, name, section_number,
          inspection_categories!inner(id, name, category_number,
            inspection_activities!inner(id, activity_number, activity_text))
        `)
        .eq('active', true);
        
      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        return `Error: ${sectionsError.message}`;
      }
      
      // Count total activities
      let totalActivities = 0;
      sectionsData.forEach((section) => {
        section.inspection_categories.forEach((category) => {
          totalActivities += category.inspection_activities.length;
        });
      });
      
      // 4. Compare counts and summarize
      const okCount = resultsData.filter(r => r.check_status === 'checked-okay').length;
      const notOkCount = resultsData.filter(r => r.check_status === 'checked-not-okay').length;
      const pendingCount = resultsData.filter(r => r.check_status === 'pending').length;
      
      // Build diagnostic summary
      return `
Report ID: ${reportId}
Status: ${reportData.status}
Train Number: ${reportData.train_number || 'Missing'}
Train Name: ${reportData.train_name || 'Missing'}
Location: ${reportData.location || 'Missing'}
RED Times: ${reportData.red_on_time || 'Missing'} - ${reportData.red_off_time || 'Missing'}

Activity Results: ${resultsData.length} / ${totalActivities} expected
OK: ${okCount}
Not OK: ${notOkCount}
Pending: ${pendingCount}

${resultsData.length < totalActivities ? 'WARNING: Missing activity results' : 'All activities have results'}
`;
    } catch (error) {
      console.error('Error diagnosing report:', error);
      return `Error during diagnosis: ${error}`;
    }
  },
  
  /**
   * Repair a trip report that has missing or inconsistent data
   */
  repairTripReport: async (reportId: string) => {
    try {
      console.log(`Repairing trip report: ${reportId}`);
      
      // 1. Check if report exists
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        console.error('Error fetching report:', reportError);
        return `Error: ${reportError.message}`;
      }
      
      // 2. Get all activities from inspection structure
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('inspection_sections')
        .select(`
          id, 
          inspection_categories!inner(id,
            inspection_activities!inner(id))
        `)
        .eq('active', true);
        
      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        return `Error: ${sectionsError.message}`;
      }
      
      // Collect all activity IDs
      const allActivityIds: string[] = [];
      sectionsData.forEach((section) => {
        section.inspection_categories.forEach((category) => {
          category.inspection_activities.forEach((activity) => {
            allActivityIds.push(activity.id);
          });
        });
      });
      
      console.log(`Found ${allActivityIds.length} total activities`);
      
      // 3. Get existing results
      const { data: existingResults, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('activity_id')
        .eq('trip_report_id', reportId);
        
      if (existingError) {
        console.error('Error fetching existing results:', existingError);
        return `Error: ${existingError.message}`;
      }
      
      const existingActivityIds = existingResults?.map(r => r.activity_id) || [];
      
      // Find missing activity IDs
      const missingActivityIds = allActivityIds.filter(id => !existingActivityIds.includes(id));
      
      if (missingActivityIds.length === 0) {
        return 'No missing activities found. Report appears to be complete.';
      }
      
      console.log(`Found ${missingActivityIds.length} missing activities`);
      
      // 4. Create missing results
      for (const activityId of missingActivityIds) {
        const { error: insertError } = await supabase
          .from('trip_activity_results')
          .insert({
            trip_report_id: reportId,
            activity_id: activityId,
            check_status: 'pending',
            remarks: '',
            inspector_id: reportData.inspector_id
          });
          
        if (insertError) {
          console.error(`Error creating result for activity ${activityId}:`, insertError);
        }
      }
      
      return `Report repair complete. Created ${missingActivityIds.length} missing activity results.`;
    } catch (error) {
      console.error('Error repairing report:', error);
      return `Error during repair: ${error}`;
    }
  },
  
  /**
   * Show a diagnostic alert for a report
   */
  showDiagnosticAlert: async (reportId: string) => {
    try {
      const diagnosis = await diagnosticTools.checkTripReport(reportId);
      
      Alert.alert(
        'Trip Report Diagnosis',
        diagnosis,
        [
          { 
            text: 'Repair Report', 
            onPress: async () => {
              const repairResult = await diagnosticTools.repairTripReport(reportId);
              Alert.alert('Repair Result', repairResult);
            } 
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error showing diagnostic alert:', error);
      Alert.alert('Error', `Error diagnosing report: ${error}`);
    }
  },
  
  /**
   * Detailed analysis of report sections and activities to identify gaps
   */
  analyzeReportSections: async (reportId: string) => {
    try {
      console.log(`Analyzing sections and activities for report: ${reportId}`);
      
      // 1. Get the report data
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        console.error('Error fetching report:', reportError);
        return `Error: ${reportError.message}`;
      }
      
      // 2. Get all sections and categories in the system
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('inspection_sections')
        .select(`
          id, name, section_number, display_order,
          inspection_categories!inner(
            id, name, category_number, display_order,
            inspection_activities!inner(id, activity_number, activity_text, is_compulsory)
          )
        `)
        .order('display_order');
        
      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        return `Error: ${sectionsError.message}`;
      }
      
      // 3. Get all activity results for this report
      const { data: resultsData, error: resultsError } = await supabase
        .from('trip_activity_results')
        .select('*')
        .eq('trip_report_id', reportId);
        
      if (resultsError) {
        console.error('Error fetching results:', resultsError);
        return `Error: ${resultsError.message}`;
      }
      
      // 4. Analyze each section and category for missing activities
      let report = `Analysis for Report ID: ${reportId}\n\n`;
      let totalActivities = 0;
      let totalResults = resultsData?.length || 0;
      let sectionsWithIssues = 0;
      let categoriesWithIssues = 0;
      
      // Map activity IDs to make lookup faster
      const activityResultMap = new Map();
      if (resultsData) {
        resultsData.forEach(result => {
          activityResultMap.set(result.activity_id, result);
        });
      }
      
      // Create section by section report
      sectionsData.forEach(section => {
        let sectionActivities = 0;
        let sectionResults = 0;
        let sectionHasIssues = false;
        
        // Start section report
        report += `Section ${section.section_number}: ${section.name}\n`;
        
        section.inspection_categories.forEach(category => {
          let categoryActivities = category.inspection_activities.length;
          let categoryResults = 0;
          
          sectionActivities += categoryActivities;
          totalActivities += categoryActivities;
          
          // Count how many activities in this category have results
          category.inspection_activities.forEach(activity => {
            if (activityResultMap.has(activity.id)) {
              categoryResults++;
              sectionResults++;
            }
          });
          
          // Report category status
          if (categoryResults < categoryActivities) {
            sectionHasIssues = true;
            categoriesWithIssues++;
            report += `  - Category ${category.category_number}: ${category.name} - ISSUE: ${categoryResults}/${categoryActivities} activities have results\n`;
          } else {
            report += `  - Category ${category.category_number}: ${category.name} - OK: ${categoryResults}/${categoryActivities} activities have results\n`;
          }
        });
        
        // Add section summary
        if (sectionHasIssues) {
          sectionsWithIssues++;
          report += `  Section Summary: ISSUE - ${sectionResults}/${sectionActivities} activities have results\n\n`;
        } else {
          report += `  Section Summary: OK - ${sectionResults}/${sectionActivities} activities have results\n\n`;
        }
      });
      
      // Overall summary
      report += `Overall Summary:\n`;
      report += `Total Activities: ${totalActivities}\n`;
      report += `Activities with Results: ${totalResults}\n`;
      report += `Missing Results: ${totalActivities - totalResults}\n`;
      report += `Sections with Issues: ${sectionsWithIssues}/${sectionsData.length}\n`;
      report += `Categories with Issues: ${categoriesWithIssues}\n`;
      
      return report;
    } catch (error) {
      console.error('Error analyzing report sections:', error);
      return `Error during analysis: ${error}`;
    }
  },
  
  /**
   * Comprehensive repair to ensure all activities for all sections are properly initialized
   */
  comprehensiveRepair: async (reportId: string) => {
    try {
      console.log(`Performing comprehensive repair for report: ${reportId}`);
      
      // 1. Get the report data
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) {
        console.error('Error fetching report:', reportError);
        return `Error: ${reportError.message}`;
      }
      
      // 2. Get all activities from all sections and categories
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('inspection_activities')
        .select('id, activity_number, category_id')
        .eq('active', true);
        
      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return `Error: ${activitiesError.message}`;
      }
      
      if (!activitiesData || activitiesData.length === 0) {
        return 'No activities found in the system.';
      }
      
      console.log(`Found ${activitiesData.length} total activities in the system`);
      
      // 3. Get existing results for this report
      const { data: existingResults, error: existingError } = await supabase
        .from('trip_activity_results')
        .select('activity_id')
        .eq('trip_report_id', reportId);
        
      if (existingError) {
        console.error('Error fetching existing results:', existingError);
        return `Error: ${existingError.message}`;
      }
      
      // 4. Find activities without results
      const existingActivityIds = existingResults?.map(r => r.activity_id) || [];
      const missingActivityIds = activitiesData
        .filter(activity => !existingActivityIds.includes(activity.id))
        .map(activity => ({
          activityId: activity.id,
          activityNumber: activity.activity_number,
          categoryId: activity.category_id
        }));
      
      console.log(`Found ${missingActivityIds.length} activities without results`);
      
      // 5. Create results for all missing activities
      let createdCount = 0;
      let errorCount = 0;
      
      for (const activity of missingActivityIds) {
        try {
          const { error: insertError } = await supabase
            .from('trip_activity_results')
            .insert({
              trip_report_id: reportId,
              activity_id: activity.activityId,
              check_status: 'pending',
              remarks: '',
              inspector_id: reportData.inspector_id
            });
            
          if (insertError) {
            console.error(`Error creating result for activity ${activity.activityId}:`, insertError);
            errorCount++;
          } else {
            createdCount++;
          }
        } catch (err) {
          console.error(`Exception creating result for activity ${activity.activityId}:`, err);
          errorCount++;
        }
      }
      
      return `Comprehensive repair complete.
Created ${createdCount} missing activity results.
Errors: ${errorCount}
Total activities in system: ${activitiesData.length}
Previous existing results: ${existingActivityIds.length}
New total results: ${existingActivityIds.length + createdCount}`;
    } catch (error) {
      console.error('Error in comprehensive repair:', error);
      return `Error during comprehensive repair: ${error}`;
    }
  },
  
  /**
   * Show detailed diagnostic and repair options for a report
   */
  showAdvancedDiagnosticAlert: async (reportId: string) => {
    try {
      const basicDiagnosis = await diagnosticTools.checkTripReport(reportId);
      
      Alert.alert(
        'Trip Report Diagnosis',
        basicDiagnosis,
        [
          { 
            text: 'Basic Repair', 
            onPress: async () => {
              const repairResult = await diagnosticTools.repairTripReport(reportId);
              Alert.alert('Repair Result', repairResult);
            } 
          },
          {
            text: 'Detailed Analysis',
            onPress: async () => {
              const analysis = await diagnosticTools.analyzeReportSections(reportId);
              Alert.alert('Detailed Analysis', analysis, [
                {
                  text: 'Comprehensive Repair',
                  onPress: async () => {
                    const fullRepairResult = await diagnosticTools.comprehensiveRepair(reportId);
                    Alert.alert('Comprehensive Repair Result', fullRepairResult);
                  }
                },
                { text: 'Close', style: 'cancel' }
              ]);
            }
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error showing advanced diagnostic alert:', error);
      Alert.alert('Error', `Error diagnosing report: ${error}`);
    }
  }
}; 
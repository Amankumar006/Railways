import { supabase } from '@/lib/supabase';
import { TripReport } from '@/types/inspection';

/**
 * Service for fetching and processing report data
 * Extracted from pdfGenerator.ts to improve separation of concerns
 */

interface ReportStats {
  total_activities: number;
  checked_okay: number;
  checked_not_okay: number;
  unchecked: number;
}

/**
 * Fetch a complete trip report with all related data
 */
export async function fetchTripReportData(reportId: string): Promise<TripReport | null> {
  try {
    console.log('Fetching trip report data for report:', reportId);
    
    // Fetch the trip report with inspector details using a join
    const { data: reportData, error: reportError } = await supabase
      .from('trip_reports')
      .select(`
        *,
        inspector:inspector_id (
          id,
          name:full_name,
          email
        )
      `)
      .eq('id', reportId)
      .single();
      
    if (reportError) {
      console.error('Error fetching trip report:', reportError);
      throw reportError;
    }
    
    if (!reportData) {
      console.error('Trip report not found');
      return null;
    }
    
    // Fetch all sections, categories, and activities in a single optimized query
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('inspection_sections')
      .select(`
        id, name, section_number,
        inspection_categories!inner(
          id, name, category_number,
          inspection_activities!inner(
            id, activity_number, activity_text, is_compulsory
          )
        )
      `)
      .order('display_order');
      
    if (sectionsError) {
      console.error('Error fetching inspection structure:', sectionsError);
      throw sectionsError;
    }
    
    // Fetch all results for this report in a single query
    const { data: resultsData, error: resultsError } = await supabase
      .from('trip_activity_results')
      .select('*')
      .eq('trip_report_id', reportId);
      
    if (resultsError) {
      console.error('Error fetching activity results:', resultsError);
      throw resultsError;
    }
    
    // Process and combine the data
    const processedSections = sectionsData.map(section => {
      const categories = section.inspection_categories.map(category => {
        const activities = category.inspection_activities.map(activity => {
          // Find the corresponding result for this activity
          const result = resultsData.find(r => r.activity_id === activity.id);
          
          return {
            id: activity.id,
            activity_number: activity.activity_number,
            activity_text: activity.activity_text,
            is_compulsory: activity.is_compulsory,
            check_status: result ? result.check_status : 'pending',
            remarks: result ? result.remarks || '' : ''
          };
        }).sort((a, b) => a.activity_number.localeCompare(b.activity_number));
        
        return {
          id: category.id,
          category_number: category.category_number,
          name: category.name,
          activities
        };
      }).sort((a, b) => a.category_number.localeCompare(b.category_number));
      
      return {
        id: section.id,
        section_number: section.section_number,
        name: section.name,
        categories
      };
    }).sort((a, b) => a.section_number.localeCompare(b.section_number));
    
    // Calculate statistics
    const stats = calculateReportStats(processedSections);
    
    // Combine everything into the final report object
    const finalReport: TripReport = {
      ...reportData,
      sections: processedSections,
      stats
    };
    
    return finalReport;
  } catch (error) {
    console.error('Error in fetchTripReportData:', error);
    throw error;
  }
}

/**
 * Calculate statistics for the report
 */
function calculateReportStats(sections: any[]): ReportStats {
  let total_activities = 0;
  let checked_okay = 0;
  let checked_not_okay = 0;
  let unchecked = 0;
  
  sections.forEach(section => {
    section.categories.forEach(category => {
      category.activities.forEach(activity => {
        total_activities++;
        
        switch (activity.check_status) {
          case 'checked-okay':
            checked_okay++;
            break;
          case 'checked-not-okay':
            checked_not_okay++;
            break;
          default:
            unchecked++;
            break;
        }
      });
    });
  });
  
  return {
    total_activities,
    checked_okay,
    checked_not_okay,
    unchecked
  };
}

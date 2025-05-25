import { supabase } from '@/lib/supabase';
import { TripReport } from '@/types/inspection';

/**
 * Service for fetching and processing report data
 * Extracted from pdfGenerator.ts to improve separation of concerns
 */

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface DatabaseTripReport {
  id: string;
  inspector_id: string;
  train_number: string;
  train_name: string;
  location: string;
  line_no: string;
  date: string;
  red_on_time: string;
  red_off_time: string;
  status: "submitted" | "approved" | "rejected" | "draft";
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  inspector: Profile;
  trip_activity_results: any[];
}

interface ReportStats {
  total_activities: number;
  checked_okay: number;
  checked_not_okay: number;
  unchecked: number;
}

interface Section {
  id: string;
  section_number: string;
  name: string;
  categories: Category[];
}

interface Category {
  id: string;
  category_number: string;
  name: string;
  activities: Activity[];
}

interface Activity {
  id: string;
  activity_number: string;
  activity_text: string;
  is_compulsory: boolean;
  check_status: 'pending' | 'checked-okay' | 'checked-not-okay';
  remarks: string;
}

/**
 * Fetch a complete trip report with all related data
 */
export async function fetchTripReportData(reportId: string): Promise<TripReport | null> {
  try {
    console.log('Fetching trip report data for report:', reportId);
    
    // Fetch the trip report with inspector details and activity results using explicit joins
    const { data: reportData, error: reportError } = await supabase
      .from('trip_reports')
      .select(`
        id,
        inspector_id,
        train_number,
        train_name,
        location,
        line_no,
        date,
        red_on_time,
        red_off_time,
        status,
        comments,
        created_at,
        submitted_at,
        reviewed_at,
        approved_at,
        supervisor_id,
        updated_at,
        trip_activity_results(
          id,
          activity_id,
          check_status,
          remarks,
          inspector_id,
          checked_at,
          created_at,
          updated_at
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
    
    // Fetch inspector details separately
    const { data: inspectorData, error: inspectorError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', reportData.inspector_id)
      .single();

    if (inspectorError) {
      console.error('Error fetching inspector details:', inspectorError);
      throw inspectorError;
    }
    
    // Transform the data to match expected format
    const transformedReportData = {
      ...reportData,
      inspector: inspectorData ? {
        id: inspectorData.id,
        name: inspectorData.name,
        email: inspectorData.email
      } : null,
      trip_activity_results: reportData.trip_activity_results
    };
    
    // Fetch all sections, categories, and activities in a single optimized query
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('inspection_sections')
      .select(`
        id, name, section_number,
        inspection_categories(
          id, name, category_number,
          inspection_activities(
            id, activity_number, activity_text, is_compulsory
          )
        )
      `)
      .order('display_order');
      
    if (sectionsError) {
      console.error('Error fetching inspection structure:', sectionsError);
      throw sectionsError;
    }
    
    // Process and combine the data
    const processedSections = sectionsData.map(section => {
      const categories = section.inspection_categories.map(category => {
        const activities = category.inspection_activities.map(activity => {
          // Find the corresponding result for this activity from the joined data
          const result = transformedReportData.trip_activity_results?.find(r => r.activity_id === activity.id);
          
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
      ...transformedReportData,
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
function calculateReportStats(sections: Section[]): ReportStats {
  let total_activities = 0;
  let checked_okay = 0;
  let checked_not_okay = 0;
  let unchecked = 0;
  
  sections.forEach((section: Section) => {
    section.categories.forEach((category: Category) => {
      category.activities.forEach((activity: Activity) => {
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

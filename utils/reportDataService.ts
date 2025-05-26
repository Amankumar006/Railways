import { supabase } from '@/lib/supabase';
import { TripReport } from '@/types/inspection';

/**
 * Enhanced service for fetching and processing report data
 * Features: Error handling, retry logic, caching, and fallback mechanisms
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
  line_number: string;
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
  completion_percentage: number;
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

// Simple in-memory cache for report data
const reportCache = new Map<string, { data: TripReport; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Enhanced function to fetch a complete trip report with all related data
 * Features: Retry logic, caching, fallback mechanisms, and better error handling
 */
export async function fetchTripReportData(reportId: string, useCache: boolean = true): Promise<TripReport | null> {
  try {
    console.log('Fetching trip report data for report:', reportId);
    
    // Check cache first
    if (useCache) {
      const cached = reportCache.get(reportId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached report data');
        return cached.data;
      }
    }
    
    // Fetch with retry logic
    const reportData = await fetchReportWithRetry(reportId);
    if (!reportData) {
      console.error('Trip report not found');
      return null;
    }
    
    // Fetch inspector details with fallback
    const inspectorData = await fetchInspectorWithFallback(reportData.inspector_id);
    
    // Transform the data to match expected format
    const transformedReportData = {
      ...reportData,
      inspector: inspectorData,
      trip_activity_results: reportData.trip_activity_results || []
    };
    
    // Fetch inspection structure with fallback
    const sectionsData = await fetchInspectionStructureWithFallback();
    
    // Process and combine the data
    const processedSections = processInspectionSections(sectionsData, transformedReportData.trip_activity_results);
    
    // Calculate enhanced statistics
    const stats = calculateEnhancedReportStats(processedSections);
    
    // Combine everything into the final report object
    const finalReport: TripReport = {
      ...transformedReportData,
      sections: processedSections,
      stats
    };
    
    // Cache the result
    if (useCache) {
      reportCache.set(reportId, { data: finalReport, timestamp: Date.now() });
    }
    
    return finalReport;
  } catch (error) {
    console.error('Error in fetchTripReportData:', error);
    
    // Try to return cached data as fallback
    if (useCache) {
      const cached = reportCache.get(reportId);
      if (cached) {
        console.log('Returning stale cached data due to error');
        return cached.data;
      }
    }
    
    throw error;
  }
}

/**
 * Fetch report data with retry logic
 */
async function fetchReportWithRetry(reportId: string, maxRetries: number = 3): Promise<any> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching report data (attempt ${attempt}/${maxRetries})`);
      
      const { data: reportData, error: reportError } = await supabase
        .from('trip_reports')
        .select(`
          id,
          inspector_id,
          train_number,
          train_name,
          location,
          line_number,
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
        .maybeSingle();
        
              if (reportError) {
          throw reportError;
        }
        
        if (!reportData) {
          throw new Error(`Trip report with ID ${reportId} not found`);
        }
        
        return reportData;
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Fetch inspector details with fallback
 */
async function fetchInspectorWithFallback(inspectorId: string): Promise<any> {
  try {
    // Use maybeSingle() instead of single() to handle cases where no rows are found
    const { data: inspectorData, error: inspectorError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', inspectorId)
      .maybeSingle();

    if (inspectorError) {
      console.warn('Error fetching inspector details:', inspectorError);
      return {
        id: inspectorId,
        name: 'Unknown Inspector',
        email: 'unknown@railway.gov.in'
      };
    }
    
    // If no inspector data found, return fallback
    if (!inspectorData) {
      console.warn(`Inspector with ID ${inspectorId} not found in profiles table, using fallback`);
      return {
        id: inspectorId,
        name: 'Unknown Inspector',
        email: 'unknown@railway.gov.in'
      };
    }
    
    return {
      id: inspectorData.id,
      name: inspectorData.name,
      email: inspectorData.email
    };
  } catch (error) {
    console.warn('Failed to fetch inspector details, using fallback:', error);
    return {
      id: inspectorId,
      name: 'Unknown Inspector',
      email: 'unknown@railway.gov.in'
    };
  }
}

/**
 * Fetch inspection structure with fallback
 */
async function fetchInspectionStructureWithFallback(): Promise<any[]> {
  try {
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
      console.warn('Error fetching inspection structure:', sectionsError);
      return getDefaultInspectionStructure();
    }
    
    return sectionsData || getDefaultInspectionStructure();
  } catch (error) {
    console.warn('Failed to fetch inspection structure, using default:', error);
    return getDefaultInspectionStructure();
  }
}

/**
 * Default inspection structure as fallback
 */
function getDefaultInspectionStructure(): any[] {
  return [
    {
      id: 'default-1',
      section_number: '1',
      name: 'General Inspection',
      inspection_categories: [
        {
          id: 'default-cat-1',
          category_number: '1.1',
          name: 'Basic Checks',
          inspection_activities: [
            {
              id: 'default-act-1',
              activity_number: '1.1.1',
              activity_text: 'Visual inspection completed',
              is_compulsory: true
            }
          ]
        }
      ]
    }
  ];
}

/**
 * Process inspection sections with activity results
 */
function processInspectionSections(sectionsData: any[], activityResults: any[]): Section[] {
  return sectionsData.map(section => {
    const categories = section.inspection_categories.map((category: any) => {
      const activities = category.inspection_activities.map((activity: any) => {
        // Find the corresponding result for this activity from the joined data
        const result = activityResults?.find(r => r.activity_id === activity.id);
        
        return {
          id: activity.id,
          activity_number: activity.activity_number,
          activity_text: activity.activity_text,
          is_compulsory: activity.is_compulsory,
          check_status: result ? result.check_status : 'pending',
          remarks: result ? result.remarks || '' : ''
        };
      }).sort((a: any, b: any) => a.activity_number.localeCompare(b.activity_number));
      
      return {
        id: category.id,
        category_number: category.category_number,
        name: category.name,
        activities
      };
    }).sort((a: any, b: any) => a.category_number.localeCompare(b.category_number));
    
    return {
      id: section.id,
      section_number: section.section_number,
      name: section.name,
      categories
    };
  }).sort((a, b) => a.section_number.localeCompare(b.section_number));
}

/**
 * Calculate enhanced statistics for the report
 */
function calculateEnhancedReportStats(sections: Section[]): ReportStats {
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
  
  const completion_percentage = total_activities > 0 
    ? Math.round(((checked_okay + checked_not_okay) / total_activities) * 100) 
    : 0;
  
  return {
    total_activities,
    checked_okay,
    checked_not_okay,
    unchecked,
    completion_percentage
  };
}

/**
 * Clear the report cache
 */
export function clearReportCache(): void {
  reportCache.clear();
  console.log('Report cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: reportCache.size,
    keys: Array.from(reportCache.keys())
  };
}

/**
 * Batch fetch multiple reports (for admin dashboard)
 */
export async function fetchMultipleReports(reportIds: string[]): Promise<TripReport[]> {
  const results = await Promise.allSettled(
    reportIds.map(id => fetchTripReportData(id))
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<TripReport> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
}

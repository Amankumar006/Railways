import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Define the trip report type
export type TripReport = {
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

const PAGE_SIZE = 10;

/**
 * Fetch paginated trip reports with optimized query
 */
export const fetchReportPage = async ({ pageParam = 0 }) => {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  
  console.log(`Fetching reports page ${pageParam} (${from}-${to})`);
  
  const { data: reportsData, error: reportsError, count } = await supabase
    .from('trip_reports')
    .select(`
      *,
      inspector:inspector_id(id, name, email),
      trip_activity_results!trip_report_id(check_status)
    `, { count: 'exact' })
    .in('status', ['submitted', 'approved', 'rejected'])
    .order('created_at', { ascending: false })
    .range(from, to);
    
  if (reportsError) {
    throw reportsError;
  }
  
  // Process the reports with their statistics
  const reportsWithStats = (reportsData || []).map(report => {
    // Calculate statistics from the joined trip_activity_results
    const results = report.trip_activity_results || [];
    const checkedOkay = results.filter((r: { check_status: string }) => r.check_status === 'checked-okay').length;
    const checkedNotOkay = results.filter((r: { check_status: string }) => r.check_status === 'checked-not-okay').length;
    const totalActivities = results.length;
    const unchecked = totalActivities - (checkedOkay + checkedNotOkay);
    
    return {
      ...report,
      trip_activity_results: undefined, // Remove the raw results from the object
      stats: {
        total_activities: totalActivities,
        checked_okay: checkedOkay,
        checked_not_okay: checkedNotOkay,
        unchecked: unchecked
      }
    };
  });
  
  return {
    reports: reportsWithStats,
    nextPage: reportsData && reportsData.length === PAGE_SIZE ? pageParam + 1 : undefined,
    totalCount: count || 0
  };
};

/**
 * Hook to fetch a single report by ID
 */
export const useReport = (reportId: string | null) => {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      
      const { data, error } = await supabase
        .from('trip_reports')
        .select(`
          *,
          inspector:inspector_id(id, name, email),
          trip_activity_results!trip_report_id(*)
        `)
        .eq('id', reportId)
        .single();
        
      if (error) throw error;
      
      // Process the report to include statistics
      if (data) {
        const results = data.trip_activity_results || [];
        const checkedOkay = results.filter((r: { check_status: string }) => r.check_status === 'checked-okay').length;
        const checkedNotOkay = results.filter((r: { check_status: string }) => r.check_status === 'checked-not-okay').length;
        const totalActivities = results.length;
        const unchecked = totalActivities - (checkedOkay + checkedNotOkay);
        
        return {
          ...data,
          stats: {
            total_activities: totalActivities,
            checked_okay: checkedOkay,
            checked_not_okay: checkedNotOkay,
            unchecked: unchecked
          }
        };
      }
      
      return data;
    },
    enabled: !!reportId, // Only run the query if reportId is provided
  });
};

/**
 * Hook to fetch paginated reports with infinite loading
 */
export const useInfiniteReports = () => {
  return useInfiniteQuery({
    queryKey: ['reports'],
    queryFn: fetchReportPage,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};

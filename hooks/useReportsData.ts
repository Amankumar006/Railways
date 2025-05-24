import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

/**
 * Custom hook for fetching and managing reports data with pagination
 */
export function useReportsData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Number of reports to fetch per page
  const PAGE_SIZE = 10;

  /**
   * Fetch reports with pagination
   */
  const fetchReports = async ({ pageParam = 0 }) => {
    try {
      console.log(`Fetching reports page ${pageParam}, filter: ${filterStatus || 'all'}`);
      
      // Build the query with more detailed selection
      let query = supabase
        .from('trip_reports')
        .select(`
          id,
          train_number,
          train_name,
          date,
          location,
          status,
          created_at,
          submitted_at,
          inspector_id,
          red_on_time,
          red_off_time,
          trip_activity_results!trip_report_id(*)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      
      // Apply status filter if selected
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      
      // Apply user role filter
      if (user?.role === 'inspector') {
        // Inspectors can only see their own reports
        query = query.eq('inspector_id', user.id);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} reports`);
      
      // Format the data for display with enhanced logging
      const formattedData = data?.map(report => {
        // Log the raw report data to help diagnose issues
        console.log(`Processing report ${report.id}:`);
        console.log(`- Train: ${report.train_number || 'N/A'} (${report.train_name || 'N/A'})`);
        console.log(`- Location: ${report.location || 'N/A'}`);
        console.log(`- Status: ${report.status}`);
        console.log(`- Activity results count: ${report.trip_activity_results?.length || 0}`);
        
        // Calculate statistics from the trip_activity_results
        const results = report.trip_activity_results || [];
        const checkedOkay = results.filter((r: { check_status: string }) => r.check_status === 'checked-okay').length;
        const checkedNotOkay = results.filter((r: { check_status: string }) => r.check_status === 'checked-not-okay').length;
        const totalActivities = results.length;
        const unchecked = totalActivities - (checkedOkay + checkedNotOkay);
        
        console.log(`- Statistics: OK=${checkedOkay}, Not OK=${checkedNotOkay}, Pending=${unchecked}, Total=${totalActivities}`);
        
        // Format dates for display
        let formattedDate = 'Unknown';
        try {
          formattedDate = report.date ? new Date(report.date).toLocaleDateString('en-IN') : 'Unknown';
        } catch (e) {
          console.error(`Error formatting date for report ${report.id}:`, e);
        }
        
        let formattedCreatedAt = 'Unknown';
        try {
          formattedCreatedAt = report.created_at ? new Date(report.created_at).toLocaleDateString('en-IN') : 'Unknown';
        } catch (e) {
          console.error(`Error formatting created_at for report ${report.id}:`, e);
        }
        
        let formattedSubmittedAt = null;
        try {
          formattedSubmittedAt = report.submitted_at ? new Date(report.submitted_at).toLocaleDateString('en-IN') : null;
        } catch (e) {
          console.error(`Error formatting submitted_at for report ${report.id}:`, e);
        }
        
        // Create a formatted report object with all necessary data
        return {
          ...report,
          date: formattedDate,
          created_at: formattedCreatedAt,
          submitted_at: formattedSubmittedAt,
          inspector_id: report.inspector_id || 'Unknown',
          train_number: report.train_number || 'Unknown',  // Ensure train number is always available
          train_name: report.train_name || '',  // Ensure train name is always available
          location: report.location || 'Unknown',  // Ensure location is always available
          stats: {
            total_activities: totalActivities,
            checked_okay: checkedOkay,
            checked_not_okay: checkedNotOkay,
            unchecked: unchecked
          }
        };
      }) || [];
      
      // Check if there are more pages
      const hasNextPage = data?.length === PAGE_SIZE;
      
      return {
        data: formattedData,
        nextPage: hasNextPage ? pageParam + 1 : undefined,
        totalCount: count
      };
    } catch (error) {
      console.error('Error in fetchReports:', error);
      throw error;
    }
  };

  /**
   * Use React Query's useInfiniteQuery for efficient data fetching with pagination
   */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['reports', filterStatus, user?.id, user?.role],
    queryFn: fetchReports,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  /**
   * Get all reports data from all pages
   */
  const getAllReports = () => {
    return data?.pages.flatMap(page => page.data) || [];
  };

  /**
   * Delete a report
   */
  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('trip_reports')
        .delete()
        .eq('id', reportId);
        
      if (error) {
        console.error('Error deleting report:', error);
        throw error;
      }
      
      // Invalidate the reports query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      return true;
    } catch (error) {
      console.error('Error in deleteReport:', error);
      throw error;
    }
  };

  return {
    reports: getAllReports(),
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    filterStatus,
    setFilterStatus,
    deleteReport
  };
}

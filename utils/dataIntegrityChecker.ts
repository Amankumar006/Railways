import { supabase } from '@/lib/supabase';

/**
 * Utility to check and fix data integrity issues
 */

interface IntegrityIssue {
  type: 'missing_profile' | 'orphaned_report';
  reportId: string;
  inspectorId: string;
  details: string;
}

/**
 * Check for data integrity issues between trip_reports and profiles
 */
export async function checkDataIntegrity(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];
  
  try {
    console.log('Checking data integrity...');
    
    // Get all trip reports with their inspector IDs
    const { data: tripReports, error: reportsError } = await supabase
      .from('trip_reports')
      .select('id, inspector_id');
    
    if (reportsError) {
      console.error('Error fetching trip reports:', reportsError);
      return issues;
    }
    
    if (!tripReports || tripReports.length === 0) {
      console.log('No trip reports found');
      return issues;
    }
    
    // Get all unique inspector IDs
    const inspectorIds = [...new Set(tripReports.map(report => report.inspector_id))];
    console.log(`Found ${inspectorIds.length} unique inspector IDs in trip reports`);
    
    // Check which inspector IDs exist in profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', inspectorIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return issues;
    }
    
    const existingProfileIds = new Set(profiles?.map(profile => profile.id) || []);
    console.log(`Found ${existingProfileIds.size} existing profiles`);
    
    // Find missing profiles
    for (const report of tripReports) {
      if (!existingProfileIds.has(report.inspector_id)) {
        issues.push({
          type: 'missing_profile',
          reportId: report.id,
          inspectorId: report.inspector_id,
          details: `Trip report ${report.id} references inspector ${report.inspector_id} which doesn't exist in profiles table`
        });
      }
    }
    
    console.log(`Found ${issues.length} data integrity issues`);
    return issues;
    
  } catch (error) {
    console.error('Error checking data integrity:', error);
    return issues;
  }
}

/**
 * Create missing profiles for orphaned trip reports
 */
export async function createMissingProfiles(issues: IntegrityIssue[]): Promise<void> {
  const missingProfileIssues = issues.filter(issue => issue.type === 'missing_profile');
  
  if (missingProfileIssues.length === 0) {
    console.log('No missing profiles to create');
    return;
  }
  
  // Get unique missing inspector IDs
  const missingInspectorIds = [...new Set(missingProfileIssues.map(issue => issue.inspectorId))];
  
  console.log(`Creating ${missingInspectorIds.length} missing profiles...`);
  
  // Create profiles for missing inspectors
  const profilesToCreate = missingInspectorIds.map(inspectorId => ({
    id: inspectorId,
    name: 'Unknown Inspector',
    email: `unknown.${inspectorId.slice(0, 8)}@railway.gov.in`,
    role: 'inspector',
    approval_status: 'approved', // Set as approved so they don't block report generation
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  try {
    const { error } = await supabase
      .from('profiles')
      .insert(profilesToCreate);
    
    if (error) {
      console.error('Error creating missing profiles:', error);
      throw error;
    }
    
    console.log(`Successfully created ${profilesToCreate.length} missing profiles`);
  } catch (error) {
    console.error('Failed to create missing profiles:', error);
    throw error;
  }
}

/**
 * Fix all data integrity issues
 */
export async function fixDataIntegrityIssues(): Promise<void> {
  try {
    console.log('Starting data integrity fix...');
    
    const issues = await checkDataIntegrity();
    
    if (issues.length === 0) {
      console.log('No data integrity issues found');
      return;
    }
    
    console.log(`Found ${issues.length} issues to fix:`);
    issues.forEach(issue => {
      console.log(`- ${issue.type}: ${issue.details}`);
    });
    
    await createMissingProfiles(issues);
    
    console.log('Data integrity fix completed');
  } catch (error) {
    console.error('Error fixing data integrity issues:', error);
    throw error;
  }
}

/**
 * Get a summary of data integrity status
 */
export async function getDataIntegritySummary(): Promise<{
  totalReports: number;
  totalProfiles: number;
  issues: IntegrityIssue[];
  isHealthy: boolean;
}> {
  try {
    const issues = await checkDataIntegrity();
    
    const { count: totalReports } = await supabase
      .from('trip_reports')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    return {
      totalReports: totalReports || 0,
      totalProfiles: totalProfiles || 0,
      issues,
      isHealthy: issues.length === 0
    };
  } catch (error) {
    console.error('Error getting data integrity summary:', error);
    throw error;
  }
} 
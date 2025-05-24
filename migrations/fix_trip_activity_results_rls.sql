-- Migration to fix Row-Level Security policy for trip_activity_results table
-- This addresses the error: "new row violates row-level security policy for table 'trip_activity_results'"

-- First, drop any existing RLS policies on the table
DROP POLICY IF EXISTS "Users can view their own trip activity results" ON trip_activity_results;
DROP POLICY IF EXISTS "Users can insert their own trip activity results" ON trip_activity_results;
DROP POLICY IF EXISTS "Users can update their own trip activity results" ON trip_activity_results;

-- Enable Row Level Security on the table if not already enabled
ALTER TABLE trip_activity_results ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view trip activity results they created
CREATE POLICY "Users can view their own trip activity results"
ON trip_activity_results
FOR SELECT
USING (
  auth.uid() = inspector_id OR 
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('supervisor', 'manager', 'admin')
  )
);

-- Create a policy that allows users to insert their own trip activity results
CREATE POLICY "Users can insert their own trip activity results"
ON trip_activity_results
FOR INSERT
WITH CHECK (
  auth.uid() = inspector_id
);

-- Create a policy that allows users to update their own trip activity results
CREATE POLICY "Users can update their own trip activity results"
ON trip_activity_results
FOR UPDATE
USING (
  auth.uid() = inspector_id
)
WITH CHECK (
  auth.uid() = inspector_id
);

-- Create a policy that allows supervisors and managers to update any trip activity results
CREATE POLICY "Supervisors and managers can update any trip activity results"
ON trip_activity_results
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('supervisor', 'manager', 'admin')
  )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON trip_activity_results TO authenticated;

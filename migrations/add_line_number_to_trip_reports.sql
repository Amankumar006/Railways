-- Migration to add line_number column to trip_reports table
-- This addresses the error: "column trip_reports.line_number does not exist"

-- Add the line_number column to the trip_reports table
ALTER TABLE trip_reports 
ADD COLUMN IF NOT EXISTS line_number VARCHAR(10);

-- Add a comment to document the column
COMMENT ON COLUMN trip_reports.line_number IS 'Railway line number (e.g., 09, 10, 11, 12)';

-- Create an index on line_number for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_reports_line_number ON trip_reports(line_number);

-- Update any existing records to have a default line_number if needed
-- (This is optional - you can remove this if you don't want to set defaults)
UPDATE trip_reports 
SET line_number = '10' 
WHERE line_number IS NULL; 
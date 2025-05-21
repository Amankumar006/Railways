/*
  # Trip Inspection Schema for Railway Coach Inspection App

  This migration creates a comprehensive inspection checklist system with:
  1. Hierarchical structure (sections -> categories -> activities)
  2. Trip reporting with results tracking
  3. Full RLS (Row Level Security) implementation for data protection
  4. Appropriate indexes for query performance
  5. Reference integrity via foreign keys
  6. Audit timestamps for tracking record changes
*/

-- Create enums
DO $$ 
BEGIN
  -- Check status enum (if it doesn't already exist)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'check_status') THEN
    CREATE TYPE check_status AS ENUM ('pending', 'checked-okay', 'checked-not-okay');
  END IF;
  
  -- Trip report status enum (if it doesn't already exist)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_report_status') THEN
    CREATE TYPE trip_report_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved');
  END IF;
END $$;

-- Main tables
CREATE TABLE IF NOT EXISTS trip_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_number text NOT NULL,
  inspector_id uuid REFERENCES profiles(id) NOT NULL,
  supervisor_id uuid REFERENCES profiles(id),
  date timestamptz NOT NULL DEFAULT now(),
  location text,
  red_on_time text,
  red_off_time text,
  status trip_report_status NOT NULL DEFAULT 'draft',
  comments text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sections table - high level grouping (e.g., "Cleaning", "Interior")
CREATE TABLE IF NOT EXISTS inspection_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_number text NOT NULL,
  name text NOT NULL,
  description text,
  display_order int NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section_number)
);

-- Categories table - mid-level grouping (e.g., "Gangway - Hubner")
CREATE TABLE IF NOT EXISTS inspection_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id uuid REFERENCES inspection_sections(id) ON DELETE CASCADE NOT NULL,
  category_number text NOT NULL,
  name text NOT NULL,
  description text,
  applicable_coaches text[], -- e.g., ['DTC', 'NDTC', 'MC', 'TC']
  display_order int NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section_id, category_number)
);

-- Activities table - individual inspection items
CREATE TABLE IF NOT EXISTS inspection_activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES inspection_categories(id) ON DELETE CASCADE NOT NULL,
  activity_number text NOT NULL,
  activity_text text NOT NULL,
  is_compulsory boolean NOT NULL DEFAULT false,
  display_order int NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, activity_number)
);

-- Results table - stores actual inspection results
CREATE TABLE IF NOT EXISTS trip_activity_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_report_id uuid REFERENCES trip_reports(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES inspection_activities(id) NOT NULL,
  check_status check_status NOT NULL DEFAULT 'pending',
  remarks text,
  inspector_id uuid REFERENCES profiles(id) NOT NULL,
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_report_id, activity_id)
);

-- Audit history table - tracks changes to inspection results
CREATE TABLE IF NOT EXISTS trip_result_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id uuid REFERENCES trip_activity_results(id) ON DELETE CASCADE NOT NULL,
  previous_status check_status,
  new_status check_status NOT NULL,
  previous_remarks text,
  new_remarks text,
  changed_by uuid REFERENCES profiles(id) NOT NULL,
  changed_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_reports_inspector ON trip_reports(inspector_id);
CREATE INDEX IF NOT EXISTS idx_trip_reports_date ON trip_reports(date);
CREATE INDEX IF NOT EXISTS idx_trip_reports_status ON trip_reports(status);
CREATE INDEX IF NOT EXISTS idx_inspection_sections_order ON inspection_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_inspection_categories_section ON inspection_categories(section_id);
CREATE INDEX IF NOT EXISTS idx_inspection_categories_order ON inspection_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_inspection_activities_category ON inspection_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_inspection_activities_order ON inspection_activities(display_order);
CREATE INDEX IF NOT EXISTS idx_trip_activity_results_report ON trip_activity_results(trip_report_id);
CREATE INDEX IF NOT EXISTS idx_trip_activity_results_activity ON trip_activity_results(activity_id);
CREATE INDEX IF NOT EXISTS idx_trip_result_history_result ON trip_result_history(result_id);

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update timestamps triggers
CREATE TRIGGER update_trip_reports_updated_at
  BEFORE UPDATE ON trip_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inspection_sections_updated_at
  BEFORE UPDATE ON inspection_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inspection_categories_updated_at
  BEFORE UPDATE ON inspection_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inspection_activities_updated_at
  BEFORE UPDATE ON inspection_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trip_activity_results_updated_at
  BEFORE UPDATE ON trip_activity_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create audit history trigger
CREATE OR REPLACE FUNCTION log_trip_result_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- Only log changes if status or remarks have changed
    IF (OLD.check_status != NEW.check_status OR OLD.remarks IS DISTINCT FROM NEW.remarks) THEN
      INSERT INTO trip_result_history (
        result_id, 
        previous_status, 
        new_status, 
        previous_remarks, 
        new_remarks, 
        changed_by
      )
      VALUES (
        NEW.id,
        OLD.check_status,
        NEW.check_status,
        OLD.remarks,
        NEW.remarks,
        auth.uid()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_result_history_trigger
  AFTER UPDATE ON trip_activity_results
  FOR EACH ROW
  EXECUTE FUNCTION log_trip_result_changes();

-- Enable Row Level Security
ALTER TABLE trip_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activity_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_result_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Trip Reports
CREATE POLICY "Users can view their own trip reports"
  ON trip_reports
  FOR SELECT
  TO authenticated
  USING (
    inspector_id = auth.uid() OR 
    supervisor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'supervisor' OR role = 'manager')
    )
  );

CREATE POLICY "Users can insert their own trip reports"
  ON trip_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "Users can update their own trip reports"
  ON trip_reports
  FOR UPDATE
  TO authenticated
  USING (
    inspector_id = auth.uid() OR 
    supervisor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'supervisor' OR role = 'manager')
    )
  );

-- RLS Policies for Sections, Categories, Activities
-- These are reference data that all authenticated users can view
CREATE POLICY "All users can view inspection sections"
  ON inspection_sections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view inspection categories"
  ON inspection_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view inspection activities"
  ON inspection_activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Only managers can modify the inspection structure
CREATE POLICY "Only managers can modify inspection sections"
  ON inspection_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

CREATE POLICY "Only managers can modify inspection categories"
  ON inspection_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

CREATE POLICY "Only managers can modify inspection activities"
  ON inspection_activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- RLS Policies for Trip Activity Results
CREATE POLICY "Users can view related trip activity results"
  ON trip_activity_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_reports
      WHERE trip_reports.id = trip_activity_results.trip_report_id
      AND (
        trip_reports.inspector_id = auth.uid() OR 
        trip_reports.supervisor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND (role = 'supervisor' OR role = 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can insert trip activity results"
  ON trip_activity_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    inspector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM trip_reports
      WHERE trip_reports.id = trip_activity_results.trip_report_id
      AND trip_reports.inspector_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own trip activity results"
  ON trip_activity_results
  FOR UPDATE
  TO authenticated
  USING (
    inspector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trip_reports
      WHERE trip_reports.id = trip_activity_results.trip_report_id
      AND (
        trip_reports.supervisor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'manager'
        )
      )
    )
  );

-- RLS Policies for History
CREATE POLICY "Users can view history of their own reports"
  ON trip_result_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_activity_results
      JOIN trip_reports ON trip_reports.id = trip_activity_results.trip_report_id
      WHERE trip_activity_results.id = trip_result_history.result_id
      AND (
        trip_reports.inspector_id = auth.uid() OR 
        trip_reports.supervisor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND (role = 'supervisor' OR role = 'manager')
        )
      )
    )
  );

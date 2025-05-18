/*
  # Initial Schema Setup for Coach Inspection App

  1. Tables
    - profiles: User profiles with role information
    - coaches: Coach information
    - schedules: Inspection schedules
    - notifications: System notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('inspector', 'supervisor');
CREATE TYPE inspection_status AS ENUM ('pending', 'in-progress', 'completed', 'canceled');
CREATE TYPE inspection_type AS ENUM ('gear', 'interior', 'exterior', 'comprehensive');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'inspector',
  department text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  number text UNIQUE NOT NULL,
  type text NOT NULL,
  division text NOT NULL,
  last_inspection timestamptz,
  next_scheduled_inspection timestamptz,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id uuid REFERENCES coaches(id) NOT NULL,
  assigned_to_id uuid REFERENCES profiles(id) NOT NULL,
  supervised_by_id uuid REFERENCES profiles(id),
  status inspection_status NOT NULL DEFAULT 'pending',
  scheduled_date timestamptz NOT NULL,
  completed_date timestamptz,
  notes text,
  location text NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  inspection_type inspection_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Coaches policies
CREATE POLICY "Users can read all coaches"
  ON coaches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Supervisors can manage coaches"
  ON coaches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'supervisor'
    )
  );

-- Schedules policies
CREATE POLICY "Users can read assigned schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_id = auth.uid() OR
    supervised_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'supervisor'
    )
  );

CREATE POLICY "Users can update their assigned schedules"
  ON schedules
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to_id = auth.uid() OR
    supervised_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'supervisor'
    )
  );

-- Notifications policies
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_schedule_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.assigned_to_id,
      'New Schedule Assigned',
      format('You have been assigned to inspect coach %s on %s',
        (SELECT number FROM coaches WHERE id = NEW.coach_id),
        to_char(NEW.scheduled_date, 'Month DD, YYYY')
      ),
      'schedule',
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      COALESCE(NEW.supervised_by_id, NEW.assigned_to_id),
      'Schedule Status Updated',
      format('Schedule for coach %s has been updated to %s',
        (SELECT number FROM coaches WHERE id = NEW.coach_id),
        NEW.status
      ),
      'schedule',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add notification trigger
CREATE TRIGGER schedule_notification_trigger
  AFTER INSERT OR UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION create_schedule_notification();
-- This migration adds manager role support to existing policies
-- We'll add safety checks to make sure tables and policies exist before modifying them

-- First, check if tables exist before attempting modifications
DO $$ 
BEGIN
  -- Check if coaches table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coaches') THEN
    -- Check if the policy exists before altering it
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Supervisors can manage coaches') THEN
      ALTER POLICY "Supervisors can manage coaches" 
        ON coaches
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND (role = 'supervisor' OR role = 'manager')
          )
        );
    END IF;
  END IF;

  -- Check if schedules table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'schedules') THEN
    -- Check if policies exist before altering them
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read assigned schedules') THEN
      ALTER POLICY "Users can read assigned schedules"
        ON schedules
        USING (
          assigned_to_id = auth.uid() OR
          supervised_by_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND (role = 'supervisor' OR role = 'manager')
          )
        );
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their assigned schedules') THEN
      ALTER POLICY "Users can update their assigned schedules"
        ON schedules
        USING (
          assigned_to_id = auth.uid() OR
          supervised_by_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND (role = 'supervisor' OR role = 'manager')
          )
        );
    END IF;
  END IF;

  -- Check if notifications table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications') THEN
    -- Check if the policy exists before altering it
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read their own notifications') THEN
      ALTER POLICY "Users can read their own notifications"
        ON notifications
        USING (
          user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'
          )
        );
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications') THEN
      ALTER POLICY "Users can update their own notifications"
        ON notifications
        USING (
          user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'
          )
        );
    END IF;
  END IF;
END $$;

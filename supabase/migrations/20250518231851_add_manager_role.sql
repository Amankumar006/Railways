-- Add manager role to user_role enum
DO $$ 
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- The transaction after adding the enum value needs to be committed
COMMIT;

-- Now create the policies in a new transaction
-- Create manager-specific policies
CREATE POLICY "Managers can manage all data"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Add manager access to all tables
CREATE POLICY "Managers can manage all coaches"
  ON coaches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

CREATE POLICY "Managers can manage all schedules"
  ON schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

CREATE POLICY "Managers can manage all notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

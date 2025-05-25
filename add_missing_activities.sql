-- SQL script to add missing activities for Section 2 categories

BEGIN;

-- Add activities for category 2.1 (Air Brakes)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '2.1';
  
  IF category_id_val IS NOT NULL THEN
    -- Add activities if they don't exist
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual check for loose/damage/missing parts or abnormal sound', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check Main air Compressor running on TCMS', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check the vacuum indicator inspection and functionality of indicator plunger', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Check the functioning of compressor for loading/unloading', true, 4, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 2.2 (MR & BP pressurized system)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '2.2';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition & sound of leakage', true, 1, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 2.3 (Auxiliary Compressor)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '2.3';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual check for loose/damage/missing parts or abnormal sound', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check the oil level', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check for any damage', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Clean air inlet filter and electric motor', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Check oil inlet filter for any damage', true, 5, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '6') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '6', 'Check for any abnormal sound', true, 6, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '7') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '7', 'Check earthing cable tightness', true, 7, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 2.4 (Brake System)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '2.4';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Inspect MR Pressure (8 to 10 bar), BP pressure (5 bar) and BC/AR pressure (8 to 10 bar) from dual pressure gauges in the Cab', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check the Brake page on TCMS monitor by visual for Brake cylinder pressure on applying and releasing brake', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Parking brake to be tested by pressing apply and release command from CRW panel', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Brake pipe continuity test applying brake through DBV for BP drop in last coach', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Self-test of BECU from TCMS (brake + WSP)', true, 5, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '6') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '6', 'Emergency brake by Assistant. Emergency brake handle', true, 6, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 2.5 (Brake Control System)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '2.5';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition, any sound of leakage', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Parking brake application or suitable protection against rolling down to be ensured before any testing. Status update of isolating cocks and wire connectors may be checked in case of no status update', true, 2, true);
    END IF;
  END IF;
END $$;

COMMIT; 
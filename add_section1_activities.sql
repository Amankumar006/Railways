-- SQL script to add missing activities for Section 1 categories

BEGIN;

-- Add activities for category 1.1 (Bogie Frame)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.1';
    
  IF category_id_val IS NOT NULL THEN
    -- Add activities if they don't exist
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visually inspect the bogie frame and their components for crack, loose, missing and leakage etc. and check whether all equipment is secure.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Perform visual check on longitudinal beams, cross beams for cracks, damages and corrosion.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Perform visual check on brake supports, damper supports, traction center supports and stabilizer assembly supports for cracks, damages and corrosion', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Check bogie brackets visually for cracks, damages and corrosion.', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Check safety cables visually for damages, cracks and corrosion.', true, 5, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.2 (Axle Box CTRB)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.2';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check the bearing for any sign of overheating or detection of hot bearing.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check bearings for grease leakage or any abnormal sound', true, 3, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.3 (Primary Suspension)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.3';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Visually check springs for cracks, damages, corrosion or foreign objects presence.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'The split pin installed in primary suspension may be checked for any visible damage and may be replaced if required.', true, 3, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.4 (Air Spring Systems)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.4';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Visually check the air spring rubber bellow in inflated condition for any external damage, cracks, air leakage, bulging and infringement of any fittings', true, 2, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.5 (Wheels and Axles)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.5';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Perform a visual check on wheels for cracks, damages and defects.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check by wheel profile gauge, the wheel flange thickness and profile.', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Visually inspect the axle for cracks and signs of corrosion, if any.', true, 4, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.6 (Primary/Secondary vertical and Lateral/Yaw dampers)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.6';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Perform a visual check on dampers for damage, cracks and oil leakage.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Perform a visual check on all fixings for loosening and/or missing components', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Perform a visual check on rubber elements for cracks and ageing.', true, 4, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.7 (Stabilizer assembly)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.7';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Perform a visual check on torsion bar, stabilizer links and brackets for cracks, damages and corrosion', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Perform a visual check on rubber joints for cracks, damage and ageing', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Visually inspect for grease oozing out of stabilizer assembly bearings, which may result in bearing failure.', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Perform visual check on all fixings for loose/missing fittings', true, 5, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.8 (Traction rod and traction Centre)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.8';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Perform a visual check on the traction center housing and bars for cracks, damages and corrosion.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'The assembly should be free to move, and not blocked by any foreign objects', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Perform a visual check on all fixings for loosening and the ball joints.', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Perform a visual check on rubber joints for cracks/damages.', true, 5, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '6') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '6', 'Visually inspect the lateral damper as per specification', true, 6, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '7') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '7', 'Visually inspect the lateral bump stop for loosening, missing and damages etc.', true, 7, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.9 (Control Arm and other components on primary suspension)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.9';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Visually check control arm parts for damages, cracks or corrosion marks.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Perform a visual check on all fixings for loosening and / or missing components', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Inspect the rubber joint for cracks, damages and ageing', true, 4, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 1.10 (All Rubber metal bonded parts on bogie)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1.10';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Perform a visual check for cracks, damages, peeling, bulging, looseness etc.', true, 2, true);
    END IF;
  END IF;
END $$;

-- Fix category 1.10 issue (it might be stored as '1.10' or '1,10')
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  -- Try to find the category with comma notation
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '1,10';
  
  IF category_id_val IS NOT NULL THEN
    -- If found with comma, add activities to it
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Perform a visual check for cracks, damages, peeling, bulging, looseness etc.', true, 2, true);
    END IF;
  END IF;
END $$;

COMMIT; 
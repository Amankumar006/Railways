-- SQL script to add missing activities for Sections 5, 6, and 7 categories

BEGIN;

-- Add activities for category 5.1 (Semi-Permanent Coupler - DELLNER)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '5.1';
  
  IF category_id_val IS NOT NULL THEN
    -- Add activities if they don't exist
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for general condition', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check visually for any missing/loose parts.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check visually for any damage/ crack/ wear etc.', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Visual check of torque marks on sleeve and wedges bolts. Torqueing to be done if necessary', true, 4, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 6.1A (Internal Sliding Door - PRAG)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '6.1A';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Check the log sheet and attend the defect recorded by the escorting staff.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Clean the dust by compressed air of I/C—door and tighten the cable terminals, if found loose.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Checking the fluent opening & Closing of the door, noise, jerking motion and knocking & rectify the observed defect.', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Check the mechanical movement of door after pressing emergency pushbutton switch, i.e Manual operation and rectify the issue if noticed any.', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Check the function of Radar for proper working and replace if defective.', true, 5, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '6') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '6', 'Check the door leaf and Glass for any damage or crack and replace the glass if crack or broken.', true, 6, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '7') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '7', 'Checking completeness of the mechanism, screwing up, binding cables, loose connections etc. Visually, Adjust the mechanism for smooth operation', true, 7, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '8') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '8', 'Check the Cable Drag Chain for any damage, Replaced if required.', true, 8, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '9') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '9', 'Check the function of Relay, Replaced if required', true, 9, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 6.1B (Internal Sliding Door - NORGREN)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '6.1B';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Check the log sheet maintained in driver cabin and attend the defect recorded by the escorting staff', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Checking the fluent opening & Closing of the door, noise, jerking motion and knocking & rectify the observed defect.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check the mechanical movement of door after pressing emergency pushbutton switch, i.e Manual operation and rectify the issue if noticed any.', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Check the function of Radar for proper working and replace if defective.', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Check the door leaf and Glass for any damage or crack and replace the glass if crack or broken.', true, 5, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '6') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '6', 'Checking completeness of the mechanism, screwing up, binding cables, loose connections etc. Visually, Adjust the mechanism for smooth operation.', true, 6, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 6.2 (Plug Doors - iFE)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '6.2';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Check the Entrance door glass for cracked, fixing with frame', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check door leaf for any damage, crack.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check step for any damage crack.', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Check the functioning of indication lamps.', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Check the functioning of emergency button', true, 5, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 7.1 (Vacuum Bio-Toilet - EVAC GmbH)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '7.1';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Check the Operation of flush push button.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check for foul smell and clogging of toilet.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check the LCD screen for any fault code.', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Perform a visual check on WC seat and cover, toilet Bowl for damages and corrosion', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Check the bolts of fixation, toilet seat hinge for their looseness and condition.', true, 5, true);
    END IF;
  END IF;
END $$;

COMMIT; 
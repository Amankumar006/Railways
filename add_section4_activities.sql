-- SQL script to add missing activities for Section 4 categories

BEGIN;

-- Add activities for category 4.1A (Gangway – Hubner)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.1A';
  
  IF category_id_val IS NOT NULL THEN
    -- Add activities if they don't exist
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual inspection for Tears or Holes in bellows fabric. Loosening of connection between Bellows and folding Wall.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Intactness of all inter- coach gangways to be ensured', true, 2, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.1B (Gangway – Lince)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.1B';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for any loose, missing parts or abnormalities', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Intactness of all inter- coach gangways to be ensured', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check the integrity of the bellow fabric & clean', true, 3, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.1C (Gangway – Ultimate)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.1C';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual Inspection for any loose, missing parts or abnormalities', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Intactness of all inter- coach gangways to be ensured', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Inspection of bellow completeness
Inspection of top protection panels
Inspection of side cladding panel assy.
Inspection of bridge plate
Inspection of step plate assy.
Cleaning', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Inspection of flexibility of bridge plate hinge', true, 4, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.2 (Passenger Seat – STER)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.2';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual inspection for Tears/Holes in Upholstery & Foam sets.
For upholstered area, operator identifies unacceptable visible degradation of the fabric such as:
Fabric wear is not acceptable on a visual point of view
Act of vandalism cut through the fabric
Foam is visible under the fabric', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Cleaning of Seats, Grab Rail & Armrest.
Note:
For cleaning details refer to Chapter -2 of Volume 2
Intensive cleaning to be done on monthly basis.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Inspect Seats and check for completeness.
For painted area, identify structural damages or deep scratches that:
Scratches is not acceptable on a visual point of view
Metal structure damaged', true, 3, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.3 (Table (Executive Class))
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.3';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Cleaning of Tables.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Checking for loosened hinges and tightening (if any).', true, 2, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.4 (Floor Mat/ Cover)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.4';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Cleaning of Floor Mat.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Checking for peel off and repair, if any (using suitable adhesives/fasteners).', true, 2, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.5 (Window)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.5';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Cleaning to be done.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Intactness of windows to be ensured.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Checking for cracks and breakage (replace immediately, if any found).', true, 3, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.6 (Roller Blind)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.6';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Cleaning of Roller Blind', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Checking for any tear of Blind Roll and Pull String. Repairing or replacing the same.', true, 2, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.7 (Luggage Rack)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.7';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Cleaning of Luggage Rack.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Checking of Fasteners for looseness and tightening (if any looseness found)', true, 2, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.8 (Side & Roof Panels)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.8';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual inspection for general condition', true, 1, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 4.9 (Fire Extinguisher)
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '4.9';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Confirm Fire Extinguisher is visible, unobstructed and available at designated location.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Verify Safety Pin is intact and pressure gauge indicator is within green range.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Check for expiry date in label (Should not be overdue)', true, 3, true);
    END IF;
  END IF;
END $$;

COMMIT; 
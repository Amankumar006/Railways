-- SQL script to add missing activities for Section 3 categories

BEGIN;

-- Add activities for category 3.1 (Underframe/Car-body(DTC,NDTC,MC,TC))
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '3.1';
  
  IF category_id_val IS NOT NULL THEN
    -- Add activities if they don't exist
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Visual inspection of coach underframe and its components.', true, 1, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '2') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '2', 'Check visually the following for any damages/defects/deficiencies: Condition of head stock, sole bar and other under frame members.', true, 2, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '3') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '3', 'Interior cleaning of lavatories, cleaning of coach floor, cleaning of passenger amenities, windows etc.', true, 3, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '4') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '4', 'Exterior coach cleaning with recommended cleaning solution as per latest RDSO specification no. M&C/PCN/101/2007 for Liquid Cleaning Composition for Exterior of Railway Coaches.', true, 4, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '5') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '5', 'Checking of hand rails, sliding doors, body side, lavatories and vestibule doors for proper functioning.', true, 5, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '6') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '6', 'Amenities fittings should be checked for proper functioning.', true, 6, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '7') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '7', 'All missing passenger amenity fittings must be replaced and the rake must be turned out as ''Zero-Missing-Fitting'' rake. Check visually the following for any damages/defects/deficiencies:
1. Destination board and brackets.
2. Body side walls
3. End walls
4. Windows, Body side doors, Lavatory doors, inter communication doors (vestibule doors) etc. for their functioning.
5. Fire Extinguishers.', true, 7, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '8') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '8', 'Exterior panels & End panels" should be replaced with Exterior Body side walls and End walls.', true, 8, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '9') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '9', 'External Cleaning
Exterior coach cleaning with recommended cleaning solution as per latest RDSO specification no. M&C/PCN/101/2007 For the coaches with vinyl wrap instructions of ICF/ RDSO should be follow. Coach cleaning/washing should be done by Automatic Coach Washing Plant (ACWP).', true, 9, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '10') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '10', 'However, where these plants are not available, external cleaning/washing of
coaches can be done in following manner:
1. Place the rake/coaches on the washing pit provided with equipment required for washing and cleaning. It should be ensured that the rake/coach is protected with proper board/signal for safety of the staff working on
washing/ cleaning job to prevent movement/ disturbance in the activity.
Scotch blocks with locking arrangement should protect lines and keys should be kept with Engineer(C&W) till the time rake is under maintenance. In electrified section, C&W supervisor shall in addition, obtain
power block from OHE before commencing work.
2.All VCBs may be grounded before commencing washing and isolation keys may be kept securely.
3. The cleaning solution should be spread/ rubbed with nylon brush or sponge brushes and then rubbed thoroughly to clean the panels. Extra attention should be given to oily and badly stained surfaces.
4. Clean the external surface by high pressure jet where facilities are available', true, 10, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '11') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '11', 'All exterior panels including end panels should be hosed with water and brushed with diluted soft soap (detergent solution) the strength of the solution may be increased or decreased according to RDSO specification.', true, 11, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '12') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '12', 'Internal Cleaning
1. Collect the newspaper from magazine bag and waste from dust bin.Sweep the whole coach with broom in sleeper coaches. Clean the floor of AC coaches with vacuum cleaner.
2. Remove dust from floor, berths/seat, magazine nylon wire mesh bag fitted on panels and fan guards with duster. Use of vacuum cleaner is excellent in such areas.
3. Also remove dust/dirt from under the berths, window sill, sliding door, railing corner and all corner & crevices of coach interior with vacuum cleaner if provided.
4. Aluminum frames, strips, and other metal fittings, etc. should be cleaned with recommended cleaning agent.
5. The coach flooring should be rubbed with hard coir brush and PVC flooring should be rubbed with nylon bristles/sponge brush and cleaned withrecommended cleaning agent', true, 12, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '13') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '13', '6. The amenity fittings and toilet fittings such as coat hanger, stools, arm rest, foot rest, towel hanger, etc. should be cleaned with duster. Stains on these items should be removed with recommended detergent solution.
7. Spray recommended air freshener in the coach. No employee should be allowed to enter the coach for any purpose/work after complete cleaning.
8. Precaution should be taken to prevent nuisance of cockroaches and rodents in AC coaches and pantry car.
9. No repair works should generally be left to be carried out after washing and cleaning of the coach.', true, 13, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '14') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '14', 'Pest and rodent control should be done as per extant instructions issued by the Railway Board from time to time.', true, 14, true);
    END IF;
  END IF;
END $$;

-- Add activities for category 3.2 (Roof(DTC,NDTC,MC,TC))
DO $$
DECLARE
  category_id_val uuid;
BEGIN
  SELECT id INTO category_id_val 
  FROM inspection_categories 
  WHERE category_number = '3.2';
  
  IF category_id_val IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM inspection_activities WHERE category_id = category_id_val AND activity_number = '1') THEN
      INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
      (uuid_generate_v4(), category_id_val, '1', 'Warning : Necessary precaution to be taken for OHE lines while working on roof', true, 1, true);
    END IF;
  END IF;
END $$;

COMMIT; 
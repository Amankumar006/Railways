/*
  # Populate Trip Inspection Data
  
  This migration populates the inspection structure with data from the provided checklist.
  The data follows the hierarchical structure:
  - Sections: Major groupings (Cleaning, Interior, etc.)
  - Categories: Specific components within sections
  - Activities: Individual inspection items
*/

-- Populate sections
INSERT INTO inspection_sections (section_number, name, description, display_order)
VALUES 
  ('3', 'Cleaning', 'Cleaning activities for railway coaches', 1),
  ('4', 'Interior and Furnishing', 'Interior components inspection and maintenance', 2),
  ('5', 'Couplers', 'Inspection of coupling mechanisms', 3),
  ('6', 'Doors', 'Door system inspection and maintenance', 4),
  ('7', 'Vacuum Bio-Toilet', 'Toilet system inspection and maintenance', 5)
ON CONFLICT (section_number) DO NOTHING;

-- Populate categories and activities
DO $$
DECLARE
  cleaning_id uuid;
  interior_id uuid;
  couplers_id uuid;
  doors_id uuid;
  toilet_id uuid;
  
  -- Category IDs
  roof_id uuid;
  gangway_hubner_id uuid;
  gangway_lince_id uuid;
  gangway_ultimate_id uuid;
  passenger_seat_id uuid;
  table_id uuid;
  floor_mat_id uuid;
  window_id uuid;
  roller_blind_id uuid;
  luggage_rack_id uuid;
  side_roof_panels_id uuid;
  fire_extinguisher_id uuid;
  coupler_dellner_id uuid;
  door_prag_id uuid;
  door_norgren_id uuid;
  door_ife_id uuid;
  vacuum_toilet_id uuid;
BEGIN
  -- Get section IDs
  SELECT id INTO cleaning_id FROM inspection_sections WHERE section_number = '3';
  SELECT id INTO interior_id FROM inspection_sections WHERE section_number = '4';
  SELECT id INTO couplers_id FROM inspection_sections WHERE section_number = '5';
  SELECT id INTO doors_id FROM inspection_sections WHERE section_number = '6';
  SELECT id INTO toilet_id FROM inspection_sections WHERE section_number = '7';
  
  -- Create categories for Cleaning section
  INSERT INTO inspection_categories (section_id, category_number, name, applicable_coaches, display_order)
  VALUES
    (cleaning_id, '3.2', 'Roof', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1)
  ON CONFLICT (section_id, category_number) DO NOTHING;
  
  -- Create categories for Interior section
  INSERT INTO inspection_categories (section_id, category_number, name, applicable_coaches, display_order)
  VALUES
    (interior_id, '4.1A', 'Gangway – Hubner', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1),
    (interior_id, '4.1B', 'Gangway – Lince', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 2),
    (interior_id, '4.1C', 'Gangway – Ultimate', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 3),
    (interior_id, '4.2', 'Passenger Seat – STER', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 4),
    (interior_id, '4.3', 'Table (Executive Class)', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 5),
    (interior_id, '4.4', 'Floor Mat/Cover', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 6),
    (interior_id, '4.5', 'Window', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 7),
    (interior_id, '4.6', 'Roller Blind', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 8),
    (interior_id, '4.7', 'Luggage Rack', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 9),
    (interior_id, '4.8', 'Side & Roof Panels', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 10),
    (interior_id, '4.9', 'Fire Extinguisher', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 11)
  ON CONFLICT (section_id, category_number) DO NOTHING;
  
  -- Create categories for Couplers section
  INSERT INTO inspection_categories (section_id, category_number, name, applicable_coaches, display_order)
  VALUES
    (couplers_id, '5.1', 'Semi-Permanent Coupler - DELLNER', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1)
  ON CONFLICT (section_id, category_number) DO NOTHING;
  
  -- Create categories for Doors section
  INSERT INTO inspection_categories (section_id, category_number, name, applicable_coaches, display_order)
  VALUES
    (doors_id, '6.1A', 'Internal Sliding Door - PRAG', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1),
    (doors_id, '6.1B', 'Internal Sliding Door - NORGREN', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 2),
    (doors_id, '6.2', 'Plug Doors - iFE', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 3)
  ON CONFLICT (section_id, category_number) DO NOTHING;
  
  -- Create categories for Vacuum Bio-Toilet section  
  INSERT INTO inspection_categories (section_id, category_number, name, applicable_coaches, display_order)
  VALUES
    (toilet_id, '7', 'Vacuum Bio-Toilet - EVAC GmbH', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1)
  ON CONFLICT (section_id, category_number) DO NOTHING;
  
  -- Get category IDs
  SELECT id INTO roof_id FROM inspection_categories WHERE category_number = '3.2';
  SELECT id INTO gangway_hubner_id FROM inspection_categories WHERE category_number = '4.1A';
  SELECT id INTO gangway_lince_id FROM inspection_categories WHERE category_number = '4.1B';
  SELECT id INTO gangway_ultimate_id FROM inspection_categories WHERE category_number = '4.1C';
  SELECT id INTO passenger_seat_id FROM inspection_categories WHERE category_number = '4.2';
  SELECT id INTO table_id FROM inspection_categories WHERE category_number = '4.3';
  SELECT id INTO floor_mat_id FROM inspection_categories WHERE category_number = '4.4';
  SELECT id INTO window_id FROM inspection_categories WHERE category_number = '4.5';
  SELECT id INTO roller_blind_id FROM inspection_categories WHERE category_number = '4.6';
  SELECT id INTO luggage_rack_id FROM inspection_categories WHERE category_number = '4.7';
  SELECT id INTO side_roof_panels_id FROM inspection_categories WHERE category_number = '4.8';
  SELECT id INTO fire_extinguisher_id FROM inspection_categories WHERE category_number = '4.9';
  SELECT id INTO coupler_dellner_id FROM inspection_categories WHERE category_number = '5.1';
  SELECT id INTO door_prag_id FROM inspection_categories WHERE category_number = '6.1A';
  SELECT id INTO door_norgren_id FROM inspection_categories WHERE category_number = '6.1B';
  SELECT id INTO door_ife_id FROM inspection_categories WHERE category_number = '6.2';
  SELECT id INTO vacuum_toilet_id FROM inspection_categories WHERE category_number = '7';
  
  -- Populate activities for roof
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES 
    (roof_id, '1', 'Warning: Necessary precaution to be taken for OHE lines while working on roof', true, 1)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Gangway - Hubner
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (gangway_hubner_id, '1', 'Visual inspection for Tears or Holes in bellows fabric.', true, 1),
    (gangway_hubner_id, '2', 'Loosening of connection between Bellows and folding Wall.', false, 2),
    (gangway_hubner_id, '3', 'Intactness of all inter-coach gangways to be ensured', true, 3)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Gangway - Lince
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (gangway_lince_id, '1', 'Visual Inspection for any loose, missing parts or abnormalities', true, 1),
    (gangway_lince_id, '2', 'Intactness of all inter-coach gangways to be ensured', true, 2),
    (gangway_lince_id, '3', 'Check the integrity of the bellow fabric & clean', false, 3)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Gangway - Ultimate
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (gangway_ultimate_id, '1', 'Visual Inspection for any loose, missing parts or abnormalities', true, 1),
    (gangway_ultimate_id, '2', 'Intactness of all inter-coach gangways to be ensured', true, 2),
    (gangway_ultimate_id, '3', 'Inspection of bellow completeness, top protection panels, side cladding panel, bridge plate, step plate assembly', true, 3),
    (gangway_ultimate_id, '4', 'Cleaning', false, 4),
    (gangway_ultimate_id, '5', 'Inspection of flexibility of bridge plate hinge', false, 5)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Passenger Seat
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (passenger_seat_id, '1', 'Visual inspection for Tears/Holes in Upholstery & Foam sets. Check for fabric wear, vandalism, or exposed foam.', true, 1),
    (passenger_seat_id, '2', 'Cleaning of Seats, Grab Rail & Armrest. Intensive cleaning to be done on monthly basis.', true, 2),
    (passenger_seat_id, '3', 'Inspect Seats and check for completeness. Check for structural damages or deep scratches.', true, 3)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Table
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (table_id, '1', 'Cleaning of Tables.', true, 1),
    (table_id, '2', 'Checking for loosened hinges and tightening (if any).', true, 2)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Floor Mat
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (floor_mat_id, '1', 'Cleaning of Floor Mat.', true, 1),
    (floor_mat_id, '2', 'Checking for peel off and repair, if any (using suitable adhesives/fasteners).', false, 2)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Window
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (window_id, '1', 'Cleaning to be done.', true, 1),
    (window_id, '2', 'Intactness of windows to be ensured.', true, 2),
    (window_id, '3', 'Checking for cracks and breakage (replace immediately, if any found).', true, 3)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Roller Blind
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (roller_blind_id, '1', 'Cleaning of Roller Blind', false, 1),
    (roller_blind_id, '2', 'Checking for any tear of Blind Roll and Pull String. Repairing or replacing the same.', true, 2)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Luggage Rack
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (luggage_rack_id, '1', 'Cleaning of Luggage Rack.', true, 1),
    (luggage_rack_id, '2', 'Checking of Fasteners for looseness and tightening (if any looseness found)', true, 2)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Side & Roof Panels
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (side_roof_panels_id, '1', 'Visual inspection for general condition', true, 1)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Fire Extinguisher
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (fire_extinguisher_id, '1', 'Confirm Fire Extinguisher is visible, unobstructed and available at designated location.', true, 1),
    (fire_extinguisher_id, '2', 'Verify Safety Pin is intact and pressure gauge indicator is within green range.', true, 2),
    (fire_extinguisher_id, '3', 'Check for expiry date in label (Should not be overdue)', true, 3)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Semi-Permanent Coupler
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (coupler_dellner_id, '1', 'Visual Inspection for general condition', true, 1),
    (coupler_dellner_id, '2', 'Check visually for any missing/loose parts.', true, 2),
    (coupler_dellner_id, '3', 'Check visually for any damage/ crack/ wear etc.', true, 3),
    (coupler_dellner_id, '4', 'Visual check of torque marks on sleeve and wedges bolts. Torqueing to be done if necessary', false, 4)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Internal Sliding Door - PRAG
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (door_prag_id, '1', 'Check the log sheet and attend the defect recorded by the escorting staff.', true, 1),
    (door_prag_id, '2', 'Clean the dust by compressed air of I/C—door and tighten the cable terminals, if found loose.', false, 2),
    (door_prag_id, '3', 'Checking the fluent opening & Closing of the door, noise, jerking motion and knocking & rectify the observed defect.', true, 3),
    (door_prag_id, '4', 'Check the mechanical movement of door after pressing emergency pushbutton switch, i.e Manual operation and rectify the issue if noticed any.', true, 4),
    (door_prag_id, '5', 'Check the function of Radar for proper working and replace if defective.', false, 5),
    (door_prag_id, '6', 'Check the door leaf and Glass for any damage or crack and replace the glass if crack or broken.', true, 6),
    (door_prag_id, '7', 'Checking completeness of the mechanism, screwing up, binding cables, loose connections etc. Visually, Adjust the mechanism for smooth operation', false, 7),
    (door_prag_id, '8', 'Check the Cable Drag Chain for any damage, Replaced if required.', false, 8),
    (door_prag_id, '9', 'Check the function of Relay, Replaced if required', false, 9)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Internal Sliding Door - NORGREN
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (door_norgren_id, '1', 'Check the log sheet maintained in driver cabin and attend the defect recorded by the escorting staff', true, 1),
    (door_norgren_id, '2', 'Checking the fluent opening & Closing of the door, noise, jerking motion and knocking & rectify the observed defect.', true, 2),
    (door_norgren_id, '3', 'Check the mechanical movement of door after pressing emergency pushbutton switch, i.e Manual operation and rectify the issue if noticed any.', true, 3),
    (door_norgren_id, '4', 'Check the function of Radar for proper working and replace if defective.', false, 4),
    (door_norgren_id, '5', 'Check the door leaf and Glass for any damage or crack and replace the glass if crack or broken.', true, 5),
    (door_norgren_id, '6', 'Checking completeness of the mechanism, screwing up, binding cables, loose connections etc. Visually, Adjust the mechanism for smooth operation.', false, 6)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Plug Doors - iFE
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (door_ife_id, '1', 'Check the Entrance door glass for cracked, fixing with frame', true, 1),
    (door_ife_id, '2', 'Check door leaf for any damage, crack.', true, 2),
    (door_ife_id, '3', 'Check step for any damage crack.', true, 3),
    (door_ife_id, '4', 'Check the functioning of indication lamps.', false, 4),
    (door_ife_id, '5', 'Check the functioning of emergency button', true, 5)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
  
  -- Populate activities for Vacuum Bio-Toilet
  INSERT INTO inspection_activities (category_id, activity_number, activity_text, is_compulsory, display_order)
  VALUES
    (vacuum_toilet_id, '1', 'Check the Operation of flush push button.', true, 1),
    (vacuum_toilet_id, '2', 'Check for foul smell and clogging of toilet.', true, 2),
    (vacuum_toilet_id, '3', 'Check the LCD screen for any fault code.', false, 3),
    (vacuum_toilet_id, '4', 'Perform a visual check on WC seat and cover, toilet Bowl for damages and corrosion', true, 4),
    (vacuum_toilet_id, '5', 'Check the bolts of fixation, toilet seat hinge for their looseness and condition.', false, 5)
  ON CONFLICT (category_id, activity_number) DO NOTHING;
END $$;

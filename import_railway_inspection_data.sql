-- SQL script to import railway inspection data
-- Based on RailwaysTrip.xlsx structure

BEGIN;

-- Create temporary tables for mappings
CREATE TEMP TABLE section_mappings (section_number text, section_id uuid);
CREATE TEMP TABLE category_mappings (category_number text, category_id uuid);

-- Insert sections
INSERT INTO inspection_sections (id, section_number, name, description, display_order, active) VALUES
  ('a0da8991-a1e9-4eb3-a213-9e830c59a960', '1', 'Bogie', 'Bogie components inspection', 1, true),
  ('b3e1c47d-6f5e-4db9-9683-aa974d7c1c33', '2', 'Brakes and Air Supply', 'Brake system inspection', 2, true),
  ('c27e63a1-851b-4f46-ae8a-e5905cce9999', '3', 'Shell and Under-Frame', 'Shell components inspection', 3, true),
  ('d44f52b0-7fb0-4c59-b0fc-5c8efc7f1111', '4', 'Interior and Furnishing', 'Interior components inspection', 4, true),
  ('e5de09c6-8741-4d6a-a0fa-1e5befd22222', '5', 'Couplers', 'Coupler inspection', 5, true),
  ('f62f3e99-9ad5-4dfd-b45d-4a6c69c33333', '6', 'Doors', 'Door system inspection', 6, true),
  ('g7b21d0e-a2b0-4e14-9ef1-7c92b5d44444', '7', 'Vacuum Bio-Toilet', 'Toilet system inspection', 7, true);

-- Store section mappings
INSERT INTO section_mappings (section_number, section_id) VALUES
  ('1', 'a0da8991-a1e9-4eb3-a213-9e830c59a960'),
  ('2', 'b3e1c47d-6f5e-4db9-9683-aa974d7c1c33'),
  ('3', 'c27e63a1-851b-4f46-ae8a-e5905cce9999'),
  ('4', 'd44f52b0-7fb0-4c59-b0fc-5c8efc7f1111'),
  ('5', 'e5de09c6-8741-4d6a-a0fa-1e5befd22222'),
  ('6', 'f62f3e99-9ad5-4dfd-b45d-4a6c69c33333'),
  ('7', 'g7b21d0e-a2b0-4e14-9ef1-7c92b5d44444');

-- Insert categories for Section 1: Bogie
INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
  ('21a6ba11-1111-4111-a111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.1', 'Bogie Frame', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1, true),
  ('22b7cb22-2222-4222-a222-222222222222', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.2', 'Axle Box CTRB', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 2, true),
  ('23c8dc33-3333-4333-a333-333333333333', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.3', 'Primary Suspension', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 3, true),
  ('24d9ed44-4444-4444-a444-444444444444', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.4', 'Air Spring Systems', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 4, true),
  ('25e0fe55-5555-4555-a555-555555555555', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.5', 'Wheels and Axles', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 5, true),
  ('26f1gf66-6666-4666-a666-666666666666', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.6', 'Primary vertical /Secondary vertical and Lateral /Yaw dampers', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 6, true),
  ('27g2hg77-7777-4777-a777-777777777777', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.7', 'Stabilizer assembly', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 7, true),
  ('28h3ih88-8888-4888-a888-888888888888', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.8', 'Traction rod and traction Centre', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 8, true),
  ('29i4ji99-9999-4999-a999-999999999999', (SELECT section_id FROM section_mappings WHERE section_number = '1'), '1.9', 'Control Arm and other components on primary suspension', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 9, true);

-- Insert categories for Section 2: Brakes and Air Supply
INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
  ('31a1ba11-1111-5111-b111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '2'), '2.1', 'Air Brakes', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1, true),
  ('32b2cb22-2222-5222-b222-222222222222', (SELECT section_id FROM section_mappings WHERE section_number = '2'), '2.2', 'MR & BP pressurized system', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 2, true),
  ('33c3dc33-3333-5333-b333-333333333333', (SELECT section_id FROM section_mappings WHERE section_number = '2'), '2.3', 'Auxiliary Compressor', ARRAY['TC'], 3, true),
  ('34d4ed44-4444-5444-b444-444444444444', (SELECT section_id FROM section_mappings WHERE section_number = '2'), '2.4', 'Brake System', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 4, true),
  ('35e5fe55-5555-5555-b555-555555555555', (SELECT section_id FROM section_mappings WHERE section_number = '2'), '2.5', 'Brake Control System', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 5, true);

-- Insert categories for Section 3: Shell and Under-Frame
INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
  ('41a1ca11-1111-6111-c111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '3'), '3.1', 'Underframe/Car-body', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1, true),
  ('42b2cb22-2222-6222-c222-222222222222', (SELECT section_id FROM section_mappings WHERE section_number = '3'), '3.2', 'Roof', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 2, true);

-- Insert categories for Section 4: Interior and Furnishing
INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
  ('51a1da11-1111-7111-d111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.1A', 'Gangway – Hubner', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1, true),
  ('52a2da22-2222-7222-d222-222222222222', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.1B', 'Gangway – Lince', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 2, true),
  ('53a3da33-3333-7333-d333-333333333333', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.1C', 'Gangway – Ultimate', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 3, true),
  ('54b4db44-4444-7444-d444-444444444444', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.2', 'Passenger Seat – STER', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 4, true),
  ('55c5dc55-5555-7555-d555-555555555555', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.3', 'Table (Executive Class)', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 5, true),
  ('56d6dd66-6666-7666-d666-666666666666', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.4', 'Floor Mat/ Cover', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 6, true),
  ('57e7de77-7777-7777-d777-777777777777', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.5', 'Window', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 7, true),
  ('58f8df88-8888-7888-d888-888888888888', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.6', 'Roller Blind', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 8, true),
  ('59g9dg99-9999-7999-d999-999999999999', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.7', 'Luggage Rack', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 9, true),
  ('510h10dh10-10101-71010-d101-101010101010', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.8', 'Side & Roof Panels', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 10, true),
  ('511i11di11-11111-71111-d111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '4'), '4.9', 'Fire Extinguisher', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 11, true);

-- Insert categories for Section 5: Couplers
INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
  ('61a1ea11-1111-8111-e111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '5'), '5.1', 'Semi-Permanent Coupler - DELLNER', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1, true);

-- Insert categories for Section 6: Doors
INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
  ('71a1fa11-1111-9111-f111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '6'), '6.1A', 'Internal Sliding Door - PRAG', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1, true),
  ('72b2fb22-2222-9222-f222-222222222222', (SELECT section_id FROM section_mappings WHERE section_number = '6'), '6.1B', 'Internal Sliding Door - NORGREN', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 2, true),
  ('73c3fc33-3333-9333-f333-333333333333', (SELECT section_id FROM section_mappings WHERE section_number = '6'), '6.2', 'Plug Doors - iFE', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 3, true);

-- Insert categories for Section 7: Vacuum Bio-Toilet
INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
  ('81a1ga11-1111-0111-g111-111111111111', (SELECT section_id FROM section_mappings WHERE section_number = '7'), '7', 'Vacuum Bio-Toilet - EVAC GmbH', ARRAY['DTC', 'NDTC', 'MC', 'TC'], 1, true);

-- Store category mappings
INSERT INTO category_mappings (category_number, category_id) VALUES
  ('1.1', '21a6ba11-1111-4111-a111-111111111111'),
  ('1.2', '22b7cb22-2222-4222-a222-222222222222'),
  ('1.3', '23c8dc33-3333-4333-a333-333333333333'),
  ('1.4', '24d9ed44-4444-4444-a444-444444444444'),
  ('1.5', '25e0fe55-5555-4555-a555-555555555555'),
  ('1.6', '26f1gf66-6666-4666-a666-666666666666'),
  ('1.7', '27g2hg77-7777-4777-a777-777777777777'),
  ('1.8', '28h3ih88-8888-4888-a888-888888888888'),
  ('1.9', '29i4ji99-9999-4999-a999-999999999999'),
  ('2.1', '31a1ba11-1111-5111-b111-111111111111'),
  ('2.2', '32b2cb22-2222-5222-b222-222222222222'),
  ('2.3', '33c3dc33-3333-5333-b333-333333333333'),
  ('2.4', '34d4ed44-4444-5444-b444-444444444444'),
  ('2.5', '35e5fe55-5555-5555-b555-555555555555'),
  ('3.1', '41a1ca11-1111-6111-c111-111111111111'),
  ('3.2', '42b2cb22-2222-6222-c222-222222222222'),
  ('4.1A', '51a1da11-1111-7111-d111-111111111111'),
  ('4.1B', '52a2da22-2222-7222-d222-222222222222'),
  ('4.1C', '53a3da33-3333-7333-d333-333333333333'),
  ('4.2', '54b4db44-4444-7444-d444-444444444444'),
  ('4.3', '55c5dc55-5555-7555-d555-555555555555'),
  ('4.4', '56d6dd66-6666-7666-d666-666666666666'),
  ('4.5', '57e7de77-7777-7777-d777-777777777777'),
  ('4.6', '58f8df88-8888-7888-d888-888888888888'),
  ('4.7', '59g9dg99-9999-7999-d999-999999999999'),
  ('4.8', '510h10dh10-10101-71010-d101-101010101010'),
  ('4.9', '511i11di11-11111-71111-d111-111111111111'),
  ('5.1', '61a1ea11-1111-8111-e111-111111111111'),
  ('6.1A', '71a1fa11-1111-9111-f111-111111111111'),
  ('6.1B', '72b2fb22-2222-9222-f222-222222222222'),
  ('6.2', '73c3fc33-3333-9333-f333-333333333333'),
  ('7', '81a1ga11-1111-0111-g111-111111111111');

-- Insert sample activities for Bogie Frame (1.1)
INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
  ('a111act1-1111-1111-1111-111111111111', (SELECT category_id FROM category_mappings WHERE category_number = '1.1'), '1', 'Visually inspect the bogie frame and their components for crack, loose, missing and leakage etc. and check whether all equipment is secure.', true, 1, true),
  ('a112act2-2222-2222-2222-222222222222', (SELECT category_id FROM category_mappings WHERE category_number = '1.1'), '2', 'Perform visual check on longitudinal beams, cross beams for cracks, damages and corrosion.', true, 2, true),
  ('a113act3-3333-3333-3333-333333333333', (SELECT category_id FROM category_mappings WHERE category_number = '1.1'), '3', 'Perform visual check on brake supports, damper supports, traction center supports and stabilizer assembly supports for cracks, damages and corrosion', true, 3, true),
  ('a114act4-4444-4444-4444-444444444444', (SELECT category_id FROM category_mappings WHERE category_number = '1.1'), '4', 'Check bogie brackets visually for cracks, damages and corrosion.', true, 4, true),
  ('a115act5-5555-5555-5555-555555555555', (SELECT category_id FROM category_mappings WHERE category_number = '1.1'), '5', 'Check safety cables visually for damages, cracks and corrosion.', true, 5, true);

-- Insert sample activities for Axle Box (1.2)
INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
  ('a121act1-1111-1111-1111-111111111111', (SELECT category_id FROM category_mappings WHERE category_number = '1.2'), '1', 'Visual Inspection', true, 1, true),
  ('a122act2-2222-2222-2222-222222222222', (SELECT category_id FROM category_mappings WHERE category_number = '1.2'), '2', 'Check the bearing for any sign of overheating or detection of hot bearing.', true, 2, true),
  ('a123act3-3333-3333-3333-333333333333', (SELECT category_id FROM category_mappings WHERE category_number = '1.2'), '3', 'Check bearings for grease leakage or any abnormal sound', true, 3, true);

-- Insert sample activities for Gangway – Hubner (4.1A)
INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
  ('a411act1-1111-1111-1111-111111111111', (SELECT category_id FROM category_mappings WHERE category_number = '4.1A'), '1', 'Visual inspection for Tears or Holes in bellows fabric.', true, 1, true),
  ('a412act2-2222-2222-2222-222222222222', (SELECT category_id FROM category_mappings WHERE category_number = '4.1A'), '2', 'Loosening of connection between Bellows and folding Wall.', false, 2, true),
  ('a413act3-3333-3333-3333-333333333333', (SELECT category_id FROM category_mappings WHERE category_number = '4.1A'), '3', 'Intactness of all inter-coach gangways to be ensured', true, 3, true);

-- Insert sample activities for Internal Sliding Door - PRAG (6.1A)
INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
  ('a611act1-1111-1111-1111-111111111111', (SELECT category_id FROM category_mappings WHERE category_number = '6.1A'), '1', 'Check the log sheet and attend the defect recorded by the escorting staff.', true, 1, true),
  ('a612act2-2222-2222-2222-222222222222', (SELECT category_id FROM category_mappings WHERE category_number = '6.1A'), '2', 'Clean the dust by compressed air of I/C—door and tighten the cable terminals, if found loose.', false, 2, true),
  ('a613act3-3333-3333-3333-333333333333', (SELECT category_id FROM category_mappings WHERE category_number = '6.1A'), '3', 'Checking the fluent opening & Closing of the door, noise, jerking motion and knocking & rectify the observed defect.', true, 3, true),
  ('a614act4-4444-4444-4444-444444444444', (SELECT category_id FROM category_mappings WHERE category_number = '6.1A'), '4', 'Check the mechanical movement of door after pressing emergency pushbutton switch, i.e Manual operation and rectify the issue if noticed any.', true, 4, true),
  ('a615act5-5555-5555-5555-555555555555', (SELECT category_id FROM category_mappings WHERE category_number = '6.1A'), '5', 'Check the function of Radar for proper working and replace if defective.', false, 5, true);

-- Insert sample activities for Vacuum Bio-Toilet (7)
INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES
  ('a711act1-1111-1111-1111-111111111111', (SELECT category_id FROM category_mappings WHERE category_number = '7'), '1', 'Check the Operation of flush push button.', true, 1, true),
  ('a712act2-2222-2222-2222-222222222222', (SELECT category_id FROM category_mappings WHERE category_number = '7'), '2', 'Check for foul smell and clogging of toilet.', true, 2, true),
  ('a713act3-3333-3333-3333-333333333333', (SELECT category_id FROM category_mappings WHERE category_number = '7'), '3', 'Check the LCD screen for any fault code.', false, 3, true),
  ('a714act4-4444-4444-4444-444444444444', (SELECT category_id FROM category_mappings WHERE category_number = '7'), '4', 'Perform a visual check on WC seat and cover, toilet Bowl for damages and corrosion', true, 4, true),
  ('a715act5-5555-5555-5555-555555555555', (SELECT category_id FROM category_mappings WHERE category_number = '7'), '5', 'Check the bolts of fixation, toilet seat hinge for their looseness and condition.', false, 5, true);

-- Drop temporary tables
DROP TABLE IF EXISTS section_mappings;
DROP TABLE IF EXISTS category_mappings;

COMMIT;
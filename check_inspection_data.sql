-- SQL script to check current inspection data state

-- Count sections, categories, and activities
SELECT 'Sections' as entity, COUNT(*) as count FROM inspection_sections
UNION ALL
SELECT 'Categories', COUNT(*) FROM inspection_categories
UNION ALL
SELECT 'Activities', COUNT(*) FROM inspection_activities;

-- Check section coverage
SELECT 
  section_number, 
  name, 
  (SELECT COUNT(*) FROM inspection_categories WHERE section_id = inspection_sections.id) as categories_count
FROM 
  inspection_sections
ORDER BY 
  section_number::int;

-- Check category coverage for section 1 (Bogie)
SELECT 
  category_number, 
  name, 
  (SELECT COUNT(*) FROM inspection_activities WHERE category_id = inspection_categories.id) as activities_count
FROM 
  inspection_categories
WHERE 
  section_id = (SELECT id FROM inspection_sections WHERE section_number = '1')
ORDER BY 
  category_number;

-- Check category coverage for section 2 (Brakes)
SELECT 
  category_number, 
  name, 
  (SELECT COUNT(*) FROM inspection_activities WHERE category_id = inspection_categories.id) as activities_count
FROM 
  inspection_categories
WHERE 
  section_id = (SELECT id FROM inspection_sections WHERE section_number = '2')
ORDER BY 
  category_number;

-- Check for categories with inconsistent section mappings
SELECT 
  ic.category_number, 
  ic.name as category_name,
  is1.section_number, 
  is1.name as section_name,
  LEFT(ic.category_number, 1) as expected_section
FROM 
  inspection_categories ic
JOIN 
  inspection_sections is1 ON ic.section_id = is1.id
WHERE 
  LEFT(ic.category_number, 1) != is1.section_number
ORDER BY 
  ic.category_number; 
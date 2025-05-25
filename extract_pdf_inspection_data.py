#!/usr/bin/env python3
import PyPDF2
import re
import json
import os

def extract_inspection_data(pdf_path):
    """Extract hierarchical inspection data from the PDF."""
    print(f"Processing PDF: {pdf_path}")
    
    # Read PDF
    pdf = PyPDF2.PdfReader(pdf_path)
    full_text = ""
    
    # Extract text from all pages
    for page in pdf.pages:
        full_text += page.extract_text() + "\n"
    
    # Define regex patterns for sections, categories and activities
    section_pattern = r"^(\d+)\s+([A-Za-z\s-]+)$"
    category_pattern = r"^(\d+\.\d+[A-Z]?)\s+([A-Za-z\s–-]+?)\s*\(([A-Za-z,\s]+)\)$"
    activity_pattern = r"^(\d+)\s+(.+)$"
    
    # Split text by lines and process
    lines = full_text.split('\n')
    
    # Initialize variables
    structured_data = []
    current_section = None
    current_category = None
    
    # Special handling for the first section which might not match pattern perfectly
    if not re.match(section_pattern, lines[0].strip()) and "Trip / Depot Examination" in lines[0]:
        # Manually add the first section
        current_section = {
            "section_number": "1",
            "name": "Bogie",
            "categories": []
        }
        structured_data.append(current_section)
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
            
        # Check for section header
        section_match = re.match(section_pattern, line)
        if section_match:
            section_num = section_match.group(1)
            section_name = section_match.group(2).strip()
            
            # Check if this is actually a section (simple validation)
            if section_num in ["1", "2", "3", "4", "5", "6", "7"] and len(section_name) > 2:
                current_section = {
                    "section_number": section_num,
                    "name": section_name,
                    "categories": []
                }
                structured_data.append(current_section)
                continue
        
        # Check for category header
        category_match = re.match(r"^(\d+\.\d+[A-Z]?)\s+([A-Za-z\s–-]+?)\s*\(([A-Za-z,\s]+)\)$", line)
        if category_match and current_section:
            category_num = category_match.group(1)
            category_name = category_match.group(2).strip()
            applicable_coaches = [coach.strip() for coach in category_match.group(3).split(',')]
            
            current_category = {
                "category_number": category_num,
                "name": category_name,
                "applicable_coaches": applicable_coaches,
                "activities": []
            }
            current_section["categories"].append(current_category)
            continue
        
        # Check for activity
        activity_match = re.match(activity_pattern, line)
        if activity_match and current_category:
            activity_num = activity_match.group(1)
            activity_text = activity_match.group(2).strip()
            
            # Check if next line is a continuation (doesn't start with a number)
            continuation = ""
            j = i + 1
            while j < len(lines) and not re.match(r"^\d+[\.\s]", lines[j].strip()) and lines[j].strip():
                continuation += " " + lines[j].strip()
                j += 1
            
            activity_text += continuation
            
            current_category["activities"].append({
                "activity_number": activity_num,
                "activity_text": activity_text,
                "is_compulsory": True  # Default
            })
    
    # Fix some common issues
    cleaned_data = []
    for section in structured_data:
        # Skip duplicate/invalid sections
        if section["name"] == "Visual Inspection" or len(section["categories"]) == 0:
            continue
        cleaned_data.append(section)
    
    return cleaned_data

def generate_sql_inserts(data):
    """Generate SQL insert statements from structured data."""
    sql = """-- SQL script to import all inspection data from PDF
-- Generated automatically from PDF content

BEGIN;

-- Create temporary tables for mappings
CREATE TEMP TABLE section_mappings (section_number text, section_id uuid);
CREATE TEMP TABLE category_mappings (category_number text, category_id uuid);

-- Store existing section mappings - get IDs of sections that already exist
INSERT INTO section_mappings (section_number, section_id) 
SELECT section_number, id FROM inspection_sections;

-- Insert sections that don't exist yet
"""
    
    # Insert sections
    for section in data:
        sql += f"""-- Check if section {section['section_number']} exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM inspection_sections WHERE section_number = '{section['section_number']}') THEN
        INSERT INTO inspection_sections (id, section_number, name, description, display_order, active) VALUES
        (uuid_generate_v4(), '{section['section_number']}', '{section['name']}', '{section['name']} inspection', {section['section_number']}, true);
    END IF;
END $$;

"""

    # Refresh mappings
    sql += """
-- Refresh section mappings to include any new sections
TRUNCATE TABLE section_mappings;
INSERT INTO section_mappings (section_number, section_id) 
SELECT section_number, id FROM inspection_sections;

-- Insert categories
"""

    # Insert categories and activities
    for section in data:
        for category in section.get('categories', []):
            # Sanitize applicable_coaches for SQL
            applicable_coaches = [coach for coach in category['applicable_coaches'] if coach]
            applicable_coaches_str = "ARRAY['" + "', '".join(applicable_coaches) + "']"
            
            # Fix display order to be an integer
            try:
                display_order = int(category['category_number'].replace('.', '').replace('A', '1').replace('B', '2').replace('C', '3'))
            except:
                display_order = 100  # Fallback
            
            sql += f"""-- Check if category {category['category_number']} exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM inspection_categories WHERE category_number = '{category['category_number']}') THEN
        INSERT INTO inspection_categories (id, section_id, category_number, name, applicable_coaches, display_order, active) VALUES
        (uuid_generate_v4(), (SELECT section_id FROM section_mappings WHERE section_number = '{section['section_number']}'), 
        '{category['category_number']}', '{category['name']}', {applicable_coaches_str}, 
        {display_order}, true);
    END IF;
END $$;

"""
    
    # Refresh category mappings
    sql += """
-- Store category mappings for newly inserted categories
TRUNCATE TABLE category_mappings;
INSERT INTO category_mappings (category_number, category_id)
SELECT category_number, id FROM inspection_categories;

-- Insert activities
"""

    # Insert activities 
    for section in data:
        for category in section.get('categories', []):
            for idx, activity in enumerate(category.get('activities', []), 1):
                # Escape single quotes in activity text
                activity_text = activity['activity_text'].replace("'", "''")
                
                sql += f"""-- Add activity {activity['activity_number']} for category {category['category_number']}
INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active)
SELECT uuid_generate_v4(), category_id, '{activity['activity_number']}', '{activity_text}', true, {idx}, true
FROM category_mappings 
WHERE category_number = '{category['category_number']}'
AND NOT EXISTS (
    SELECT 1 FROM inspection_activities ia 
    JOIN inspection_categories ic ON ia.category_id = ic.id 
    WHERE ic.category_number = '{category['category_number']}' AND ia.activity_number = '{activity['activity_number']}'
);

"""

    # Drop temp tables and commit
    sql += """
-- Drop temporary tables
DROP TABLE IF EXISTS section_mappings;
DROP TABLE IF EXISTS category_mappings;

COMMIT;
"""
    return sql

if __name__ == "__main__":
    pdf_path = "Untitled spreadsheet - Sheet1.pdf"
    output_sql_path = "complete_inspection_data.sql"
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file {pdf_path} not found!")
        exit(1)
    
    # Extract data from PDF
    structured_data = extract_inspection_data(pdf_path)
    
    # Generate SQL
    sql_inserts = generate_sql_inserts(structured_data)
    
    # Write SQL to file
    with open(output_sql_path, 'w') as f:
        f.write(sql_inserts)
    
    print(f"Extraction complete! SQL file generated: {output_sql_path}")
    print(f"Found {len(structured_data)} sections, {sum(len(s.get('categories', [])) for s in structured_data)} categories")
    
    # Optional: Save structured data as JSON for debugging/reference
    with open("inspection_data.json", 'w') as f:
        json.dump(structured_data, f, indent=2)
    
    print("JSON data also saved for reference in inspection_data.json") 
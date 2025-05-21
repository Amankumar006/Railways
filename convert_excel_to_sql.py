import pandas as pd
import uuid
import os
import re

# Read the Excel file
file_path = "RailwaysTrip.xlsx"
print(f"Reading Excel file: {file_path}")

# Check if file exists
if not os.path.exists(file_path):
    print(f"Error: File {file_path} not found!")
    exit(1)

# Try to read all sheets to understand the structure
try:
    xls = pd.ExcelFile(file_path)
    print(f"Found sheets: {xls.sheet_names}")
    
    # Generate SQL file
    sql_file = "import_inspection_data.sql"
    with open(sql_file, "w") as f:
        f.write("-- SQL script to import inspection data\n")
        f.write("-- Generated from RailwaysTrip.xlsx\n\n")
        
        # Start a transaction
        f.write("BEGIN;\n\n")
        
        # Generate section mappings for later use
        f.write("-- Create temporary section mappings\n")
        f.write("CREATE TEMP TABLE section_mappings (section_number text, section_id uuid);\n\n")
        
        f.write("-- Create temporary category mappings\n")
        f.write("CREATE TEMP TABLE category_mappings (category_number text, category_id uuid);\n\n")
        
        try:
            # Look for a sheet with sections
            sections_data = None
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                if 'section' in sheet_name.lower() or any('section' in str(col).lower() for col in df.columns):
                    sections_data = df
                    print(f"Found sections data in sheet: {sheet_name}")
                    break
            
            # If we found sections data
            if sections_data is not None:
                # Extract column names and map to our schema
                columns = [col.lower() if isinstance(col, str) else str(col).lower() for col in sections_data.columns]
                
                # Map column names to our schema
                sec_num_col = next((i for i, col in enumerate(columns) if 'section' in col and ('number' in col or 'num' in col)), None)
                sec_name_col = next((i for i, col in enumerate(columns) if 'section' in col and 'name' in col), None)
                desc_col = next((i for i, col in enumerate(columns) if 'desc' in col), None)
                order_col = next((i for i, col in enumerate(columns) if 'order' in col or 'seq' in col), None)
                
                # If we don't have section number and name columns, try a more generic approach
                if sec_num_col is None:
                    sec_num_col = next((i for i, col in enumerate(columns) if 'number' in col or 'num' in col), 0)
                if sec_name_col is None:
                    sec_name_col = next((i for i, col in enumerate(columns) if 'name' in col), 1)
                
                # Write sections insertion SQL
                f.write("-- Insert sections\n")
                f.write("INSERT INTO inspection_sections (id, section_number, name, description, display_order, active) VALUES\n")
                
                for i, row in sections_data.iterrows():
                    if i > 0 and pd.isna(row[sec_num_col]):
                        continue  # Skip rows with empty section numbers after the first row
                        
                    section_id = str(uuid.uuid4())
                    section_number = str(row.iloc[sec_num_col]) if sec_num_col is not None else str(i+1)
                    section_name = str(row.iloc[sec_name_col]) if sec_name_col is not None else "Section " + section_number
                    description = str(row.iloc[desc_col]) if desc_col is not None and not pd.isna(row.iloc[desc_col]) else ""
                    display_order = int(row.iloc[order_col]) if order_col is not None and not pd.isna(row.iloc[order_col]) else i+1
                    
                    # Clean up any non-printable characters and escape quotes
                    section_number = section_number.replace("'", "''").strip()
                    section_name = section_name.replace("'", "''").strip()
                    description = description.replace("'", "''").strip()
                    
                    # Convert NaN to empty string
                    if section_number == 'nan': section_number = ""
                    if section_name == 'nan': section_name = ""
                    if description == 'nan': description = ""
                    
                    # Skip rows with empty section numbers
                    if not section_number:
                        continue
                    
                    f.write(f"  ('{section_id}', '{section_number}', '{section_name}', '{description}', {display_order}, true)")
                    
                    # Add comma if not the last row
                    if i < len(sections_data) - 1:
                        f.write(",\n")
                    else:
                        f.write(";\n\n")
                        
                    # Store section mapping
                    f.write(f"INSERT INTO section_mappings (section_number, section_id) VALUES ('{section_number}', '{section_id}');\n")
                
                f.write("\n")
            
            # Look for a sheet with categories
            categories_data = None
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                if 'categor' in sheet_name.lower() or any('categor' in str(col).lower() for col in df.columns):
                    categories_data = df
                    print(f"Found categories data in sheet: {sheet_name}")
                    break
            
            # If we found categories data
            if categories_data is not None:
                # Extract column names and map to our schema
                columns = [col.lower() if isinstance(col, str) else str(col).lower() for col in categories_data.columns]
                
                # Map column names to our schema
                sec_num_col = next((i for i, col in enumerate(columns) if 'section' in col and ('number' in col or 'num' in col)), None)
                cat_num_col = next((i for i, col in enumerate(columns) if 'categor' in col and ('number' in col or 'num' in col)), None)
                cat_name_col = next((i for i, col in enumerate(columns) if 'categor' in col and 'name' in col), None)
                desc_col = next((i for i, col in enumerate(columns) if 'desc' in col), None)
                coaches_col = next((i for i, col in enumerate(columns) if 'coach' in col), None)
                order_col = next((i for i, col in enumerate(columns) if 'order' in col or 'seq' in col), None)
                
                # If we don't have specific columns, try a more generic approach
                if cat_num_col is None:
                    cat_num_col = next((i for i, col in enumerate(columns) if ('number' in col or 'num' in col) and 'section' not in col), 1)
                if cat_name_col is None:
                    cat_name_col = next((i for i, col in enumerate(columns) if 'name' in col and 'section' not in col), 2)
                if sec_num_col is None:
                    sec_num_col = 0  # Assume first column
                
                # Write categories insertion SQL
                f.write("-- Insert categories\n")
                f.write("INSERT INTO inspection_categories (id, section_id, category_number, name, description, applicable_coaches, display_order, active) VALUES\n")
                
                for i, row in categories_data.iterrows():
                    if i > 0 and pd.isna(row[cat_num_col]):
                        continue  # Skip rows with empty category numbers after the first row
                        
                    category_id = str(uuid.uuid4())
                    section_number = str(row.iloc[sec_num_col]) if sec_num_col is not None else ""
                    category_number = str(row.iloc[cat_num_col]) if cat_num_col is not None else str(i+1)
                    category_name = str(row.iloc[cat_name_col]) if cat_name_col is not None else "Category " + category_number
                    description = str(row.iloc[desc_col]) if desc_col is not None and not pd.isna(row.iloc[desc_col]) else ""
                    
                    # Parse coaches - could be comma or space separated
                    if coaches_col is not None and not pd.isna(row.iloc[coaches_col]):
                        coaches_str = str(row.iloc[coaches_col])
                        coaches = [c.strip() for c in re.split(r'[,\s]+', coaches_str) if c.strip()]
                        coaches_array = "ARRAY[" + ", ".join(f"'{c}'" for c in coaches) + "]"
                    else:
                        coaches_array = "ARRAY['DTC', 'NDTC', 'MC', 'TC']"  # Default to all coach types
                    
                    display_order = int(row.iloc[order_col]) if order_col is not None and not pd.isna(row.iloc[order_col]) else i+1
                    
                    # Clean up any non-printable characters and escape quotes
                    section_number = section_number.replace("'", "''").strip()
                    category_number = category_number.replace("'", "''").strip()
                    category_name = category_name.replace("'", "''").strip()
                    description = description.replace("'", "''").strip()
                    
                    # Convert NaN to empty string
                    if section_number == 'nan': section_number = ""
                    if category_number == 'nan': category_number = ""
                    if category_name == 'nan': category_name = ""
                    if description == 'nan': description = ""
                    
                    # Skip rows with empty category numbers
                    if not category_number:
                        continue
                    
                    f.write(f"  ('{category_id}', (SELECT section_id FROM section_mappings WHERE section_number = '{section_number}'), " +
                           f"'{category_number}', '{category_name}', '{description}', {coaches_array}, {display_order}, true)")
                    
                    # Add comma if not the last row
                    if i < len(categories_data) - 1:
                        f.write(",\n")
                    else:
                        f.write(";\n\n")
                    
                    # Store category mapping
                    f.write(f"INSERT INTO category_mappings (category_number, category_id) VALUES ('{category_number}', '{category_id}');\n")
                
                f.write("\n")
            
            # Look for a sheet with activities
            activities_data = None
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                if 'activit' in sheet_name.lower() or any('activit' in str(col).lower() for col in df.columns):
                    activities_data = df
                    print(f"Found activities data in sheet: {sheet_name}")
                    break
            
            # If we found activities data
            if activities_data is not None:
                # Extract column names and map to our schema
                columns = [col.lower() if isinstance(col, str) else str(col).lower() for col in activities_data.columns]
                
                # Map column names to our schema
                cat_num_col = next((i for i, col in enumerate(columns) if 'categor' in col and ('number' in col or 'num' in col)), None)
                act_num_col = next((i for i, col in enumerate(columns) if 'activit' in col and ('number' in col or 'num' in col)), None)
                act_text_col = next((i for i, col in enumerate(columns) if ('activit' in col and 'text' in col) or ('activit' in col and 'desc' in col)), None)
                compulsory_col = next((i for i, col in enumerate(columns) if 'compulsory' in col or 'mandatory' in col or 'required' in col), None)
                order_col = next((i for i, col in enumerate(columns) if 'order' in col or 'seq' in col), None)
                
                # If we don't have specific columns, try a more generic approach
                if cat_num_col is None:
                    cat_num_col = 0  # Assume first column
                if act_num_col is None:
                    act_num_col = 1  # Assume second column
                if act_text_col is None:
                    act_text_col = 2  # Assume third column
                
                # Write activities insertion SQL
                f.write("-- Insert activities\n")
                f.write("INSERT INTO inspection_activities (id, category_id, activity_number, activity_text, is_compulsory, display_order, active) VALUES\n")
                
                for i, row in activities_data.iterrows():
                    if i > 0 and pd.isna(row[act_text_col]):
                        continue  # Skip rows with empty activity text after the first row
                        
                    activity_id = str(uuid.uuid4())
                    category_number = str(row.iloc[cat_num_col]) if cat_num_col is not None else ""
                    activity_number = str(row.iloc[act_num_col]) if act_num_col is not None else str(i+1)
                    activity_text = str(row.iloc[act_text_col]) if act_text_col is not None else ""
                    
                    # Determine if activity is compulsory
                    is_compulsory = False
                    if compulsory_col is not None and not pd.isna(row.iloc[compulsory_col]):
                        compulsory_value = str(row.iloc[compulsory_col]).lower()
                        is_compulsory = compulsory_value in ('yes', 'y', 'true', 't', '1')
                    
                    display_order = int(row.iloc[order_col]) if order_col is not None and not pd.isna(row.iloc[order_col]) else i+1
                    
                    # Clean up any non-printable characters and escape quotes
                    category_number = category_number.replace("'", "''").strip()
                    activity_number = activity_number.replace("'", "''").strip()
                    activity_text = activity_text.replace("'", "''").strip()
                    
                    # Convert NaN to empty string
                    if category_number == 'nan': category_number = ""
                    if activity_number == 'nan': activity_number = ""
                    if activity_text == 'nan': activity_text = ""
                    
                    # Skip rows with empty activity text
                    if not activity_text:
                        continue
                    
                    f.write(f"  ('{activity_id}', (SELECT category_id FROM category_mappings WHERE category_number = '{category_number}'), " +
                           f"'{activity_number}', '{activity_text}', {str(is_compulsory).lower()}, {display_order}, true)")
                    
                    # Add comma if not the last row
                    if i < len(activities_data) - 1:
                        f.write(",\n")
                    else:
                        f.write(";\n\n")
                
                f.write("\n")
            
            # If we couldn't find specific sheets, try a more generic approach
            if sections_data is None and categories_data is None and activities_data is None:
                print("Could not identify specific sheets for sections, categories, and activities.")
                print("Attempting to process based on the first sheet...")
                
                # Try to process the first sheet
                first_sheet = pd.read_excel(file_path, sheet_name=0)
                columns = [col.lower() if isinstance(col, str) else str(col).lower() for col in first_sheet.columns]
                
                # Look for a hierarchical structure
                section_col = next((i for i, col in enumerate(columns) if 'section' in col), None)
                category_col = next((i for i, col in enumerate(columns) if 'categor' in col), None)
                activity_col = next((i for i, col in enumerate(columns) if 'activit' in col), None)
                
                if section_col is not None and category_col is not None and activity_col is not None:
                    print("Found hierarchical structure in the first sheet.")
                    # Process as hierarchical data
                    # ... [implement if needed]
        
        except Exception as e:
            print(f"Error processing sheet: {str(e)}")
            f.write(f"-- Error processing sheet: {str(e)}\n")
            
        # Drop temporary tables
        f.write("-- Drop temporary tables\n")
        f.write("DROP TABLE IF EXISTS section_mappings;\n")
        f.write("DROP TABLE IF EXISTS category_mappings;\n\n")
        
        # Commit transaction
        f.write("COMMIT;\n")
            
    print(f"SQL script generated: {sql_file}")
    
except Exception as e:
    print(f"Error: {str(e)}")

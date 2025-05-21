-- SQL script to import inspection data
-- Generated from RailwaysTrip.xlsx

BEGIN;

-- Create temporary section mappings
CREATE TEMP TABLE section_mappings (section_number text, section_id uuid);

-- Create temporary category mappings
CREATE TEMP TABLE category_mappings (category_number text, category_id uuid);

-- Drop temporary tables
DROP TABLE IF EXISTS section_mappings;
DROP TABLE IF EXISTS category_mappings;

COMMIT;

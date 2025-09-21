/*
  # Add is_mandatory column to extra_charges table

  1. New Columns
    - `is_mandatory` (boolean, default true) - indicates if the extra charge is mandatory

  2. Changes
    - Add is_mandatory column to extra_charges table with default value of true
    - Column is nullable to handle existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extra_charges' AND column_name = 'is_mandatory'
  ) THEN
    ALTER TABLE extra_charges ADD COLUMN is_mandatory boolean DEFAULT true;
  END IF;
END $$;
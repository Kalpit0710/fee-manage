/*
  # Remove quarterly_fee from classes table

  1. Changes
    - Drop quarterly_fee column from classes table
    - All fee amounts will now be managed through fee_structures table only
    
  2. Notes
    - This is a safe operation as fee structures table is the source of truth for fees
    - Classes table will only maintain class information (name, etc.)
*/

-- Remove quarterly_fee column from classes table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'quarterly_fee'
  ) THEN
    ALTER TABLE classes DROP COLUMN quarterly_fee;
  END IF;
END $$;

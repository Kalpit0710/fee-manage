/*
  # Add examination_fee and other_fee columns to fee_structures table

  1. Changes
    - Add examination_fee column to fee_structures table
    - Add other_fee column to fee_structures table
    - Both columns will have default value of 0
    
  2. Notes
    - These columns are needed to support additional fee types beyond tuition, transport, and activity fees
    - Total fee will be calculated as sum of all fee components
*/

-- Add examination_fee column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'examination_fee'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN examination_fee NUMERIC DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add other_fee column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'other_fee'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN other_fee NUMERIC DEFAULT 0 NOT NULL;
  END IF;
END $$;

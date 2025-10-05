/*
  # Implement Sequential Receipt Numbering System

  ## Overview
  Creates a robust receipt numbering system with guaranteed uniqueness and sequential generation.

  ## Changes

  1. New Tables
    - `receipt_sequences` - Tracks receipt number sequences per academic year
      - `id` (uuid, primary key)
      - `academic_year` (text, unique) - e.g., "2025-26"
      - `current_number` (integer) - Last used receipt number
      - `prefix` (text) - Receipt prefix (e.g., "JRP")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - `generate_receipt_number()` - Generates next sequential receipt number
    - Returns format: PREFIX-YEAR-NUMBER (e.g., "JRP-2526-00001")

  3. Security
    - Enable RLS on receipt_sequences table
    - Add policies for authenticated users to read
    - Only system can write (via function with SECURITY DEFINER)

  4. Triggers
    - Auto-generate receipt number before transaction insert

  ## Notes
  - Receipt numbers are guaranteed unique per academic year
  - Format: PREFIX-YEAR-SEQNUM (e.g., JRP-2526-00001)
  - Sequence counter is atomic and thread-safe
  - Old receipts without proper format are preserved
*/

-- Create receipt sequences table
CREATE TABLE IF NOT EXISTS receipt_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year text UNIQUE NOT NULL,
  current_number integer NOT NULL DEFAULT 0,
  prefix text NOT NULL DEFAULT 'JRP',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE receipt_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read sequences
CREATE POLICY "Anyone can read receipt sequences"
  ON receipt_sequences FOR SELECT
  TO authenticated
  USING (true);

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number(p_academic_year text DEFAULT '2025-26')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence_id uuid;
  v_next_number integer;
  v_prefix text;
  v_year_short text;
  v_receipt_no text;
BEGIN
  -- Convert academic year to short format (e.g., "2025-26" -> "2526")
  v_year_short := REPLACE(p_academic_year, '-', '');

  -- Get or create sequence record with lock
  INSERT INTO receipt_sequences (academic_year, current_number, prefix)
  VALUES (p_academic_year, 0, 'JRP')
  ON CONFLICT (academic_year) DO NOTHING;

  -- Lock the row and increment counter
  UPDATE receipt_sequences
  SET
    current_number = current_number + 1,
    updated_at = now()
  WHERE academic_year = p_academic_year
  RETURNING id, current_number, prefix INTO v_sequence_id, v_next_number, v_prefix;

  -- Generate receipt number in format: PREFIX-YEAR-NUMBER
  v_receipt_no := v_prefix || '-' || v_year_short || '-' || LPAD(v_next_number::text, 5, '0');

  RETURN v_receipt_no;
END;
$$;

-- Create trigger function to auto-generate receipt numbers
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_academic_year text;
BEGIN
  -- Only generate if receipt_no is not already set
  IF NEW.receipt_no IS NULL OR NEW.receipt_no = '' THEN
    -- Try to get academic year from quarter
    SELECT q.academic_year INTO v_academic_year
    FROM quarters q
    WHERE q.id = NEW.quarter_id;

    -- Fallback to current academic year if not found
    IF v_academic_year IS NULL THEN
      v_academic_year := '2025-26';
    END IF;

    -- Generate the receipt number
    NEW.receipt_no := generate_receipt_number(v_academic_year);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON transactions;

-- Create trigger on transactions table
CREATE TRIGGER trigger_set_receipt_number
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_receipt_number();

-- Initialize sequence for current academic year
INSERT INTO receipt_sequences (academic_year, current_number, prefix)
VALUES ('2025-26', 0, 'JRP')
ON CONFLICT (academic_year) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE receipt_sequences IS 'Manages sequential receipt numbering per academic year';
COMMENT ON FUNCTION generate_receipt_number IS 'Generates next sequential receipt number for given academic year';

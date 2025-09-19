/*
  # Add missing transaction columns

  1. New Columns
    - `cheque_date` (date, nullable) - Date on the cheque for cheque payments
    - `cheque_number` (text, nullable) - Cheque number for cheque payments  
    - `transaction_ref` (text, nullable) - Transaction reference for online/UPI payments

  2. Purpose
    - Support different payment modes (cheque, UPI, online transfer)
    - Store payment-specific details for audit and reconciliation
    - Align database schema with application requirements

  3. Notes
    - All columns are nullable as they're only relevant for specific payment modes
    - Uses safe IF NOT EXISTS pattern to prevent errors on re-run
*/

-- Add cheque_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'cheque_date'
  ) THEN
    ALTER TABLE transactions ADD COLUMN cheque_date date;
  END IF;
END $$;

-- Add cheque_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'cheque_number'
  ) THEN
    ALTER TABLE transactions ADD COLUMN cheque_number text;
  END IF;
END $$;

-- Add transaction_ref column if it doesn't exist (for UPI/online payments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'transaction_ref'
  ) THEN
    ALTER TABLE transactions ADD COLUMN transaction_ref text;
  END IF;
END $$;
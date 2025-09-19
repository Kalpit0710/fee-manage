/*
  # Add bank_name column to transactions table

  1. Changes
    - Add `bank_name` column to `transactions` table
    - Column is nullable text type for storing bank names when payment mode is cheque

  2. Notes
    - This column is used when payment_mode is 'cheque' to store the bank name
    - Column is optional (nullable) as it's only relevant for cheque payments
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE transactions ADD COLUMN bank_name text;
  END IF;
END $$;
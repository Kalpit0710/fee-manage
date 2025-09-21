/*
  # Add payment_reference column to transactions table

  1. Changes
    - Add `payment_reference` column to `transactions` table
    - Column type: text (nullable)
    - This column will store payment reference information for transactions

  2. Notes
    - The column is nullable to maintain compatibility with existing records
    - This resolves the PGRST204 error where the application expects this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_reference text;
  END IF;
END $$;
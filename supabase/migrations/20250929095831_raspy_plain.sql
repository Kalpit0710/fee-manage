/*
  # Add status column to transactions table

  1. Changes
    - Add `status` column to `transactions` table with default value 'completed'
    - Add check constraint to ensure valid status values
    - Update existing transactions to have 'completed' status

  2. Security
    - No changes to RLS policies needed
*/

-- Add status column to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN status varchar(20) DEFAULT 'completed';
    
    -- Add check constraint for valid status values
    ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
    CHECK (status IN ('completed', 'pending', 'failed', 'refunded'));
    
    -- Update existing transactions to have completed status
    UPDATE transactions SET status = 'completed' WHERE status IS NULL;
  END IF;
END $$;
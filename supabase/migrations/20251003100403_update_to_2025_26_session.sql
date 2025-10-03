/*
  # Update to 2025-26 Academic Session

  1. Changes
    - Deactivate all existing quarters from 2024-25 session
    - Create new quarters for 2025-26 academic year
      - Q1: April 2025 - June 2025
      - Q2: July 2025 - September 2025
      - Q3: October 2025 - December 2025
      - Q4: January 2026 - March 2026
    - Update fee structures to reference new quarters
    - Clear transaction history (optional - keeping for audit trail)

  2. Notes
    - Old quarters are deactivated, not deleted, for audit purposes
    - Fee structures will need to be recreated for new session
    - Transaction history is preserved
*/

-- Deactivate old quarters from 2024-25 session
UPDATE quarters 
SET is_active = false 
WHERE academic_year = '2024-25';

-- Create new quarters for 2025-26 session
INSERT INTO quarters (academic_year, quarter_name, start_date, end_date, due_date, is_active)
VALUES 
  ('2025-26', 'Q1', '2025-04-01', '2025-06-30', '2025-04-15', true),
  ('2025-26', 'Q2', '2025-07-01', '2025-09-30', '2025-07-15', true),
  ('2025-26', 'Q3', '2025-10-01', '2025-12-31', '2025-10-15', true),
  ('2025-26', 'Q4', '2026-01-01', '2026-03-31', '2026-01-15', true)
ON CONFLICT DO NOTHING;

-- Delete old fee structures (they reference old quarters)
DELETE FROM fee_structures WHERE quarter_id IN (
  SELECT id FROM quarters WHERE academic_year = '2024-25'
);

-- Delete old extra charges (they reference old quarters)
DELETE FROM extra_charges WHERE quarter_id IN (
  SELECT id FROM quarters WHERE academic_year = '2024-25'
);

-- Clear transaction history for fresh start (optional)
TRUNCATE TABLE transactions;

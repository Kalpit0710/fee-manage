/*
  # Create Comprehensive Audit Trail System

  1. Changes
    - Drop existing audit_logs table if it exists
    - Create new audit_logs table with proper schema
    - Add triggers to track changes on critical tables
    
  2. Notes
    - Tracks all create, update, delete operations
    - Stores old and new data as JSONB
    - Only admins can view audit logs
*/

-- Drop existing audit_logs table
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create new audit_logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to log changes
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  user_email_val text;
  user_id_val uuid;
  record_id_val text;
BEGIN
  -- Get current user info
  SELECT email INTO user_email_val FROM auth.users WHERE id = auth.uid();
  user_id_val := auth.uid();

  -- Get record ID as text
  IF (TG_OP = 'DELETE') THEN
    record_id_val := OLD.id::text;
  ELSE
    record_id_val := NEW.id::text;
  END IF;

  -- Insert audit log
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_data)
    VALUES (user_id_val, COALESCE(user_email_val, 'system'), 'delete', TG_TABLE_NAME, record_id_val, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data)
    VALUES (user_id_val, COALESCE(user_email_val, 'system'), 'update', TG_TABLE_NAME, record_id_val, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, new_data)
    VALUES (user_id_val, COALESCE(user_email_val, 'system'), 'create', TG_TABLE_NAME, record_id_val, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_students_changes ON students;
DROP TRIGGER IF EXISTS audit_transactions_changes ON transactions;
DROP TRIGGER IF EXISTS audit_fee_structures_changes ON fee_structures;
DROP TRIGGER IF EXISTS audit_extra_charges_changes ON extra_charges;
DROP TRIGGER IF EXISTS audit_users_changes ON users;

-- Add triggers to critical tables
CREATE TRIGGER audit_students_changes
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_transactions_changes
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_fee_structures_changes
AFTER INSERT OR UPDATE OR DELETE ON fee_structures
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_extra_charges_changes
AFTER INSERT OR UPDATE OR DELETE ON extra_charges
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_users_changes
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Create indexes for performance
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

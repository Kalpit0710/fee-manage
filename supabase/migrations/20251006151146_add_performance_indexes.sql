/*
  # Add Performance Indexes

  1. Indexes for Common Queries
    - Students: class_id, admission_no, parent_email, is_active
    - Transactions: student_id, quarter_id, payment_date, status, created_by
    - Fee Structures: class_id, quarter_id
    - Extra Charges: student_id, class_id, quarter_id
    - Audit Logs: Already indexed
    
  2. Benefits
    - Faster lookups by foreign keys
    - Improved filtering performance
    - Better pagination performance
    - Optimized date range queries
*/

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON students(parent_email);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_quarter_id ON transactions(quarter_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_no ON transactions(receipt_no);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_student_quarter ON transactions(student_id, quarter_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_status ON transactions(payment_date DESC, status);

-- Fee Structures table indexes
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_quarter_id ON fee_structures(quarter_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_quarter ON fee_structures(class_id, quarter_id);

-- Extra Charges table indexes
CREATE INDEX IF NOT EXISTS idx_extra_charges_student_id ON extra_charges(student_id);
CREATE INDEX IF NOT EXISTS idx_extra_charges_class_id ON extra_charges(class_id);
CREATE INDEX IF NOT EXISTS idx_extra_charges_quarter_id ON extra_charges(quarter_id);
CREATE INDEX IF NOT EXISTS idx_extra_charges_created_by ON extra_charges(created_by);

-- Quarters table indexes
CREATE INDEX IF NOT EXISTS idx_quarters_is_active ON quarters(is_active);
CREATE INDEX IF NOT EXISTS idx_quarters_academic_year ON quarters(academic_year);
CREATE INDEX IF NOT EXISTS idx_quarters_due_date ON quarters(due_date);

-- Classes table index
CREATE INDEX IF NOT EXISTS idx_classes_class_name ON classes(class_name);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

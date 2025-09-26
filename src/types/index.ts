export interface Student {
  id: string;
  admission_no: string;
  name: string;
  class_id: string;
  section?: string;
  parent_contact?: string;
  parent_email?: string;
  concession?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class?: Class;
}

export interface Class {
  id: string;
  class_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quarter {
  id: string;
  academic_year: string;
  quarter_name: string;
  quarter_number: number;
  start_date: string;
  end_date: string;
  due_date: string;
  late_fee_amount?: number;
  late_fee_percentage?: number;
  is_active: boolean;
  created_at: string;
}

export interface FeeStructure {
  id: string;
  class_id: string;
  quarter_id: string;
  tuition_fee: number;
  transport_fee: number;
  activity_fee: number;
  examination_fee: number;
  other_fee: number;
  total_fee: number;
  created_at: string;
  updated_at: string;
  class?: Class;
  quarter?: Quarter;
}

export interface ExtraCharge {
  id: string;
  student_id?: string;
  class_id?: string;
  quarter_id: string;
  title: string;
  description?: string;
  amount: number;
  is_mandatory: boolean;
  created_by: string;
  created_at: string;
  student?: Student;
  class?: Class;
  quarter?: Quarter;
}

export interface Transaction {
  id: string;
  student_id: string;
  quarter_id: string;
  receipt_no: string;
  base_fee: number;
  extra_charges: number;
  late_fee: number;
  concession_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  payment_mode: 'cash' | 'upi' | 'cheque' | 'online';
  payment_date: string;
  payment_reference?: string;
  cheque_number?: string;
  cheque_date?: string;
  bank_name?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  quarter?: Quarter;
  created_by_user?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

export interface DashboardStats {
  total_students: number;
  total_collected: number;
  pending_amount: number;
  late_fees_collected: number;
  online_payments: number;
  offline_payments: number;
  collections_by_quarter: Array<{
    quarter: string;
    collected: number;
    expected: number;
  }>;
  collections_by_class: Array<{
    class_name: string;
    collected: number;
    expected: number;
  }>;
  recent_transactions: Transaction[];
}

export interface StudentFeeDetails {
  student: Student;
  quarters: Array<{
    quarter: Quarter;
    fee_structure?: FeeStructure;
    extra_charges: ExtraCharge[];
    transactions: Transaction[];
    base_fee: number;
    extra_charges_amount: number;
    late_fee: number;
    total_due: number;
    amount_paid: number;
    balance: number;
    is_overdue: boolean;
  }>;
}

export interface PaymentRequest {
  student_id: string;
  quarter_id: string;
  amount_paid: number;
  payment_mode: 'cash' | 'upi' | 'cheque' | 'online';
  payment_reference?: string;
  cheque_number?: string;
  cheque_date?: string | null;
  bank_name?: string;
  notes?: string;
}
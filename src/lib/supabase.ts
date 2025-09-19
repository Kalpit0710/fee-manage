import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
};

// Database helpers
export const db = {
  // Students
  getStudents: async (filters?: { class_id?: string; search?: string }) => {
    let query = supabase
      .from('students')
      .select(`
        *,
        class:classes(*)
      `)
      .eq('is_active', true)
      .order('admission_no');

    if (filters?.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,admission_no.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getStudent: async (id: string) => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        class:classes(*)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  createStudent: async (student: Omit<any, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();

    return { data, error };
  },

  updateStudent: async (id: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('students')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  deleteStudent: async (id: string) => {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
  // Classes
  getClasses: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('class_name');

    return { data, error };
  },

  getClass: async (id: string) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  createClass: async (classData: { class_name: string; quarterly_fee: number }) => {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();

    return { data, error };
  },

  updateClass: async (id: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  deleteClass: async (id: string) => {
    const { data, error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    return { data, error };
  },
  // Quarters
  getQuarters: async (academic_year?: string) => {
    let query = supabase
      .from('quarters')
      .select('*')
      .eq('is_active', true)
      .order('start_date');

    if (academic_year) {
      query = query.eq('academic_year', academic_year);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getQuarter: async (id: string) => {
    const { data, error } = await supabase
      .from('quarters')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  createQuarter: async (quarter: any) => {
    const { data, error } = await supabase
      .from('quarters')
      .insert(quarter)
      .select()
      .single();

    return { data, error };
  },

  updateQuarter: async (id: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('quarters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  deleteQuarter: async (id: string) => {
    const { data, error } = await supabase
      .from('quarters')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
  // Fee Structures
  getFeeStructures: async (filters?: { class_id?: string; quarter_id?: string }) => {
    let query = supabase
      .from('fee_structures')
      .select(`
        *,
        class:classes(*),
        quarter:quarters(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    if (filters?.quarter_id) {
      query = query.eq('quarter_id', filters.quarter_id);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getFeeStructure: async (id: string) => {
    const { data, error } = await supabase
      .from('fee_structures')
      .select(`
        *,
        class:classes(*),
        quarter:quarters(*)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },
  createFeeStructure: async (feeStructure: any) => {
    const { data, error } = await supabase
      .from('fee_structures')
      .insert(feeStructure)
      .select()
      .single();

    return { data, error };
  },

  updateFeeStructure: async (id: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('fee_structures')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  deleteFeeStructure: async (id: string) => {
    const { data, error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', id);

    return { data, error };
  },

  // Extra Charges
  getExtraCharges: async (filters?: { 
    student_id?: string; 
    class_id?: string; 
    quarter_id?: string; 
  }) => {
    let query = supabase
      .from('extra_charges')
      .select(`
        *,
        student:students(*),
        class:classes(*),
        quarter:quarters(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id);
    }

    if (filters?.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    if (filters?.quarter_id) {
      query = query.eq('quarter_id', filters.quarter_id);
    }

    const { data, error } = await query;
    return { data, error };
  },

  createExtraCharge: async (extraCharge: any) => {
    const { data, error } = await supabase
      .from('extra_charges')
      .insert(extraCharge)
      .select()
      .single();

    return { data, error };
  },

  updateExtraCharge: async (id: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('extra_charges')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  deleteExtraCharge: async (id: string) => {
    const { data, error } = await supabase
      .from('extra_charges')
      .delete()
      .eq('id', id);

    return { data, error };
  },
  // Transactions
  getTransactions: async (filters?: { 
    student_id?: string; 
    quarter_id?: string; 
    created_by?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        student:students(*),
        quarter:quarters(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id);
    }

    if (filters?.quarter_id) {
      query = query.eq('quarter_id', filters.quarter_id);
    }

    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters?.date_from) {
      query = query.gte('payment_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('payment_date', filters.date_to);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getTransaction: async (id: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        student:students(*),
        quarter:quarters(*)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },
  createTransaction: async (transaction: any) => {
    // Generate receipt number (simple format for now)
    const receiptNo = `RCP${Date.now()}`;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        receipt_no: receiptNo
      })
      .select(`
        *,
        student:students(*),
        quarter:quarters(*)
      `)
      .single();

    return { data, error };
  },

  updateTransaction: async (id: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        student:students(*),
        quarter:quarters(*)
      `)
      .single();

    return { data, error };
  },

  deleteTransaction: async (id: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    return { data, error };
  },

  // Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  getUser: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  updateUser: async (id: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Student Fee Details
  getStudentFeeDetails: async (studentId: string) => {
    const [studentResult, quartersResult, feeStructuresResult, extraChargesResult, transactionsResult] = await Promise.all([
      db.getStudent(studentId),
      db.getQuarters(),
      db.getFeeStructures(),
      db.getExtraCharges({ student_id: studentId }),
      db.getTransactions({ student_id: studentId })
    ]);

    if (studentResult.error || !studentResult.data) {
      return { data: null, error: studentResult.error };
    }

    const student = studentResult.data;
    const quarters = quartersResult.data || [];
    const allFeeStructures = feeStructuresResult.data || [];
    const extraCharges = extraChargesResult.data || [];
    const transactions = transactionsResult.data || [];

    // Calculate fee details for each quarter
    const quarterDetails = quarters.map(quarter => {
      const feeStructure = allFeeStructures.find(fs => 
        fs.quarter_id === quarter.id && fs.class_id === student.class_id
      );
      const quarterExtraCharges = extraCharges.filter(ec => ec.quarter_id === quarter.id);
      const quarterTransactions = transactions.filter(t => t.quarter_id === quarter.id);

      const baseFee = feeStructure?.total_fee || 0;
      const extraChargesAmount = quarterExtraCharges.reduce((sum, ec) => sum + ec.amount, 0);
      const amountPaid = quarterTransactions.reduce((sum, t) => sum + t.amount_paid, 0);
      
      const isOverdue = new Date() > new Date(quarter.due_date);
      const lateFee = isOverdue && amountPaid < (baseFee + extraChargesAmount) ? 100 : 0;
      
      const totalDue = baseFee + extraChargesAmount + lateFee - (student.concession_amount || 0);
      const balance = Math.max(0, totalDue - amountPaid);

      return {
        quarter,
        fee_structure: feeStructure,
        extra_charges: quarterExtraCharges,
        transactions: quarterTransactions,
        base_fee: baseFee,
        extra_charges_amount: extraChargesAmount,
        late_fee: lateFee,
        total_due: totalDue,
        amount_paid: amountPaid,
        balance,
        is_overdue: isOverdue && balance > 0
      };
    });

    return {
      data: {
        student,
        quarters: quarterDetails
      },
      error: null
    };
  },
  // Dashboard stats
  getDashboardStats: async () => {
    const [studentsResult, transactionsResult] = await Promise.all([
      supabase
        .from('students')
        .select('id')
        .eq('is_active', true),
      supabase
        .from('transactions')
        .select('amount_paid, late_fee, payment_mode, payment_date, student:students(*), quarter:quarters(*)')
        .order('payment_date', { ascending: false })
        .limit(10)
    ]);

    const students = studentsResult.data || [];
    const transactions = transactionsResult.data || [];

    // Calculate pending amounts (this would be more complex in real implementation)
    const totalCollected = transactions.reduce((sum, t) => sum + t.amount_paid, 0);
    const lateFees = transactions.reduce((sum, t) => sum + (t.late_fee || 0), 0);
    const onlinePayments = transactions.filter(t => ['online', 'upi'].includes(t.payment_mode)).length;
    const offlinePayments = transactions.filter(t => ['cash', 'cheque'].includes(t.payment_mode)).length;

    const stats = {
      total_students: students.length,
      total_collected: totalCollected,
      pending_amount: 0, // Would need complex calculation
      late_fees_collected: lateFees,
      online_payments: onlinePayments,
      offline_payments: offlinePayments,
      collections_by_quarter: [],
      collections_by_class: [],
      recent_transactions: transactions.slice(0, 5)
    };

    return { data: stats, error: null };
  },

  // Audit Logs
  getAuditLogs: async (filters?: {
    user_id?: string;
    entity?: string;
    action?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    let query = supabase
      .from('students')
      .select(`
        *,
        user:users(name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.entity) {
      query = query.eq('entity', filters.entity);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;
    return { data, error };
  }
};
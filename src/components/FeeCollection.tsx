import React, { useEffect, useState } from 'react';
import { 
  Search, 
  CreditCard, 
  Calculator,
  Receipt,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Printer
} from 'lucide-react';
import { Student, Quarter, StudentFeeDetails, PaymentRequest } from '../types';
import { db, supabase } from '../lib/supabase';
import { format, isAfter } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from './NotificationSystem';

export const FeeCollection: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'admission' | 'name'>('admission');
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentFeeDetails | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentRequest>({
    student_id: '',
    quarter_id: '',
    amount_paid: 0,
    payment_mode: 'cash',
    payment_reference: '',
    cheque_number: '',
    cheque_date: '',
    bank_name: '',
    notes: ''
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setStudentDetails(null);

    try {
      let students = null;
      const searchValue = searchTerm.trim();
      
      if (searchType === 'admission') {
        // Try exact match first
        let { data, error } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(*)
          `)
          .eq('admission_no', searchValue)
          .eq('is_active', true);
        
        if (error) {
          console.error('Database error:', error);
          alert('Database error occurred. Please try again.');
          return;
        }
        
        // If no exact match, try case-insensitive search
        if (!data || data.length === 0) {
          const { data: caseInsensitiveData, error: caseError } = await supabase
            .from('students')
            .select(`
              *,
              class:classes(*)
            `)
            .ilike('admission_no', searchValue)
            .eq('is_active', true);
          
          if (caseError) {
            console.error('Database error:', caseError);
            alert('Database error occurred. Please try again.');
            return;
          }
          
          students = caseInsensitiveData;
        } else {
          students = data;
        }
      } else {
        // Search by name
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(*)
          `)
          .ilike('name', `%${searchValue}%`)
          .eq('is_active', true);
        
        if (error) {
          console.error('Database error:', error);
          alert('Database error occurred. Please try again.');
          return;
        }
        
        students = data;
      }

      if (!students || students.length === 0) {
        alert(`Student not found with ${searchType === 'admission' ? 'admission number' : 'name'}: "${searchValue}". Please verify the information and try again.`);
        return;
      }

      const student = students[0];
      const { data: feeDetails, error: feeError } = await db.getStudentFeeDetails(student.id);
      
      if (feeError) {
        console.error('Error loading fee details:', feeError);
        alert('Error loading student fee details. Please try again.');
        return;
      }
      
      if (feeDetails) {
        setStudentDetails(feeDetails);
      } else {
        alert('Unable to load fee details for this student.');
      }

    } catch (error) {
      console.error('Search error:', error);
      alert(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = (quarterId: string, balance: number) => {
    if (!studentDetails) return;

    setPaymentData({
      student_id: studentDetails.student.id,
      quarter_id: quarterId,
      amount_paid: balance,
      payment_mode: 'cash',
      payment_reference: '',
      cheque_number: '',
      cheque_date: '',
      bank_name: '',
      notes: ''
    });
    setSelectedQuarter(quarterId);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingPayment(true);

    try {
      const transactionData = {
        ...paymentData,
        cheque_date: paymentData.cheque_date || null,
        created_by: user?.id,
        status: 'completed'
      };

      const { data: transaction } = await db.createTransaction(transactionData);
      
      if (transaction) {
        showSuccess(
          'Payment Successful', 
          `Payment collected successfully! Receipt No: ${transaction.receipt_no}`
        );
        setShowPaymentModal(false);
        
        // Refresh student details
        if (studentDetails) {
          const { data: updatedDetails } = await db.getStudentFeeDetails(studentDetails.student.id);
          if (updatedDetails) {
            setStudentDetails(updatedDetails);
          }
        }
      }

    } catch (error) {
      console.error('Payment error:', error);
      showError('Payment Failed', 'Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getQuarterStatus = (quarter: any) => {
    if (quarter.balance === 0) {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Paid' };
    }
    if (quarter.is_overdue) {
      return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Overdue' };
    }
    return { icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Pending' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fee Collection</h2>
          <p className="text-gray-600">Search students and collect fees</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Student</h3>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-48">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'admission' | 'name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="admission">Admission Number</option>
                <option value="name">Student Name</option>
              </select>
            </div>
            
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    searchType === 'admission' 
                      ? 'Enter admission number' 
                      : 'Enter student name'
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Student Details */}
      {studentDetails && (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{studentDetails.student.name}</h3>
                <p className="text-gray-600">
                  {studentDetails.student.admission_no} • {studentDetails.student.class?.class_name}
                  {studentDetails.student.section && ` - ${studentDetails.student.section}`}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Parent Contact</p>
                <p className="font-medium">{studentDetails.student.parent_contact || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Parent Email</p>
                <p className="font-medium">{studentDetails.student.parent_email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Concession</p>
                <p className="font-medium text-green-600">
                  {studentDetails.student.concession_amount > 0 
                    ? `₹${studentDetails.student.concession_amount}` 
                    : 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Details by Quarter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {studentDetails.quarters.map((quarter) => {
              const status = getQuarterStatus(quarter);
              const StatusIcon = status.icon;
              
              return (
                <div key={quarter.quarter.id} className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${status.bg} rounded-lg flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {quarter.quarter.quarter_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Due: {format(new Date(quarter.quarter.due_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Fee:</span>
                        <span className="font-medium">₹{quarter.base_fee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Extra Charges:</span>
                        <span className="font-medium">₹{quarter.extra_charges_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Late Fee:</span>
                        <span className="font-medium text-red-600">₹{quarter.late_fee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-medium text-green-600">₹{quarter.amount_paid.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Balance Due:</span>
                          <span className="text-xl font-bold text-blue-600">
                            ₹{quarter.balance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {quarter.balance > 0 && (
                      <button
                        onClick={() => handleCollectFee(quarter.quarter.id, quarter.balance)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Collect Fee - ₹{quarter.balance.toLocaleString()}</span>
                      </button>
                    )}

                    {quarter.transactions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-medium text-gray-900 mb-2">Recent Payments</h5>
                        <div className="space-y-2">
                          {quarter.transactions.slice(0, 2).map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                {format(new Date(transaction.payment_date), 'MMM dd')} • {transaction.receipt_no}
                              </span>
                              <span className="font-medium">₹{transaction.amount_paid.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          onSubmit={handlePaymentSubmit}
          onClose={() => setShowPaymentModal(false)}
          processing={processingPayment}
        />
      )}
    </div>
  );
};

interface PaymentModalProps {
  paymentData: PaymentRequest;
  setPaymentData: (data: PaymentRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  processing: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  paymentData,
  setPaymentData,
  onSubmit,
  onClose,
  processing
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Collect Payment</h3>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Collect (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paymentData.amount_paid}
              onChange={(e) => setPaymentData({ ...paymentData, amount_paid: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentData.payment_mode}
              onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Transfer</option>
            </select>
          </div>

          {paymentData.payment_mode === 'upi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI Transaction ID
              </label>
              <input
                type="text"
                value={paymentData.payment_reference}
                onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter UPI transaction ID"
              />
            </div>
          )}

          {paymentData.payment_mode === 'cheque' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number
                </label>
                <input
                  type="text"
                  value={paymentData.cheque_number}
                  onChange={(e) => setPaymentData({ ...paymentData, cheque_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter cheque number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Date
                </label>
                <input
                  type="date"
                  value={paymentData.cheque_date}
                  onChange={(e) => setPaymentData({ ...paymentData, cheque_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={paymentData.bank_name}
                  onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter bank name"
                />
              </div>
            </>
          )}

          {paymentData.payment_mode === 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference
              </label>
              <input
                type="text"
                value={paymentData.payment_reference}
                onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter transaction reference"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add any notes about this payment"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Receipt className="w-4 h-4" />
              <span>{processing ? 'Processing...' : 'Collect Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
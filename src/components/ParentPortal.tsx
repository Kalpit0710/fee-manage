import React, { useState } from 'react';
import { 
  Search, 
  CreditCard, 
  Download, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Receipt,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Student, StudentFeeDetails, Quarter } from '../types';
import { db, supabase } from '../lib/supabase';
import { format, isAfter } from 'date-fns';
import { PaymentGateway } from './PaymentGateway';
import { ReceiptGenerator } from './ReceiptGenerator';

interface PaymentDetails {
  student: Student;
  quarter: Quarter;
  amount: number;
  breakdown: {
    baseFee: number;
    extraCharges: number;
    lateFee: number;
    concession: number;
    total: number;
  };
}

export const ParentPortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'admission' | 'name'>('admission');
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentFeeDetails | null>(null);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
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
          setError('Database error occurred. Please try again.');
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
            setError('Database error occurred. Please try again.');
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
          setError('Database error occurred. Please try again.');
          return;
        }
        
        students = data;
      }

      if (!students || students.length === 0) {
        setError(`Student not found with ${searchType === 'admission' ? 'admission number' : 'name'}: "${searchValue}". Please verify the information and try again.`);
        return;
      }

      const student = students[0];
      
      // Get detailed fee information
      const { data: feeDetails, error: feeError } = await db.getStudentFeeDetails(student.id);
      
      if (feeError) {
        console.error('Error loading fee details:', feeError);
        setError('Error loading student fee details. Please try again.');
        return;
      }
      
      if (feeDetails) {
        setStudentDetails(feeDetails);
      } else {
        setError('Unable to load fee details for this student.');
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayOnline = (quarter: any) => {
    if (!studentDetails) return;

    const paymentInfo: PaymentDetails = {
      student: studentDetails.student,
      quarter: quarter.quarter,
      amount: quarter.balance,
      breakdown: {
        baseFee: quarter.base_fee,
        extraCharges: quarter.extra_charges_amount,
        lateFee: quarter.late_fee,
        concession: studentDetails.student.concession_amount || 0,
        total: quarter.balance
      }
    };

    setPaymentDetails(paymentInfo);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Record the transaction in database
      const transactionData = {
        student_id: paymentData.student_id,
        quarter_id: paymentData.quarter_id,
        amount_paid: paymentData.amount,
        late_fee: paymentData.late_fee || 0,
        payment_mode: 'online',
        payment_reference: paymentData.razorpay_payment_id,
        notes: `Online payment via Razorpay - ${paymentData.razorpay_payment_id}`,
        created_by: null // Parent payment
      };

      const { data: transaction } = await db.createTransaction(transactionData);
      
      if (transaction) {
        // Show receipt
        setReceiptData({
          transaction,
          student: paymentDetails?.student,
          quarter: paymentDetails?.quarter,
          breakdown: paymentDetails?.breakdown,
          paymentId: paymentData.razorpay_payment_id
        });
        setShowReceipt(true);
        setShowPayment(false);
        
        // Refresh student details
        if (studentDetails) {
          const { data: updatedDetails } = await db.getStudentFeeDetails(studentDetails.student.id);
          if (updatedDetails) {
            setStudentDetails(updatedDetails);
          }
        }
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Payment was successful but there was an error recording it. Please contact the school office.');
    }
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again or contact the school office.');
    setShowPayment(false);
  };

  const handleViewReceipt = (transaction: any, quarter: any) => {
    setReceiptData({
      transaction,
      student: studentDetails?.student,
      quarter: quarter.quarter,
      breakdown: {
        baseFee: quarter.base_fee,
        extraCharges: quarter.extra_charges_amount,
        lateFee: quarter.late_fee,
        concession: studentDetails?.student.concession_amount || 0,
        total: transaction.amount_paid
      },
      paymentId: transaction.payment_reference
    });
    setShowReceipt(true);
  };

  const getStatusBadge = (quarter: any) => {
    if (quarter.balance === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </span>
      );
    }
    
    if (quarter.is_overdue) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const resetSearch = () => {
    setStudentDetails(null);
    setSearchTerm('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4">J.R. Preparatory School</h1>
              <p className="text-blue-100 text-lg">Parent Fee Portal - Check and pay your child's school fees online</p>
            </div>
            <a 
              href="/admin" 
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors text-sm"
            >
              Admin Login
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!studentDetails ? (
          /* Search Form */
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Student</h2>
            
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
                          ? 'Enter admission number (e.g., 2024001)' 
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

            {error && (
              <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* Student Details */
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={resetSearch}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Search Another Student</span>
            </button>

            {/* Student Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{studentDetails.student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admission Number</p>
                  <p className="font-medium">{studentDetails.student.admission_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="font-medium">
                    {studentDetails.student.class?.class_name}
                    {studentDetails.student.section && ` - ${studentDetails.student.section}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Fee Details by Quarter */}
            <div className="space-y-4">
              {studentDetails.quarters.map((quarter) => (
                <div key={quarter.quarter.id} className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {quarter.quarter.quarter_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Due Date: {format(new Date(quarter.quarter.due_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {getStatusBadge(quarter)}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-600">Base Fee</p>
                        <p className="text-lg font-semibold">₹{quarter.base_fee.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Extra Charges</p>
                        <p className="text-lg font-semibold">₹{quarter.extra_charges_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Late Fee</p>
                        <p className="text-lg font-semibold text-red-600">₹{quarter.late_fee.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amount Due</p>
                        <p className="text-xl font-bold text-blue-600">₹{quarter.balance.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Payment History */}
                    {quarter.transactions.length > 0 && (
                      <div className="mb-6">
                        <h5 className="font-medium text-gray-900 mb-3">Payment History</h5>
                        <div className="space-y-2">
                          {quarter.transactions.map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">₹{transaction.amount_paid.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(transaction.payment_date), 'MMM dd, yyyy')} • 
                                  Receipt: {transaction.receipt_no} • 
                                  {transaction.payment_mode.toUpperCase()}
                                </p>
                              </div>
                              <button 
                                onClick={() => handleViewReceipt(transaction, quarter)}
                                className="text-blue-600 hover:text-blue-700 p-1 flex items-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">View Receipt</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {quarter.balance > 0 && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handlePayOnline(quarter)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <Smartphone className="w-5 h-5" />
                          <span>Pay Online - ₹{quarter.balance.toLocaleString()}</span>
                        </button>
                        
                        <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Download Statement</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 mb-1">School Office</p>
              <p className="text-blue-700">Phone: +91 98765 43210</p>
              <p className="text-blue-700">Email: office@jrprep.edu</p>
            </div>
            <div>
              <p className="font-medium text-blue-800 mb-1">Office Hours</p>
              <p className="text-blue-700">Monday to Friday: 8:00 AM - 4:00 PM</p>
              <p className="text-blue-700">Saturday: 8:00 AM - 12:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPayment && paymentDetails && (
        <PaymentGateway
          paymentDetails={paymentDetails}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <ReceiptGenerator
          receiptData={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};
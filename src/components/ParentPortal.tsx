import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  User,
  BookOpen
} from 'lucide-react';
import { Student, StudentFeeDetails, Quarter } from '../types';
import { db, supabase } from '../lib/supabase';
import { format, isAfter } from 'date-fns';
import { PaymentGateway } from './PaymentGateway';
import { ReceiptGenerator } from './ReceiptGenerator';
import { useNotification } from './NotificationSystem';

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
  const { showSuccess, showError } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get initial values from URL params
  const initialSearchTerm = searchParams.get('search') || '';
  const initialSearchType = (searchParams.get('type') as 'admission' | 'name') || 'admission';
  const studentId = searchParams.get('student');
  
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchType, setSearchType] = useState<'admission' | 'name'>(initialSearchType);
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentFeeDetails | null>(null);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Load student details if student ID is in URL
  React.useEffect(() => {
    if (studentId && !studentDetails) {
      loadStudentById(studentId);
    }
  }, [studentId]);

  const loadStudentById = async (id: string) => {
    setLoading(true);
    setError('');
    
    try {
      const { data: feeDetails, error: feeError } = await db.getStudentFeeDetails(id);
      
      if (feeError) {
        console.error('Error loading fee details:', feeError);
        setError('Error loading student fee details. Please try again.');
        return;
      }
      
      if (feeDetails) {
        setStudentDetails(feeDetails);
        // Update search term to show student info
        setSearchTerm(feeDetails.student.admission_no);
        setSearchType('admission');
      }
    } catch (err) {
      console.error('Error loading student:', err);
      setError('Error loading student details.');
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    setSearchParams(newSearchParams);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setStudentDetails(null);

    try {
      const searchValue = searchTerm.trim();
      console.log('Searching for:', searchValue, 'Type:', searchType);
      
      let students = null;
      
      if (searchType === 'admission') {
        // Search by admission number - try exact match first
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(*)
          `)
          .eq('admission_no', searchValue)
          .eq('is_active', true);
        
        if (error) {
          console.error('Database error:', error);
          setError('Unable to search students. Please check your connection and try again.');
          return;
        }
        
        students = data;
        console.log('Search results:', students);
        
        // If no exact match, try case-insensitive search
        if (!students || students.length === 0) {
          console.log('No exact match, trying case-insensitive search...');
          const { data: caseData, error: caseError } = await supabase
            .from('students')
            .select(`
              *,
              class:classes(*)
            `)
            .ilike('admission_no', searchValue)
            .eq('is_active', true);
          
          if (caseError) {
            console.error('Case-insensitive search error:', caseError);
            setError('Unable to search students. Please try again.');
            return;
          }
          
          students = caseData;
          console.log('Case-insensitive results:', students);
        }
        
      } else {
        // Search by name
        console.log('Searching by name...');
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(*)
          `)
          .ilike('name', `%${searchValue}%`)
          .eq('is_active', true);
        
        if (error) {
          console.error('Name search error:', error);
          setError('Unable to search students. Please try again.');
          return;
        }
        
        students = data;
        console.log('Name search results:', students);
      }

      if (!students || students.length === 0) {
        setError(`No student found with ${searchType === 'admission' ? 'admission number' : 'name'}: "${searchValue}". Please verify the information and try again.`);
        return;
      }

      const student = students[0];
      console.log('Selected student:', student);
      
      // Get detailed fee information
      const { data: feeDetails, error: feeError } = await db.getStudentFeeDetails(student.id);
      
      if (feeError) {
        console.error('Error loading fee details:', feeError);
        setError('Error loading student fee details. Please try again.');
        return;
      }
      
      if (feeDetails) {
        console.log('Fee details loaded:', feeDetails);
        setStudentDetails(feeDetails);
        // Update URL with student ID
        updateURL({
          search: searchTerm.trim(),
          type: searchType,
          student: student.id
        });
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

    // Calculate proper amounts
    const baseFee = quarter.base_fee || 0;
    const extraCharges = quarter.extra_charges_amount || 0;
    const lateFee = quarter.late_fee || 0;
    const concession = studentDetails.student.concession || 0;
    const totalAmount = Math.max(0, baseFee + extraCharges + lateFee - concession);

    const paymentInfo: PaymentDetails = {
      student: studentDetails.student,
      quarter: quarter.quarter,
      amount: totalAmount,
      breakdown: {
        baseFee: baseFee,
        extraCharges: extraCharges,
        lateFee: lateFee,
        concession: concession,
        total: totalAmount
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
        late_fee: 0,
        payment_mode: 'online',
        payment_reference: paymentData.razorpay_payment_id,
        notes: `Online payment via Razorpay - ${paymentData.razorpay_payment_id}`,
        created_by: null, // Parent payment
        status: 'completed'
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
        
        showSuccess(
          'Payment Successful',
          `Payment of ₹${paymentData.amount} completed successfully!`
        );
        
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
      showError(
        'Payment Recording Error',
        'Payment was successful but there was an error recording it. Please contact the school office.'
      );
    }
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    showError(
      'Payment Failed',
      'Payment failed. Please try again or contact the school office.'
    );
    setShowPayment(false);
  };

  const handleViewReceipt = (transaction: any, quarter: any) => {
    setReceiptData({
      transaction,
      student: studentDetails?.student,
      quarter: quarter.quarter,
      breakdown: {
        baseFee: quarter.base_fee || 0,
        extraCharges: quarter.extra_charges_amount || 0,
        lateFee: quarter.late_fee || 0,
        concession: studentDetails?.student.concession || 0,
        total: transaction.amount_paid
      },
      paymentId: transaction.payment_reference
    });
    setShowReceipt(true);
  };

  const getStatusBadge = (quarter: any) => {
    if (quarter.balance === 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Paid
        </span>
      );
    }
    
    if (quarter.is_overdue) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-4 h-4 mr-1" />
          Overdue
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </span>
    );
  };

  const resetSearch = () => {
    setStudentDetails(null);
    setSearchTerm('');
    setError('');
    // Clear URL parameters
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/Colorful Fun Illustration Kids Summer Camp Activity Flyer.png" 
                alt="J.R. Preparatory School Logo" 
                className="w-16 h-16 rounded-xl object-contain bg-white p-2 shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">J.R. Preparatory School</h1>
                <p className="text-gray-600">Puranpur - Parent Fee Portal</p>
                <p className="text-sm text-gray-500">Check and pay your child's school fees online</p>
              </div>
            </div>
            <a 
              href="/admin" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Admin Login
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!studentDetails ? (
          /* Search Form */
          <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Child's Fee Details</h2>
              <p className="text-gray-600">Enter your child's admission number or name to view fee information</p>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search By</label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'admission' | 'name')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="admission">Admission Number</option>
                    <option value="name">Student Name</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {searchType === 'admission' ? 'Admission Number' : 'Student Name'}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={
                        searchType === 'admission' 
                          ? 'Enter admission number (e.g., JRO0016)' 
                          : 'Enter student name'
                      }
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      required
                    />
                  </div>
                </div>
                
                <div className="sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-6 flex items-start space-x-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Search Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Search Tips */}
            <div className="mt-8 bg-blue-50 rounded-xl p-6">
              <h3 className="font-medium text-blue-900 mb-3">Search Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• For admission number: Enter the complete number (e.g., JRO0016, not jro0016)</li>
                <li>• For student name: Enter the full name or part of it</li>
                <li>• Make sure the student is currently active in the system</li>
                <li>• Contact the school office if you're having trouble finding your child's record</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Student Details */
          <div className="space-y-8">
            {/* Back Button */}
            <button
              onClick={resetSearch}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Search Another Student</span>
            </button>

            {/* Student Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{studentDetails.student.name}</h2>
                  <p className="text-gray-600 text-lg">
                    Admission No: {studentDetails.student.admission_no} • 
                    Class: {studentDetails.student.class?.class_name}
                    {studentDetails.student.section && ` - ${studentDetails.student.section}`}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Parent Contact</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {studentDetails.student.parent_contact || 'Not provided'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Parent Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {studentDetails.student.parent_email || 'Not provided'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-green-600 mb-1">Concession</p>
                  <p className="text-lg font-semibold text-green-700">
                    {studentDetails.student.concession > 0 
                      ? `₹${studentDetails.student.concession.toLocaleString()}` 
                      : 'None'}
                  </p>
                </div>
              </div>
            </div>

            {/* Fee Details by Quarter */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Fee Details by Quarter</h3>
              
              {studentDetails.quarters.map((quarter) => (
                <div key={quarter.quarter.id} className="bg-white rounded-2xl shadow-lg border overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">
                            {quarter.quarter.quarter_name}
                          </h4>
                          <p className="text-gray-600">
                            Due Date: {format(new Date(quarter.quarter.due_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(quarter)}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Fee Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-1">Base Fee</p>
                        <p className="text-2xl font-bold text-gray-900">₹{quarter.base_fee.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-1">Extra Charges</p>
                        <p className="text-2xl font-bold text-blue-600">₹{quarter.extra_charges_amount.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-1">Late Fee</p>
                        <p className="text-2xl font-bold text-red-600">₹{quarter.late_fee.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-1">Amount Due</p>
                        <p className="text-3xl font-bold text-orange-600">₹{quarter.balance.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Payment History */}
                    {quarter.transactions.length > 0 && (
                      <div className="mb-8">
                        <h5 className="font-bold text-gray-900 mb-4 flex items-center">
                          <Receipt className="w-5 h-5 mr-2" />
                          Payment History
                        </h5>
                        <div className="space-y-3">
                          {quarter.transactions.map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                              <div>
                                <p className="font-semibold text-gray-900">₹{transaction.amount_paid.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(transaction.payment_date), 'MMM dd, yyyy')} • 
                                  Receipt: {transaction.receipt_no} • 
                                  {transaction.payment_mode.toUpperCase()}
                                </p>
                              </div>
                              <button 
                                onClick={() => handleViewReceipt(transaction, quarter)}
                                className="text-blue-600 hover:text-blue-700 p-2 flex items-center space-x-2 bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">View Receipt</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {quarter.balance > 0 ? (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => handlePayOnline(quarter)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
                        >
                          <Smartphone className="w-6 h-6" />
                          <span>Pay Online - ₹{quarter.balance.toLocaleString()}</span>
                        </button>
                        
                        <button className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3 font-medium">
                          <Download className="w-5 h-5" />
                          <span>Download Statement</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-xl font-bold text-green-700">All fees paid for this quarter!</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-bold text-gray-900 mb-2">School Office</p>
              <p className="text-gray-600">Phone: +91 98765 43210</p>
              <p className="text-gray-600">Email: office@jrprep.edu</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-gray-900 mb-2">Office Hours</p>
              <p className="text-gray-600">Monday to Friday: 8:00 AM - 4:00 PM</p>
              <p className="text-gray-600">Saturday: 8:00 AM - 12:00 PM</p>
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
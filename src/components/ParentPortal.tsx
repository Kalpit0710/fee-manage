import React, { useState } from 'react';
import { 
  Search, 
  CreditCard, 
  Download, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone
} from 'lucide-react';
import { Student, StudentFeeDetails, Quarter } from '../types';
import { db } from '../lib/supabase';
import { format, isAfter } from 'date-fns';

export const ParentPortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'admission' | 'name'>('admission');
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentFeeDetails | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setStudentDetails(null);

    try {
      const searchFilter = searchType === 'admission' 
        ? { admission_no: searchTerm.trim() }
        : { name: searchTerm.trim() };

      const { data: students } = await db.getStudents({ 
        search: searchTerm.trim() 
      });

      if (!students || students.length === 0) {
        setError('Student not found. Please check the admission number or name.');
        return;
      }

      const student = students[0];
      
      // Get quarters and fee details
      const [quartersResult, feeStructuresResult, extraChargesResult, transactionsResult] = await Promise.all([
        db.getQuarters(),
        db.getFeeStructures({ class_id: student.class_id }),
        supabase.from('extra_charges').select('*').or(`student_id.eq.${student.id},class_id.eq.${student.class_id}`),
        db.getTransactions({ student_id: student.id })
      ]);

      const quarters = quartersResult.data || [];
      const feeStructures = feeStructuresResult.data || [];
      const extraCharges = extraChargesResult.data || [];
      const transactions = transactionsResult.data || [];

      // Calculate fee details for each quarter
      const quarterDetails = quarters.map(quarter => {
        const feeStructure = feeStructures.find(fs => fs.quarter_id === quarter.id);
        const quarterExtraCharges = extraCharges.filter(ec => ec.quarter_id === quarter.id);
        const quarterTransactions = transactions.filter(t => t.quarter_id === quarter.id);

        const baseFee = feeStructure?.total_fee || 0;
        const extraChargesAmount = quarterExtraCharges.reduce((sum, ec) => sum + ec.amount, 0);
        const amountPaid = quarterTransactions.reduce((sum, t) => sum + t.amount_paid, 0);
        
        const isOverdue = isAfter(new Date(), new Date(quarter.due_date));
        const lateFee = isOverdue && amountPaid < (baseFee + extraChargesAmount) ? quarter.late_fee_amount : 0;
        
        const totalDue = baseFee + extraChargesAmount + lateFee - student.concession_amount;
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

      setStudentDetails({
        student,
        quarters: quarterDetails
      });

    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayOnline = (quarterId: string, amount: number) => {
    // In a real implementation, this would redirect to payment gateway
    alert(`Redirecting to payment gateway for ₹${amount}...`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">J.R. Preparatory School</h1>
          <p className="text-blue-100 text-lg">Parent Fee Portal - Check and pay your child's school fees online</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
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

        {/* Student Details */}
        {studentDetails && (
          <div className="space-y-6">
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
                                  Receipt: {transaction.receipt_no}
                                </p>
                              </div>
                              <button className="text-blue-600 hover:text-blue-700 p-1">
                                <Download className="w-4 h-4" />
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
                          onClick={() => handlePayOnline(quarter.quarter.id, quarter.balance)}
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
    </div>
  );
};
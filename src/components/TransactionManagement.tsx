import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, CreditCard as Edit, Trash2, Eye, RefreshCw, Calendar, DollarSign, User, CreditCard, X, Save, AlertTriangle, Receipt } from 'lucide-react';
import { Transaction, Student, Quarter, Class } from '../types';
import { db } from '../lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from './NotificationSystem';
import { ReceiptGenerator } from './ReceiptGenerator';

interface TransactionFilters {
  dateFrom: string;
  dateTo: string;
  studentId: string;
  quarterId: string;
  paymentMode: string;
  status: string;
  minAmount: string;
  maxAmount: string;
}

export const TransactionManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const [filters, setFilters] = useState<TransactionFilters>({
    dateFrom: '',
    dateTo: '',
    studentId: '',
    quarterId: '',
    paymentMode: '',
    status: '',
    minAmount: '',
    maxAmount: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (Object.values(filters).some(value => value !== '')) {
      loadTransactions();
    }
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    
    const [transactionsResult, studentsResult, quartersResult] = await Promise.all([
      db.getTransactions(),
      db.getStudents(),
      db.getQuarters()
    ]);
    
    if (transactionsResult.data) setTransactions(transactionsResult.data);
    if (studentsResult.data) setStudents(studentsResult.data);
    if (quartersResult.data) setQuarters(quartersResult.data);
    
    setLoading(false);
  };

  const loadTransactions = async () => {
    setLoading(true);
    
    const filterParams: any = {};
    if (filters.dateFrom) filterParams.date_from = filters.dateFrom;
    if (filters.dateTo) filterParams.date_to = filters.dateTo;
    if (filters.studentId) filterParams.student_id = filters.studentId;
    if (filters.quarterId) filterParams.quarter_id = filters.quarterId;
    
    const { data } = await db.getTransactions(filterParams);
    
    let filteredData = data || [];
    
    // Apply additional filters
    if (filters.paymentMode) {
      filteredData = filteredData.filter(t => t.payment_mode === filters.paymentMode);
    }
    if (filters.status) {
      filteredData = filteredData.filter(t => t.status === filters.status);
    }
    if (filters.minAmount) {
      filteredData = filteredData.filter(t => t.amount_paid >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      filteredData = filteredData.filter(t => t.amount_paid <= Number(filters.maxAmount));
    }
    
    setTransactions(filteredData);
    setLoading(false);
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      studentId: '',
      quarterId: '',
      paymentMode: '',
      status: '',
      minAmount: '',
      maxAmount: ''
    });
    loadData();
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleRefundTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowRefundModal(true);
  };

  const handleViewReceipt = async (transaction: Transaction) => {
    try {
      const { data: student } = await db.getStudent(transaction.student_id);
      const { data: quarter } = await db.getQuarter(transaction.quarter_id);
      const { data: feeDetails } = await db.getStudentFeeDetails(transaction.student_id);

      if (!student || !quarter) {
        showError('Error', 'Unable to load transaction details');
        return;
      }

      const quarterData = feeDetails?.quarters.find(q => q.quarter.id === transaction.quarter_id);

      setReceiptData({
        transaction,
        student,
        quarter,
        breakdown: {
          baseFee: quarterData?.base_fee || 0,
          extraCharges: quarterData?.extra_charges_amount || 0,
          lateFee: transaction.late_fee || 0,
          concession: student.concession_amount || 0,
          total: transaction.amount_paid
        },
        paymentId: transaction.payment_reference
      });

      setShowReceipt(true);
    } catch (error) {
      console.error('Error loading receipt:', error);
      showError('Error', 'Failed to load receipt. Please try again.');
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm(`Are you sure you want to delete transaction ${transaction.receipt_no}? This action cannot be undone.`)) {
      try {
        await db.deleteTransaction(transaction.id);
        loadTransactions();
       showSuccess('Transaction Deleted', 'Transaction has been successfully deleted');
      } catch (error) {
        console.error('Error deleting transaction:', error);
       showError('Delete Failed', 'Failed to delete transaction. Please try again.');
      }
    }
  };

  const exportTransactions = () => {
    if (!transactions.length) return;

    const headers = ['Date', 'Receipt No', 'Student', 'Class', 'Quarter', 'Amount', 'Mode', 'Status', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        format(new Date(t.payment_date), 'yyyy-MM-dd'),
        t.receipt_no,
        t.student?.name || '',
        t.student?.class?.class_name || '',
        t.quarter?.quarter_name || '',
        t.amount_paid,
        t.payment_mode,
        t.status,
        t.payment_reference || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      pending: { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentModeBadge = (mode: string) => {
    const modeConfig = {
      cash: { color: 'bg-blue-100 text-blue-800', label: 'Cash' },
      upi: { color: 'bg-green-100 text-green-800', label: 'UPI' },
      cheque: { color: 'bg-purple-100 text-purple-800', label: 'Cheque' },
      online: { color: 'bg-indigo-100 text-indigo-800', label: 'Online' }
    };
    
    const config = modeConfig[mode as keyof typeof modeConfig] || modeConfig.cash;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
          <p className="text-gray-600">View, edit, and manage all fee transactions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={exportTransactions}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={filters.studentId}
                onChange={(e) => handleFilterChange('studentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.admission_no})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
              <select
                value={filters.quarterId}
                onChange={(e) => handleFilterChange('quarterId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Quarters</option>
                {quarters.map((quarter) => (
                  <option key={quarter.id} value={quarter.id}>
                    {quarter.quarter_name} ({quarter.academic_year})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={filters.paymentMode}
                onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Modes</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="999999"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Transactions ({transactions.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {Object.values(filters).some(v => v !== '') 
                  ? 'Try adjusting your filters'
                  : 'Transactions will appear here once payments are made'
                }
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-600 border-b">
                  <th className="p-4">Date</th>
                  <th className="p-4">Receipt No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Quarter</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      {format(new Date(transaction.payment_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4 font-medium text-blue-600">
                      {transaction.receipt_no}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{transaction.student?.name}</p>
                        <p className="text-sm text-gray-500">{transaction.student?.admission_no}</p>
                      </div>
                    </td>
                    <td className="p-4">{transaction.quarter?.quarter_name}</td>
                    <td className="p-4 font-semibold">₹{transaction.amount_paid.toLocaleString()}</td>
                    <td className="p-4">{getPaymentModeBadge(transaction.payment_mode)}</td>
                    <td className="p-4">{getStatusBadge(transaction.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewReceipt(transaction)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="View Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRefundTransaction(transaction)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                          title="Process Refund"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {showEditModal && selectedTransaction && (
        <EditTransactionModal
          transaction={selectedTransaction}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            loadTransactions();
          }}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <RefundModal
          transaction={selectedTransaction}
          onClose={() => setShowRefundModal(false)}
          onSave={() => {
            setShowRefundModal(false);
            loadTransactions();
          }}
        />
      )}

      {/* Receipt Generator */}
      {showReceipt && receiptData && (
        <ReceiptGenerator
          receiptData={receiptData}
          onClose={() => setShowReceipt(false)}
          isParentView={false}
        />
      )}
    </div>
  );
};

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSave: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    amount_paid: transaction.amount_paid,
    payment_mode: transaction.payment_mode,
    payment_reference: transaction.payment_reference || '',
    cheque_number: transaction.cheque_number || '',
    cheque_date: transaction.cheque_date || '',
    bank_name: transaction.bank_name || '',
    notes: transaction.notes || '',
    status: transaction.status
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await db.updateTransaction(transaction.id, {
        ...formData,
        cheque_date: formData.cheque_date || null,
        updated_at: new Date().toISOString()
      });
      showSuccess('Transaction Updated', 'Transaction has been successfully updated');
      onSave();
    } catch (error) {
      console.error('Error updating transaction:', error);
      showError('Update Failed', 'Failed to update transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit Transaction</h3>
          <p className="text-sm text-gray-600">Receipt: {transaction.receipt_no}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount_paid}
              onChange={(e) => setFormData({ ...formData, amount_paid: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Mode
            </label>
            <select
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {formData.payment_mode === 'upi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI Transaction ID
              </label>
              <input
                type="text"
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {formData.payment_mode === 'cheque' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number
                </label>
                <input
                  type="text"
                  value={formData.cheque_number}
                  onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Date
                </label>
                <input
                  type="date"
                  value={formData.cheque_date}
                  onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {formData.payment_mode === 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference
              </label>
              <input
                type="text"
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RefundModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSave: () => void;
}

const RefundModal: React.FC<RefundModalProps> = ({
  transaction,
  onClose,
  onSave,
}) => {
  const [refundAmount, setRefundAmount] = useState(transaction.amount_paid);
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create refund transaction
      const refundData = {
        student_id: transaction.student_id,
        quarter_id: transaction.quarter_id,
        amount_paid: -refundAmount, // Negative amount for refund
        late_fee: 0,
        payment_mode: transaction.payment_mode,
        payment_reference: `REFUND-${transaction.receipt_no}`,
        notes: `Refund for ${transaction.receipt_no}. Reason: ${refundReason}`,
        status: 'completed'
      };

      await db.createTransaction(refundData);
      
      // Update original transaction status
      await db.updateTransaction(transaction.id, {
        status: 'refunded',
        notes: `${transaction.notes || ''}\nRefunded: ₹${refundAmount} - ${refundReason}`.trim()
      });

      showSuccess('Refund Processed', `Refund of ₹${refundAmount} has been processed successfully`);
      onSave();
    } catch (error) {
      console.error('Error processing refund:', error);
      showError('Refund Failed', 'Failed to process refund. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Process Refund</h3>
              <p className="text-sm text-gray-600">Receipt: {transaction.receipt_no}</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> This will create a refund transaction and mark the original transaction as refunded. This action cannot be undone.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Amount: ₹{transaction.amount_paid.toLocaleString()}
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              max={transaction.amount_paid}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Reason
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter reason for refund..."
              required
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
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Process Refund'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
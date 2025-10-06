import React, { useState, useEffect } from 'react';
import {
  Download,
  Receipt,
  Bell,
  Users,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Eye,
  Printer
} from 'lucide-react';
import { db, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from './NotificationSystem';
import { format } from 'date-fns';
import { ReceiptGenerator } from './ReceiptGenerator';
import jsPDF from 'jspdf';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface ChildAccount {
  id: string;
  name: string;
  admission_no: string;
  class_name: string;
  total_due: number;
  concession_amount: number;
}

export const EnhancedParentPortal: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notifications' | 'children'>('overview');
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      loadTransactions(selectedChild);
    }
  }, [selectedChild]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name, admission_no, class:classes(class_name), concession_amount')
        .eq('parent_user_id', user?.id);

      if (studentsData && studentsData.length > 0) {
        const childrenWithDues = await Promise.all(
          studentsData.map(async (student) => {
            const { data: feeDetails } = await db.getStudentFeeDetails(student.id);
            const totalDue = feeDetails?.quarters.reduce((sum, q) => sum + q.balance, 0) || 0;

            return {
              id: student.id,
              name: student.name,
              admission_no: student.admission_no,
              class_name: student.class?.class_name || '',
              total_due: totalDue,
              concession_amount: student.concession_amount || 0
            };
          })
        );

        setChildren(childrenWithDues);
        if (childrenWithDues.length > 0) {
          setSelectedChild(childrenWithDues[0].id);
        }
      }

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notificationsData) {
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error', 'Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (studentId: string) => {
    try {
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          quarter:quarters(quarter_name, academic_year)
        `)
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (transactionsData) {
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewReceipt = async (transaction: any) => {
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
      showError('Error', 'Failed to load receipt');
    }
  };

  const downloadStatement = async () => {
    if (!selectedChild) return;

    try {
      const child = children.find(c => c.id === selectedChild);
      if (!child) return;

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('J.R. Preparatory School', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Puranpur, Uttar Pradesh - 262122', 105, 27, { align: 'center' });

      doc.setFontSize(14);
      doc.text('Fee Payment Statement', 105, 40, { align: 'center' });

      doc.setFontSize(11);
      doc.text(`Student Name: ${child.name}`, 20, 55);
      doc.text(`Admission No: ${child.admission_no}`, 20, 62);
      doc.text(`Class: ${child.class_name}`, 20, 69);
      doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, 20, 76);

      doc.setFontSize(12);
      doc.text('Payment History', 20, 90);

      let yPos = 100;
      doc.setFontSize(10);
      doc.text('Date', 20, yPos);
      doc.text('Receipt No', 55, yPos);
      doc.text('Quarter', 100, yPos);
      doc.text('Amount', 150, yPos);

      yPos += 7;
      doc.line(20, yPos, 190, yPos);
      yPos += 5;

      transactions.forEach((txn) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(format(new Date(txn.payment_date), 'dd MMM yyyy'), 20, yPos);
        doc.text(txn.receipt_no, 55, yPos);
        doc.text(txn.quarter?.quarter_name || '', 100, yPos);
        doc.text(`₹${txn.amount_paid.toLocaleString()}`, 150, yPos);
        yPos += 7;
      });

      const totalPaid = transactions.reduce((sum, t) => sum + t.amount_paid, 0);
      yPos += 5;
      doc.line(20, yPos, 190, yPos);
      yPos += 7;
      doc.setFontSize(11);
      doc.text('Total Paid:', 130, yPos);
      doc.text(`₹${totalPaid.toLocaleString()}`, 150, yPos);

      if (child.total_due > 0) {
        yPos += 7;
        doc.text('Balance Due:', 130, yPos);
        doc.text(`₹${child.total_due.toLocaleString()}`, 150, yPos);
      }

      doc.save(`Fee_Statement_${child.admission_no}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      showSuccess('Success', 'Statement downloaded successfully');
    } catch (error) {
      console.error('Error generating statement:', error);
      showError('Error', 'Failed to download statement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const selectedChildData = children.find(c => c.id === selectedChild);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Parent Portal</h2>
        <p className="text-gray-600">Manage your children's fee payments and notifications</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Payment History</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 relative ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {children.length > 1 && (
              <button
                onClick={() => setActiveTab('children')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'children'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>My Children ({children.length})</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {children.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name} - {child.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedChildData && (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedChildData.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Admission No</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedChildData.admission_no}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Class</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedChildData.class_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Due</p>
                        <p className="text-xl font-bold text-red-600">₹{selectedChildData.total_due.toLocaleString()}</p>
                      </div>
                      {selectedChildData.concession_amount > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Concession</p>
                          <p className="text-xl font-bold text-green-600">₹{selectedChildData.concession_amount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={downloadStatement}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Statement</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment History ({transactions.length})
                </h3>
                <button
                  onClick={downloadStatement}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Statement</span>
                </button>
              </div>

              {children.length > 1 && (
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name} - {child.class_name}
                    </option>
                  ))}
                </select>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm font-medium text-gray-600 border-b">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Receipt No</th>
                      <th className="pb-3">Quarter</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Mode</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="text-sm">
                        <td className="py-3">
                          {format(new Date(transaction.payment_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 font-medium text-blue-600">
                          {transaction.receipt_no}
                        </td>
                        <td className="py-3">{transaction.quarter?.quarter_name}</td>
                        <td className="py-3 font-semibold">
                          ₹{transaction.amount_paid.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                            transaction.payment_mode === 'online'
                              ? 'bg-blue-100 text-blue-700'
                              : transaction.payment_mode === 'upi'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {transaction.payment_mode}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleViewReceipt(transaction)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications ({unreadCount} unread)
              </h3>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => !notification.read && markNotificationRead(notification.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        notification.read
                          ? 'bg-white border-gray-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {notification.type === 'alert' && (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            )}
                            {notification.type === 'reminder' && (
                              <Bell className="w-4 h-4 text-blue-600" />
                            )}
                            {notification.type === 'success' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(notification.created_at), 'MMM dd, yyyy hh:mm a')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Children Tab */}
          {activeTab === 'children' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                My Children ({children.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => (
                  <div key={child.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{child.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">Admission No: {child.admission_no}</p>
                        <p className="text-sm text-gray-600">Class: {child.class_name}</p>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Balance Due:</span>
                            <span className={`text-lg font-bold ${
                              child.total_due > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ₹{child.total_due.toLocaleString()}
                            </span>
                          </div>
                          {child.concession_amount > 0 && (
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-600">Concession:</span>
                              <span className="text-sm font-medium text-green-600">
                                ₹{child.concession_amount.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedChild(child.id);
                            setActiveTab('overview');
                          }}
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Generator */}
      {showReceipt && receiptData && (
        <ReceiptGenerator
          receiptData={receiptData}
          onClose={() => setShowReceipt(false)}
          isParentView={true}
        />
      )}
    </div>
  );
};

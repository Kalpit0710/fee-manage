import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Download, 
  Filter,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  FileText,
  BarChart3,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Transaction, Student, Class, Quarter } from '../types';
import { db } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  classId: string;
  quarterId: string;
  paymentMode: string;
}

interface ReportData {
  totalCollected: number;
  totalTransactions: number;
  pendingAmount: number;
  defaultersCount: number;
  classWiseCollection: Array<{
    className: string;
    collected: number;
    expected: number;
    percentage: number;
  }>;
  quarterWiseCollection: Array<{
    quarterName: string;
    collected: number;
    expected: number;
    percentage: number;
  }>;
  paymentModeBreakdown: Array<{
    mode: string;
    count: number;
    amount: number;
  }>;
  recentTransactions: Transaction[];
}

export const Reports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'defaulters'>(
    (searchParams.get('tab') as 'overview' | 'transactions' | 'defaulters') || 'overview'
  );
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: searchParams.get('dateFrom') || format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    dateTo: searchParams.get('dateTo') || format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    classId: searchParams.get('classId') || '',
    quarterId: searchParams.get('quarterId') || '',
    paymentMode: searchParams.get('paymentMode') || ''
  });

  const updateURL = (updates: Partial<{ tab: string } & ReportFilters>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    setSearchParams(newSearchParams);
  };

  const handleTabChange = (tab: 'overview' | 'transactions' | 'defaulters') => {
    setActiveTab(tab);
    updateURL({ tab });
  };

  const handleFilterChange = (filterUpdates: Partial<ReportFilters>) => {
    const newFilters = { ...filters, ...filterUpdates };
    setFilters(newFilters);
    updateURL(newFilters);
  };
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (classes.length > 0 && quarters.length > 0) {
      generateReport();
    }
  }, [filters, classes, quarters]);

  const loadInitialData = async () => {
    setLoading(true);
    
    const [studentsResult, classesResult, quartersResult] = await Promise.all([
      db.getStudents(),
      db.getClasses(),
      db.getQuarters()
    ]);
    
    if (studentsResult.data) setStudents(studentsResult.data);
    if (classesResult.data) setClasses(classesResult.data);
    if (quartersResult.data) setQuarters(quartersResult.data);
    
    setLoading(false);
  };

  const generateReport = async () => {
    setLoading(true);
    
    try {
      const { data: transactionsData } = await db.getTransactions({
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        ...(filters.classId && { class_id: filters.classId }),
        ...(filters.quarterId && { quarter_id: filters.quarterId })
      });

      const filteredTransactions = transactionsData?.filter(t => 
        !filters.paymentMode || t.payment_mode === filters.paymentMode
      ) || [];

      setTransactions(filteredTransactions);

      // Calculate report metrics
      const totalCollected = filteredTransactions.reduce((sum, t) => sum + t.amount_paid, 0);
      const totalTransactions = filteredTransactions.length;

      // Class-wise collection
      const classWiseCollection = classes.map(cls => {
        const classTransactions = filteredTransactions.filter(t => 
          t.student?.class_id === cls.id
        );
        const collected = classTransactions.reduce((sum, t) => sum + t.amount_paid, 0);
        const classStudents = students.filter(s => s.class_id === cls.id);
        const expected = classStudents.length * cls.quarterly_fee * quarters.length;
        
        return {
          className: cls.class_name,
          collected,
          expected,
          percentage: expected > 0 ? (collected / expected) * 100 : 0
        };
      });

      // Quarter-wise collection
      const quarterWiseCollection = quarters.map(quarter => {
        const quarterTransactions = filteredTransactions.filter(t => 
          t.quarter_id === quarter.id
        );
        const collected = quarterTransactions.reduce((sum, t) => sum + t.amount_paid, 0);
        const expected = students.length * 5000; // Assuming average fee
        
        return {
          quarterName: quarter.quarter_name,
          collected,
          expected,
          percentage: expected > 0 ? (collected / expected) * 100 : 0
        };
      });

      // Payment mode breakdown
      const paymentModes = ['cash', 'upi', 'cheque', 'online'];
      const paymentModeBreakdown = paymentModes.map(mode => {
        const modeTransactions = filteredTransactions.filter(t => t.payment_mode === mode);
        return {
          mode: mode.toUpperCase(),
          count: modeTransactions.length,
          amount: modeTransactions.reduce((sum, t) => sum + t.amount_paid, 0)
        };
      });

      setReportData({
        totalCollected,
        totalTransactions,
        pendingAmount: 0, // Would need complex calculation
        defaultersCount: 0, // Would need complex calculation
        classWiseCollection,
        quarterWiseCollection,
        paymentModeBreakdown,
        recentTransactions: filteredTransactions.slice(0, 10)
      });

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!transactions.length) return;

    const headers = ['Date', 'Receipt No', 'Student', 'Class', 'Quarter', 'Amount', 'Mode', 'Reference'];
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
        t.payment_reference || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'defaulters', label: 'Defaulters', icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive fee collection reports and insights</p>
        </div>
        
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filters.classId}
              onChange={(e) => handleFilterChange({ classId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
            <select
              value={filters.quarterId}
              onChange={(e) => handleFilterChange({ quarterId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Quarters</option>
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>{quarter.quarter_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={filters.paymentMode}
              onChange={(e) => handleFilterChange({ paymentMode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && reportData && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Total Collected</p>
                          <p className="text-2xl font-bold text-blue-900">
                            ₹{reportData.totalCollected.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Transactions</p>
                          <p className="text-2xl font-bold text-green-900">
                            {reportData.totalTransactions}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-orange-600">Pending Amount</p>
                          <p className="text-2xl font-bold text-orange-900">
                            ₹{reportData.pendingAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-6">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-red-600">Defaulters</p>
                          <p className="text-2xl font-bold text-red-900">
                            {reportData.defaultersCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Class-wise Collection */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Class-wise Collection</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm font-medium text-gray-600 border-b">
                            <th className="pb-3">Class</th>
                            <th className="pb-3">Collected</th>
                            <th className="pb-3">Expected</th>
                            <th className="pb-3">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reportData.classWiseCollection.map((item, index) => (
                            <tr key={index}>
                              <td className="py-3 font-medium">{item.className}</td>
                              <td className="py-3">₹{item.collected.toLocaleString()}</td>
                              <td className="py-3">₹{item.expected.toLocaleString()}</td>
                              <td className="py-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {item.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment Mode Breakdown */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Mode Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {reportData.paymentModeBreakdown.map((item, index) => (
                        <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">{item.mode}</p>
                          <p className="text-xl font-bold text-gray-900">{item.count}</p>
                          <p className="text-sm text-gray-500">₹{item.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Transaction History ({transactions.length})
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm font-medium text-gray-600 border-b">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Receipt No</th>
                          <th className="pb-3">Student</th>
                          <th className="pb-3">Class</th>
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
                            <td className="py-3">{transaction.student?.name}</td>
                            <td className="py-3">{transaction.student?.class?.class_name}</td>
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
                              <button className="text-blue-600 hover:text-blue-700 p-1">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'defaulters' && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Defaulters Report</h3>
                  <p className="text-gray-500">
                    This feature requires complex calculations and will be implemented in the next phase.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
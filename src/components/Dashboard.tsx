import React, { useEffect, useState } from 'react';
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Smartphone,
  Calendar,
  FileText
} from 'lucide-react';
import { DashboardStats } from '../types';
import { db } from '../lib/supabase';
import { format } from 'date-fns';
import { cache } from '../utils/cache';
import { CardLoading, InlineLoader } from './LoadingStates';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const cacheKey = 'dashboard_stats';
    const cachedData = cache.get<DashboardStats>(cacheKey);

    if (cachedData) {
      setStats(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await db.getDashboardStats();
      setStats(data);
      if (data) {
        cache.set(cacheKey, data, 2 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        total_students: 0,
        total_collected: 0,
        pending_amount: 0,
        late_fees_collected: 0,
        online_payments: 0,
        offline_payments: 0,
        collections_by_quarter: [],
        collections_by_class: [],
        recent_transactions: []
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardLoading count={4} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" />
        </div>
        <InlineLoader message="Loading dashboard data..." />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Collected',
      value: `₹${(stats?.total_collected || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Pending Amount',
      value: `₹${(stats?.pending_amount || 0).toLocaleString()}`,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Late Fees',
      value: `₹${(stats?.late_fees_collected || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Overview of fee collection and student data</p>
        </div>
        <div className="text-sm text-gray-600">
          Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-xl p-6 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Method Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Online Payments</span>
              </div>
              <span className="font-bold text-blue-600">
                {stats?.online_payments || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span className="font-medium">Offline Payments</span>
              </div>
              <span className="font-bold text-green-600">
                {stats?.offline_payments || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Calendar className="w-5 h-5 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Collect Fee</p>
              <p className="text-xs text-gray-600">Process payment</p>
            </button>
            <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <Users className="w-5 h-5 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Add Student</p>
              <p className="text-xs text-gray-600">Register new student</p>
            </button>
            <button className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <FileText className="w-5 h-5 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Generate Report</p>
              <p className="text-xs text-gray-600">Export data</p>
            </button>
            <button className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />
              <p className="font-medium text-gray-900">Defaulters</p>
              <p className="text-xs text-gray-600">View pending fees</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="p-6">
          {stats?.recent_transactions?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="pb-3">Receipt No</th>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Mode</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats?.recent_transactions?.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="text-sm">
                      <td className="py-3 font-medium">{transaction.receipt_no}</td>
                      <td className="py-3">{transaction.student?.name}</td>
                      <td className="py-3 font-semibold">₹{transaction.amount_paid.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          transaction.payment_mode === 'online' 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {transaction.payment_mode}
                        </span>
                      </td>
                      <td className="py-3">
                        {format(new Date(transaction.payment_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
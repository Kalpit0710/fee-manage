import React, { useState, useEffect } from 'react';
import { Send, Users, Mail, MessageSquare, Filter, AlertCircle } from 'lucide-react';
import { db, supabase } from '../lib/supabase';
import { useNotification } from './NotificationSystem';
import { Class, Quarter } from '../types';

export const BulkMessaging: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  const [classes, setClasses] = useState<Class[]>([]);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [messageType, setMessageType] = useState<'reminder' | 'overdue'>('reminder');
  const [defaultersOnly, setDefaultersOnly] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [classesResult, quartersResult] = await Promise.all([
      db.getClasses(),
      db.getQuarters()
    ]);

    if (classesResult.data) setClasses(classesResult.data);
    if (quartersResult.data) setQuarters(quartersResult.data);
  };

  const handleSendBulkReminders = async () => {
    setSending(true);
    setResults(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-bulk-reminders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quarterId: selectedQuarter || undefined,
            classId: selectedClass || undefined,
            defaultersOnly,
            reminderType: messageType
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        showSuccess(
          'Reminders Sent',
          `${data.results.sent} reminders sent successfully, ${data.results.skipped} skipped, ${data.results.errors} errors`
        );
      } else {
        throw new Error(data.error || 'Failed to send reminders');
      }
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
      showError('Error', 'Failed to send bulk reminders. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bulk Messaging</h2>
        <p className="text-gray-600">Send payment reminders to multiple parents</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Type
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as 'reminder' | 'overdue')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="reminder">Payment Reminder</option>
                <option value="overdue">Overdue Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
              </label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Current Quarter</option>
                {quarters.map((quarter) => (
                  <option key={quarter.id} value={quarter.id}>
                    {quarter.quarter_name} - {quarter.academic_year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class (Optional)
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients
              </label>
              <select
                value={defaultersOnly ? 'defaulters' : 'all'}
                onChange={(e) => setDefaultersOnly(e.target.value === 'defaulters')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="defaulters">Only Defaulters</option>
                <option value="all">All Students</option>
              </select>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What will be sent:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>In-app notification to parent portal</li>
                  <li>Email notification (if configured)</li>
                  <li>Only sent to parents with balance due (if defaulters only selected)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {messageType === 'reminder' ? 'Payment reminder' : 'Overdue notice'} will be sent
            {selectedClass && ` to ${classes.find(c => c.id === selectedClass)?.class_name}`}
          </div>
          <button
            onClick={handleSendBulkReminders}
            disabled={sending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Reminders</span>
              </>
            )}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{results.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Sent</p>
              <p className="text-2xl font-bold text-green-900">{results.sent}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-600">Skipped</p>
              <p className="text-2xl font-bold text-yellow-900">{results.skipped}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600">Errors</p>
              <p className="text-2xl font-bold text-red-900">{results.errors}</p>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="font-medium text-gray-900">Details</h4>
            {results.details.map((detail: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  detail.status === 'sent'
                    ? 'bg-green-50 text-green-800'
                    : detail.status === 'error'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-yellow-50 text-yellow-800'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{detail.student}</span>
                  <span className="capitalize">{detail.status}</span>
                </div>
                {detail.balanceDue && (
                  <p className="text-xs mt-1">Balance: ₹{detail.balanceDue.toLocaleString()}</p>
                )}
                {detail.reason && (
                  <p className="text-xs mt-1">{detail.reason}</p>
                )}
                {detail.error && (
                  <p className="text-xs mt-1">Error: {detail.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

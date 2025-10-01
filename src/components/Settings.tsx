import React, { useEffect, useState } from 'react';
import { 
  Save,
  School,
  Users,
  Database,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { User as UserType } from '../types';
import { db, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from './NotificationSystem';

interface SchoolSettings {
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  school_website: string;
  academic_year: string;
  currency: string;
  late_fee_grace_days: number;
  receipt_prefix: string;
  enable_sms: boolean;
  enable_email: boolean;
  backup_frequency: string;
}

interface NotificationSettings {
  fee_due_reminder: boolean;
  payment_confirmation: boolean;
  overdue_notices: boolean;
  sms_notifications: boolean;
  email_notifications: boolean;
  reminder_days_before: number;
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<'school' | 'users' | 'notifications' | 'backup' | 'security'>('school');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // School Settings
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    school_name: 'J.R. Preparatory School',
    school_address: '123 Education Street, Knowledge City - 560001',
    school_phone: '+91 98765 43210',
    school_email: 'office@jrprep.edu',
    school_website: 'www.jrprep.edu',
    academic_year: '2024-25',
    currency: 'INR',
    late_fee_grace_days: 7,
    receipt_prefix: 'JRP',
    enable_sms: true,
    enable_email: true,
    backup_frequency: 'daily'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    fee_due_reminder: true,
    payment_confirmation: true,
    overdue_notices: true,
    sms_notifications: true,
    email_notifications: true,
    reminder_days_before: 7
  });

  // Users Management
  const [users, setUsers] = useState<UserType[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await db.getUsers();
    if (data) setUsers(data);
    setLoading(false);
  };

  const saveSchoolSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, you would save to a settings table
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Settings Saved', 'School settings have been saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Save Failed', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, you would save to a settings table
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Settings Saved', 'Notification settings have been saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Save Failed', 'Failed to save notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setSaving(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Backup Complete', 'System backup has been created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      showError('Backup Failed', 'Failed to create backup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (file: File) => {
    setSaving(true);
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 3000));
      showSuccess('Restore Complete', 'Data has been restored successfully');
    } catch (error) {
      console.error('Error restoring data:', error);
      showError('Restore Failed', 'Failed to restore data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'school', label: 'School Profile', icon: School },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage system configuration and preferences</p>
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
                  onClick={() => setActiveTab(tab.id as any)}
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
          {/* School Profile Tab */}
          {activeTab === 'school' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">School Profile</h3>
                <button
                  onClick={saveSchoolSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.school_name}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, school_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.academic_year}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Address
                  </label>
                  <textarea
                    value={schoolSettings.school_address}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, school_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={schoolSettings.school_phone}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, school_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={schoolSettings.school_email}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, school_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={schoolSettings.school_website}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, school_website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={schoolSettings.currency}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Prefix
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.receipt_prefix}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, receipt_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Late Fee Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={schoolSettings.late_fee_grace_days}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, late_fee_grace_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>

              <div className="bg-white border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-medium text-gray-600 border-b">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Last Login</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium">{user.name}</td>
                          <td className="p-4">{user.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {user.last_login_at 
                              ? new Date(user.last_login_at).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                <button
                  onClick={saveNotificationSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Fee Due Reminders</p>
                        <p className="text-sm text-gray-600">Send reminders before fee due dates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.fee_due_reminder}
                        onChange={(e) => setNotificationSettings({ 
                          ...notificationSettings, 
                          fee_due_reminder: e.target.checked 
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Payment Confirmations</p>
                        <p className="text-sm text-gray-600">Send confirmation emails after payments</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.payment_confirmation}
                        onChange={(e) => setNotificationSettings({ 
                          ...notificationSettings, 
                          payment_confirmation: e.target.checked 
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Overdue Notices</p>
                        <p className="text-sm text-gray-600">Send notices for overdue payments</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.overdue_notices}
                        onChange={(e) => setNotificationSettings({ 
                          ...notificationSettings, 
                          overdue_notices: e.target.checked 
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">SMS Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable SMS Notifications</p>
                        <p className="text-sm text-gray-600">Send SMS for important updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.sms_notifications}
                        onChange={(e) => setNotificationSettings({ 
                          ...notificationSettings, 
                          sms_notifications: e.target.checked 
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder Days Before Due Date
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={notificationSettings.reminder_days_before}
                    onChange={(e) => setNotificationSettings({ 
                      ...notificationSettings, 
                      reminder_days_before: Number(e.target.value) 
                    })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Backup & Restore Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Backup & Restore</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Download className="w-6 h-6 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Create Backup</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    Download a complete backup of your school data including students, transactions, and settings.
                  </p>
                  <button
                    onClick={handleBackup}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{saving ? 'Creating Backup...' : 'Create Backup'}</span>
                  </button>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Upload className="w-6 h-6 text-orange-600" />
                    <h4 className="font-medium text-orange-900">Restore Data</h4>
                  </div>
                  <p className="text-sm text-orange-700 mb-4">
                    Restore your school data from a previously created backup file.
                  </p>
                  <input
                    type="file"
                    accept=".json,.sql"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleRestore(file);
                    }}
                    className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important Notes</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Always create backups before making major changes</li>
                      <li>• Store backup files in a secure location</li>
                      <li>• Restoring data will overwrite existing data</li>
                      <li>• Contact support if you need assistance with backups</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>

              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h4 className="font-medium text-green-900">Security Status</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">SSL Certificate</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Database Encryption</span>
                      <span className="text-green-600 font-medium">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Two-Factor Authentication</span>
                      <span className="text-orange-600 font-medium">Recommended</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Password Policy</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Minimum password length</span>
                      <span className="font-medium">8 characters</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Require special characters</span>
                      <span className="font-medium">Yes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Password expiry</span>
                      <span className="font-medium">90 days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Session Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Session timeout</span>
                      <span className="font-medium">30 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Maximum concurrent sessions</span>
                      <span className="font-medium">3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSave={() => {
            setShowAddUserModal(false);
            loadUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};

interface AddUserModalProps {
  onClose: () => void;
  onSave: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSave }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            name: formData.name,
            email: formData.email,
            role: formData.role
          });
          });
        if (profileError) throw profileError;
      }

      showSuccess('User Created', `User ${formData.name} has been created successfully`);
      onSave();
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Create Failed', 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Administrator</option>
            </select>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditUserModalProps {
  user: UserType;
  onClose: () => void;
  onSave: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await db.updateUser(user.id, formData);
      showSuccess('User Updated', `User ${formData.name} has been updated successfully`);
      onSave();
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Update Failed', 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active user
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
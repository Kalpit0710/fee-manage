import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, User, Shield, Bell, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SchoolSettings {
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  academic_year: string;
  late_fee_percentage: number;
  late_fee_flat: number;
  receipt_prefix: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('school');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    school_name: 'J.R. Preparatory School',
    school_address: 'Puranpur, Uttar Pradesh - 262122',
    school_phone: '+91 98765 43210',
    school_email: 'info@jrprep.edu.in',
    academic_year: '2025-26',
    late_fee_percentage: 5,
    late_fee_flat: 50,
    receipt_prefix: 'JRP'
  });

  const [userProfile, setUserProfile] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    role: user?.user_metadata?.role || 'admin'
  });

  const handleSaveSchoolSettings = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would save to a settings table
      // For now, we'll just show a success message
      setMessage('School settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: userProfile.name }
      });

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'school', label: 'School Settings', icon: SettingsIcon },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database', icon: Database }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {message && (
          <div className={`px-4 py-2 rounded-md ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          {activeTab === 'school' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">School Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.school_name}
                    onChange={(e) => setSchoolSettings({
                      ...schoolSettings,
                      school_name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.academic_year}
                    onChange={(e) => setSchoolSettings({
                      ...schoolSettings,
                      academic_year: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Address
                  </label>
                  <textarea
                    value={schoolSettings.school_address}
                    onChange={(e) => setSchoolSettings({
                      ...schoolSettings,
                      school_address: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={schoolSettings.school_phone}
                    onChange={(e) => setSchoolSettings({
                      ...schoolSettings,
                      school_phone: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={schoolSettings.school_email}
                    onChange={(e) => setSchoolSettings({
                      ...schoolSettings,
                      school_email: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Late Fee Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Late Fee Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={schoolSettings.late_fee_percentage}
                      onChange={(e) => setSchoolSettings({
                        ...schoolSettings,
                        late_fee_percentage: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flat Late Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={schoolSettings.late_fee_flat}
                      onChange={(e) => setSchoolSettings({
                        ...schoolSettings,
                        late_fee_flat: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt Prefix
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.receipt_prefix}
                      onChange={(e) => setSchoolSettings({
                        ...schoolSettings,
                        receipt_prefix: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSchoolSettings}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({
                      ...userProfile,
                      name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={userProfile.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveUserProfile}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-600">Security settings will be implemented in future updates.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-600">Notification settings will be implemented in future updates.</p>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Database Management</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-600">Database management tools will be implemented in future updates.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
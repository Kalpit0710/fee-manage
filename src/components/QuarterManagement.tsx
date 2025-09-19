import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { Quarter } from '../types';
import { db } from '../lib/supabase';
import { format } from 'date-fns';

export const QuarterManagement: React.FC = () => {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuarter, setEditingQuarter] = useState<Quarter | null>(null);
  const [selectedYear, setSelectedYear] = useState('2024-25');

  useEffect(() => {
    loadQuarters();
  }, [selectedYear]);

  const loadQuarters = async () => {
    setLoading(true);
    const { data } = await db.getQuarters(selectedYear);
    if (data) setQuarters(data);
    setLoading(false);
  };

  const handleAddQuarter = () => {
    setEditingQuarter(null);
    setShowAddModal(true);
  };

  const handleEditQuarter = (quarter: Quarter) => {
    setEditingQuarter(quarter);
    setShowAddModal(true);
  };

  const handleDeleteQuarter = async (quarter: Quarter) => {
    if (window.confirm(`Are you sure you want to delete ${quarter.quarter_name}?`)) {
      await db.deleteQuarter(quarter.id);
      loadQuarters();
    }
  };

  const getQuarterStatus = (quarter: Quarter) => {
    const now = new Date();
    const startDate = new Date(quarter.start_date);
    const endDate = new Date(quarter.end_date);
    const dueDate = new Date(quarter.due_date);

    if (now < startDate) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'Upcoming' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'active', color: 'bg-green-100 text-green-800', label: 'Active' };
    } else if (now > endDate && now <= dueDate) {
      return { status: 'grace', color: 'bg-orange-100 text-orange-800', label: 'Grace Period' };
    } else {
      return { status: 'overdue', color: 'bg-red-100 text-red-800', label: 'Overdue' };
    }
  };

  const academicYears = ['2023-24', '2024-25', '2025-26', '2026-27'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quarter Management</h2>
          <p className="text-gray-600">Manage academic quarters and fee collection periods</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <button
            onClick={handleAddQuarter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Quarter</span>
          </button>
        </div>
      </div>

      {/* Quarters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : quarters.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quarters found</h3>
            <p className="text-gray-500 mb-4">Set up quarters for {selectedYear}</p>
            <button
              onClick={handleAddQuarter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Quarter
            </button>
          </div>
        ) : (
          quarters.map((quarter) => {
            const status = getQuarterStatus(quarter);
            return (
              <div key={quarter.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{quarter.quarter_name}</h3>
                      <p className="text-sm text-gray-600">{quarter.academic_year}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditQuarter(quarter)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Quarter"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuarter(quarter)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Quarter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{format(new Date(quarter.start_date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{format(new Date(quarter.end_date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium text-red-600">{format(new Date(quarter.due_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Quarter Modal */}
      {showAddModal && (
        <QuarterModal
          quarter={editingQuarter}
          academicYear={selectedYear}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadQuarters();
          }}
        />
      )}
    </div>
  );
};

interface QuarterModalProps {
  quarter: Quarter | null;
  academicYear: string;
  onClose: () => void;
  onSave: () => void;
}

const QuarterModal: React.FC<QuarterModalProps> = ({
  quarter,
  academicYear,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    academic_year: quarter?.academic_year || academicYear,
    quarter_name: quarter?.quarter_name || '',
    start_date: quarter?.start_date || '',
    end_date: quarter?.end_date || '',
    due_date: quarter?.due_date || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (quarter) {
        await db.updateQuarter(quarter.id, formData);
      } else {
        await db.createQuarter(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving quarter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {quarter ? 'Edit Quarter' : 'Add Quarter'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <input
              type="text"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2024-25"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quarter Name
            </label>
            <select
              value={formData.quarter_name}
              onChange={(e) => setFormData({ ...formData, quarter_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Quarter</option>
              <option value="Q1">Q1 (First Quarter)</option>
              <option value="Q2">Q2 (Second Quarter)</option>
              <option value="Q3">Q3 (Third Quarter)</option>
              <option value="Q4">Q4 (Fourth Quarter)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, BookOpen, DollarSign, Save, X } from 'lucide-react';
import { Class } from '../types';
import { db } from '../lib/supabase';
import { useNotification } from './NotificationSystem';

export const ClassManagement: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    const { data } = await db.getClasses();
    if (data) setClasses(data);
    setLoading(false);
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setShowAddModal(true);
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setShowAddModal(true);
  };

  const handleDeleteClass = async (classItem: Class) => {
    if (window.confirm(`Are you sure you want to delete ${classItem.class_name}?`)) {
      try {
        await db.deleteClass(classItem.id);
        showSuccess('Class Deleted', `${classItem.class_name} has been successfully deleted`);
        loadClasses();
      } catch (error) {
        showError('Delete Failed', 'Failed to delete class. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600">Manage classes and their quarterly fee structures</p>
        </div>
        
        <button
          onClick={handleAddClass}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first class</p>
            <button
              onClick={handleAddClass}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Class
            </button>
          </div>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{classItem.class_name}</h3>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditClass(classItem)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Class"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Quarterly Fee</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    ₹{classItem.quarterly_fee.toLocaleString()}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500">
                  Created: {new Date(classItem.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Class Modal */}
      {showAddModal && (
        <ClassModal
          classItem={editingClass}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadClasses();
          }}
        />
      )}
    </div>
  );
};

interface ClassModalProps {
  classItem: Class | null;
  onClose: () => void;
  onSave: () => void;
}

const ClassModal: React.FC<ClassModalProps> = ({
  classItem,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    class_name: classItem?.class_name || '',
    quarterly_fee: classItem?.quarterly_fee || 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (classItem) {
        await db.updateClass(classItem.id, formData);
        showSuccess('Class Updated', `${formData.class_name} has been successfully updated`);
      } else {
        await db.createClass(formData);
        showSuccess('Class Added', `${formData.class_name} has been successfully added`);
      }
      onSave();
    } catch (error) {
      console.error('Error saving class:', error);
      showError('Save Failed', 'Failed to save class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {classItem ? 'Edit Class' : 'Add Class'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name
            </label>
            <input
              type="text"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Class 1, Class 2, Nursery"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quarterly Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.quarterly_fee}
              onChange={(e) => setFormData({ ...formData, quarterly_fee: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quarterly fee amount"
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
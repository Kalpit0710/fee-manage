import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Save,
  X,
  Copy,
  BookOpen,
  Calendar
} from 'lucide-react';
import { FeeStructure, Class, Quarter } from '../types';
import { db } from '../lib/supabase';
import { format } from 'date-fns';

export const FeeStructureManagement: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedQuarter]);

  const loadData = async () => {
    setLoading(true);
    
    const [structuresResult, classesResult, quartersResult] = await Promise.all([
      db.getFeeStructures({ 
        class_id: selectedClass || undefined,
        quarter_id: selectedQuarter || undefined 
      }),
      db.getClasses(),
      db.getQuarters()
    ]);
    
    if (structuresResult.data) setFeeStructures(structuresResult.data);
    if (classesResult.data) setClasses(classesResult.data);
    if (quartersResult.data) setQuarters(quartersResult.data);
    
    setLoading(false);
  };

  const handleAddStructure = () => {
    setEditingStructure(null);
    setShowAddModal(true);
  };

  const handleEditStructure = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setShowAddModal(true);
  };

  const handleDeleteStructure = async (structure: FeeStructure) => {
    if (window.confirm(`Are you sure you want to delete this fee structure?`)) {
      await db.deleteFeeStructure(structure.id);
      loadData();
    }
  };

  const handleCopyStructure = (structure: FeeStructure) => {
    setEditingStructure({
      ...structure,
      id: '',
      created_at: '',
      updated_at: ''
    });
    setShowAddModal(true);
  };

  const clearFilters = () => {
    setSelectedClass('');
    setSelectedQuarter('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fee Structure Management</h2>
          <p className="text-gray-600">Define and manage fee structures for classes and quarters</p>
        </div>
        
        <button
          onClick={handleAddStructure}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fee Structure</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          
          <div className="sm:w-48">
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
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
          
          {(selectedClass || selectedQuarter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Fee Structures Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : feeStructures.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fee structures found</h3>
            <p className="text-gray-500 mb-4">Create fee structures for your classes and quarters</p>
            <button
              onClick={handleAddStructure}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Fee Structure
            </button>
          </div>
        ) : (
          feeStructures.map((structure) => (
            <div key={structure.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {structure.class?.class_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {structure.quarter?.quarter_name} ({structure.quarter?.academic_year})
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyStructure(structure)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy Structure"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditStructure(structure)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Structure"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStructure(structure)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Structure"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuition:</span>
                    <span className="font-medium">₹{structure.tuition_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transport:</span>
                    <span className="font-medium">₹{(structure.transport_fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activity:</span>
                    <span className="font-medium">₹{(structure.activity_fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Examination:</span>
                    <span className="font-medium">₹{(structure.examination_fee || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Fee:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{structure.total_fee.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Created: {format(new Date(structure.created_at), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <FeeStructureModal
          structure={editingStructure}
          classes={classes}
          quarters={quarters}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

interface FeeStructureModalProps {
  structure: FeeStructure | null;
  classes: Class[];
  quarters: Quarter[];
  onClose: () => void;
  onSave: () => void;
}

const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  structure,
  classes,
  quarters,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    class_id: structure?.class_id || '',
    quarter_id: structure?.quarter_id || '',
    tuition_fee: structure?.tuition_fee || 0,
    transport_fee: structure?.transport_fee || 0,
    activity_fee: structure?.activity_fee || 0,
    examination_fee: structure?.examination_fee || 0,
    other_fee: structure?.other_fee || 0,
  });
  const [loading, setLoading] = useState(false);

  const totalFee = formData.tuition_fee + formData.transport_fee + formData.activity_fee + 
                   formData.examination_fee + formData.other_fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const structureData = {
        ...formData,
        total_fee: totalFee
      };

      if (structure && structure.id) {
        await db.updateFeeStructure(structure.id, structureData);
      } else {
        await db.createFeeStructure(structureData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      alert('Error saving fee structure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {structure?.id ? 'Edit Fee Structure' : 'Add Fee Structure'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quarter
            </label>
            <select
              value={formData.quarter_id}
              onChange={(e) => setFormData({ ...formData, quarter_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Quarter</option>
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.quarter_name} ({quarter.academic_year})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tuition Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.tuition_fee}
                onChange={(e) => setFormData({ ...formData, tuition_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.transport_fee}
                onChange={(e) => setFormData({ ...formData, transport_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.activity_fee}
                onChange={(e) => setFormData({ ...formData, activity_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Examination Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.examination_fee}
                onChange={(e) => setFormData({ ...formData, examination_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.other_fee}
              onChange={(e) => setFormData({ ...formData, other_fee: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Fee:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{totalFee.toLocaleString()}
              </span>
            </div>
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
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Save,
  X,
  Users,
  BookOpen,
  Calendar,
  Filter
} from 'lucide-react';
import { ExtraCharge, Student, Class, Quarter } from '../types';
import { db } from '../lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export const ExtraChargeManagement: React.FC = () => {
  const { user } = useAuth();
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ExtraCharge | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedQuarter]);

  const loadData = async () => {
    setLoading(true);
    
    const [chargesResult, studentsResult, classesResult, quartersResult] = await Promise.all([
      db.getExtraCharges({ 
        class_id: selectedClass || undefined,
        quarter_id: selectedQuarter || undefined 
      }),
      db.getStudents(),
      db.getClasses(),
      db.getQuarters()
    ]);
    
    if (chargesResult.data) setExtraCharges(chargesResult.data);
    if (studentsResult.data) setStudents(studentsResult.data);
    if (classesResult.data) setClasses(classesResult.data);
    if (quartersResult.data) setQuarters(quartersResult.data);
    
    setLoading(false);
  };

  const handleAddCharge = () => {
    setEditingCharge(null);
    setShowAddModal(true);
  };

  const handleEditCharge = (charge: ExtraCharge) => {
    setEditingCharge(charge);
    setShowAddModal(true);
  };

  const handleDeleteCharge = async (charge: ExtraCharge) => {
    if (window.confirm(`Are you sure you want to delete "${charge.title}"?`)) {
      await db.deleteExtraCharge(charge.id);
      loadData();
    }
  };

  const clearFilters = () => {
    setSelectedClass('');
    setSelectedQuarter('');
  };

  const getChargeScope = (charge: ExtraCharge) => {
    if (charge.student_id) {
      return {
        type: 'Individual',
        target: charge.student?.name || 'Unknown Student',
        icon: Users,
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (charge.class_id) {
      return {
        type: 'Class-wide',
        target: charge.class?.class_name || 'Unknown Class',
        icon: BookOpen,
        color: 'bg-green-100 text-green-800'
      };
    } else {
      return {
        type: 'All Students',
        target: 'School-wide',
        icon: Users,
        color: 'bg-purple-100 text-purple-800'
      };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Extra Charge Management</h2>
          <p className="text-gray-600">Manage additional charges for students, classes, or quarters</p>
        </div>
        
        <button
          onClick={handleAddCharge}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Extra Charge</span>
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

      {/* Extra Charges List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Extra Charges ({extraCharges.length})
            </h3>
            
            {(selectedClass || selectedQuarter) && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>Filtered results</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="divide-y">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : extraCharges.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No extra charges found</h3>
              <p className="text-gray-500 mb-4">
                {selectedClass || selectedQuarter 
                  ? 'Try adjusting your filters'
                  : 'Create extra charges for specific students, classes, or quarters'
                }
              </p>
              {!selectedClass && !selectedQuarter && (
                <button
                  onClick={handleAddCharge}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Extra Charge
                </button>
              )}
            </div>
          ) : (
            extraCharges.map((charge) => {
              const scope = getChargeScope(charge);
              const ScopeIcon = scope.icon;
              
              return (
                <div key={charge.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{charge.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${scope.color}`}>
                          {scope.type}
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          ₹{charge.amount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <ScopeIcon className="w-4 h-4" />
                          <span>{scope.target}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{charge.quarter?.quarter_name} ({charge.quarter?.academic_year})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>Created: {format(new Date(charge.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      
                      {charge.description && (
                        <p className="mt-2 text-sm text-gray-600">{charge.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditCharge(charge)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Charge"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCharge(charge)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Charge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <ExtraChargeModal
          charge={editingCharge}
          students={students}
          classes={classes}
          quarters={quarters}
          currentUserId={user?.id}
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

interface ExtraChargeModalProps {
  charge: ExtraCharge | null;
  students: Student[];
  classes: Class[];
  quarters: Quarter[];
  currentUserId?: string;
  onClose: () => void;
  onSave: () => void;
}

const ExtraChargeModal: React.FC<ExtraChargeModalProps> = ({
  charge,
  students,
  classes,
  quarters,
  currentUserId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: charge?.title || '',
    description: charge?.description || '',
    amount: charge?.amount || 0,
    quarter_id: charge?.quarter_id || '',
    scope: charge?.student_id ? 'student' : charge?.class_id ? 'class' : 'all',
    student_id: charge?.student_id || '',
    class_id: charge?.class_id || '',
    is_mandatory: charge?.is_mandatory || true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const chargeData = {
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        quarter_id: formData.quarter_id,
        student_id: formData.scope === 'student' ? formData.student_id : null,
        class_id: formData.scope === 'class' ? formData.class_id : null,
        is_mandatory: formData.is_mandatory,
        created_by: currentUserId
      };

      if (charge?.id) {
        await db.updateExtraCharge(charge.id, chargeData);
      } else {
        await db.createExtraCharge(chargeData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving extra charge:', error);
      alert('Error saving extra charge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = formData.class_id 
    ? students.filter(s => s.class_id === formData.class_id)
    : students;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {charge?.id ? 'Edit Extra Charge' : 'Add Extra Charge'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Charge Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Exam Fee, Sports Fee, Trip Fee"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Additional details about this charge"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apply To
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ 
                ...formData, 
                scope: e.target.value,
                student_id: '',
                class_id: ''
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="all">All Students</option>
              <option value="class">Specific Class</option>
              <option value="student">Individual Student</option>
            </select>
          </div>
          
          {formData.scope === 'class' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class
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
          )}
          
          {formData.scope === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Class (Optional - to filter students)
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value, student_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Student
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Student</option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.admission_no})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_mandatory"
              checked={formData.is_mandatory}
              onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_mandatory" className="text-sm text-gray-700">
              Mandatory charge (cannot be waived)
            </label>
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
import React, { useEffect, useState } from 'react';
import { 
  Save,
  AlertTriangle,
  Calendar,
  DollarSign,
  Percent,
  Clock
} from 'lucide-react';
import { Quarter } from '../types';
import { db } from '../lib/supabase';

interface LateFeeConfig {
  quarter_id: string;
  late_fee_type: 'flat' | 'percentage';
  late_fee_amount: number;
  late_fee_percentage: number;
  grace_period_days: number;
  apply_daily: boolean;
  max_late_fee: number;
}

export const LateFeeConfiguration: React.FC = () => {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [configs, setConfigs] = useState<LateFeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2025-26');

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    
    const { data: quartersData } = await db.getQuarters(selectedYear);
    
    if (quartersData) {
      setQuarters(quartersData);
      
      // Initialize configs for each quarter
      const initialConfigs = quartersData.map(quarter => ({
        quarter_id: quarter.id,
        late_fee_type: 'flat' as const,
        late_fee_amount: quarter.late_fee_amount || 100,
        late_fee_percentage: quarter.late_fee_percentage || 5,
        grace_period_days: 7,
        apply_daily: false,
        max_late_fee: 1000
      }));
      
      setConfigs(initialConfigs);
    }
    
    setLoading(false);
  };

  const updateConfig = (quarterId: string, updates: Partial<LateFeeConfig>) => {
    setConfigs(prev => prev.map(config => 
      config.quarter_id === quarterId 
        ? { ...config, ...updates }
        : config
    ));
  };

  const saveConfigurations = async () => {
    setSaving(true);
    
    try {
      // Update each quarter with the late fee configuration
      for (const config of configs) {
        const quarter = quarters.find(q => q.id === config.quarter_id);
        if (quarter) {
          await db.updateQuarter(quarter.id, {
            late_fee_amount: config.late_fee_amount,
            late_fee_percentage: config.late_fee_percentage
          });
        }
      }
      
      alert('Late fee configurations saved successfully!');
    } catch (error) {
      console.error('Error saving configurations:', error);
      alert('Error saving configurations. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateSampleLateFee = (config: LateFeeConfig, baseFee: number = 5000, daysLate: number = 10) => {
    if (daysLate <= config.grace_period_days) return 0;
    
    const effectiveDays = daysLate - config.grace_period_days;
    let lateFee = 0;
    
    if (config.late_fee_type === 'flat') {
      lateFee = config.apply_daily ? config.late_fee_amount * effectiveDays : config.late_fee_amount;
    } else {
      const percentageFee = (baseFee * config.late_fee_percentage) / 100;
      lateFee = config.apply_daily ? percentageFee * effectiveDays : percentageFee;
    }
    
    return Math.min(lateFee, config.max_late_fee);
  };

  const academicYears = ['2024-25', '2025-26', '2026-27', '2027-28'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Late Fee Configuration</h2>
          <p className="text-gray-600">Configure automated late fee calculations for each quarter</p>
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
            onClick={saveConfigurations}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-orange-800">Important Notice</h3>
            <p className="text-sm text-orange-700 mt-1">
              Late fees are automatically calculated based on these configurations. Changes will affect all future fee calculations.
              Existing transactions will not be modified.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <p className="text-gray-500">Create quarters for {selectedYear} to configure late fees</p>
          </div>
        ) : (
          configs.map((config) => {
            const quarter = quarters.find(q => q.id === config.quarter_id);
            if (!quarter) return null;
            
            return (
              <div key={config.quarter_id} className="bg-white rounded-xl border p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{quarter.quarter_name}</h3>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(quarter.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Late Fee Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Late Fee Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateConfig(config.quarter_id, { late_fee_type: 'flat' })}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          config.late_fee_type === 'flat'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">Flat Amount</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Fixed amount per late payment</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => updateConfig(config.quarter_id, { late_fee_type: 'percentage' })}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          config.late_fee_type === 'percentage'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Percent className="w-4 h-4" />
                          <span className="font-medium">Percentage</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Percentage of base fee</p>
                      </button>
                    </div>
                  </div>
                  
                  {/* Late Fee Amount/Percentage */}
                  <div className="grid grid-cols-2 gap-4">
                    {config.late_fee_type === 'flat' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Late Fee Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={config.late_fee_amount}
                          onChange={(e) => updateConfig(config.quarter_id, { 
                            late_fee_amount: Number(e.target.value) 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Late Fee Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={config.late_fee_percentage}
                          onChange={(e) => updateConfig(config.quarter_id, { 
                            late_fee_percentage: Number(e.target.value) 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grace Period (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={config.grace_period_days}
                        onChange={(e) => updateConfig(config.quarter_id, { 
                          grace_period_days: Number(e.target.value) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Additional Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`daily-${config.quarter_id}`}
                        checked={config.apply_daily}
                        onChange={(e) => updateConfig(config.quarter_id, { 
                          apply_daily: e.target.checked 
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`daily-${config.quarter_id}`} className="text-sm text-gray-700">
                        Apply late fee daily (multiply by days overdue)
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Late Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={config.max_late_fee}
                        onChange={(e) => updateConfig(config.quarter_id, { 
                          max_late_fee: Number(e.target.value) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Sample Calculation */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Sample Calculation</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Base Fee: ₹5,000 | Days Late: 10</p>
                      <p className="font-medium text-gray-900">
                        Late Fee: ₹{calculateSampleLateFee(config).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Employee, SystemSettings, FieldConfig } from '../types';
import { UNIT_CODES } from '../constants';
import { getSystemSettings } from '../services/storageService';
import { Button } from './Button';
import { X, AlertTriangle } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: Employee, isNew: boolean) => void;
  initialData?: Employee | null;
  defaultUnitCode: string;
  allowUnitSelection?: boolean;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  defaultUnitCode,
  allowUnitSelection = false
}) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState<any>({}); // Using any to accommodate dynamic structure temporarily
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadedSettings = getSystemSettings();
      setSettings(loadedSettings);
      
      if (initialData) {
        // Flatten structure for the form: merge core fields and customFields
        setFormData({
          ...initialData,
          ...initialData.customFields
        });
      } else {
        // Initialize defaults based on settings
        const defaults: any = {
           unitCode: defaultUnitCode,
           status: loadedSettings.statuses[0] || 'Working',
           type: loadedSettings.employeeTypes[0] || 'Permanent',
           designation: loadedSettings.designations[0] || 'Driver',
           staffCategory: loadedSettings.staffCategories[0] || ''
        };
        // Trigger mapping for default designation
        if (defaults.designation && loadedSettings.designationMapping[defaults.designation]) {
           defaults.staffCategory = loadedSettings.designationMapping[defaults.designation];
        }
        setFormData(defaults);
      }
      setError(null);
    }
  }, [initialData, defaultUnitCode, isOpen]);

  // Auto-map Category when Designation Changes
  useEffect(() => {
    if (settings && formData.designation) {
      const mappedCategory = settings.designationMapping[formData.designation];
      if (mappedCategory) {
        setFormData((prev: any) => {
           // Only update if different to avoid infinite loop (though safe here)
           if (prev.staffCategory !== mappedCategory) {
             return { ...prev, staffCategory: mappedCategory };
           }
           return prev;
        });
      }
    }
  }, [formData.designation, settings]);

  if (!isOpen || !settings) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const missingRequired = settings.fieldConfigs
      .filter(f => f.enabled && f.required)
      .filter(f => !formData[f.key]);
      
    if (missingRequired.length > 0) {
      setError(`Missing required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setError(null);

    // Reconstruct the Employee object
    // Identify Core fields vs Custom Fields
    const coreKeys = ['id', 'name', 'unitCode', 'status', 'type', 'designation', 'phone', 'email', 'joinedDate'];
    
    const finalEmployee: any = {
       customFields: {}
    };

    // Process all form data
    Object.keys(formData).forEach(key => {
       if (coreKeys.includes(key)) {
         finalEmployee[key] = formData[key];
       } else {
         finalEmployee.customFields[key] = formData[key];
       }
    });
    
    // Ensure default joined date if enabled
    if (!finalEmployee.joinedDate && settings.fieldConfigs.find(f => f.key === 'joinedDate')?.enabled) {
        finalEmployee.joinedDate = new Date().toISOString().split('T')[0];
    }

    try {
      onSave(finalEmployee as Employee, !initialData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save employee.');
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    setError(null);
  };

  // Helper to render input based on config
  const renderField = (field: FieldConfig) => {
    // Special handling for Unit Code to respect the passed props
    if (field.key === 'unitCode') {
       if (allowUnitSelection) {
         return (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              value={formData.unitCode || ''}
              onChange={e => handleInputChange('unitCode', e.target.value)}
            >
              {UNIT_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         );
       } else {
         return (
            <input 
              type="text" 
              disabled 
              value={formData.unitCode || ''} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
         );
       }
    }

    // Special handling for ID (disable on edit)
    if (field.key === 'id') {
       return (
         <input
           type="text"
           required={field.required}
           disabled={!!initialData}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-500"
           value={formData[field.key] || ''}
           onChange={e => handleInputChange(field.key, e.target.value)}
           placeholder="e.g. 10234"
         />
       );
    }

    // Dropdowns
    if (field.type === 'select') {
      let options: string[] = field.options || [];
      if (field.listKey && settings[field.listKey]) {
        options = settings[field.listKey];
      }
      
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          value={formData[field.key] || ''}
          onChange={e => handleInputChange(field.key, e.target.value)}
          required={field.required}
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    // Standard Inputs
    return (
      <input
        type={field.type}
        required={field.required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
        value={formData[field.key] || ''}
        onChange={e => handleInputChange(field.key, e.target.value)}
      />
    );
  };

  const enabledFields = settings.fieldConfigs.filter(f => f.enabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Edit Employee Details' : 'Onboard New Staff'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start mb-4">
               <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
               {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enabledFields.map(field => (
              <div key={field.key} className={field.type === 'text' && field.key === 'name' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(field)}
                {field.key === 'id' && initialData && (
                  <p className="text-xs text-gray-400 mt-1">ID cannot be changed.</p>
                )}
                {field.key === 'staffCategory' && (
                  <p className="text-xs text-blue-500 mt-1">Auto-selected based on designation.</p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-6 flex justify-end space-x-3 border-t border-gray-100 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">
              {initialData ? 'Save Changes' : 'Onboard Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

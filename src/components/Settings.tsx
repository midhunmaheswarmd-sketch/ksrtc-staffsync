
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings as SettingsIcon, Layout, List, ToggleLeft, ToggleRight, Save, Lock, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { getSystemSettings, saveSystemSettings } from '../services/storageService';
import { SystemSettings, FieldConfig, FieldInputType } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'lists' | 'features'>('lists');
  
  // List Management State
  const [activeListTab, setActiveListTab] = useState<'designations' | 'types' | 'statuses' | 'categories'>('designations');
  const [newItem, setNewItem] = useState('');

  // Field Management State
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldInputType>('text');

  useEffect(() => {
    if (isOpen) {
      setSettings(getSystemSettings());
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  // --- List Handlers ---
  const getListKey = () => {
    switch (activeListTab) {
      case 'designations': return 'designations';
      case 'types': return 'employeeTypes';
      case 'statuses': return 'statuses';
      case 'categories': return 'staffCategories';
      default: return 'designations';
    }
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    const key = getListKey();
    
    if (settings[key].includes(newItem.trim())) {
      alert('Item already exists.');
      return;
    }

    const updated = {
      ...settings,
      [key]: [...settings[key], newItem.trim()]
    };
    setSettings(updated);
    saveSystemSettings(updated);
    setNewItem('');
  };

  const handleDeleteItem = (item: string) => {
    if (!window.confirm(`Delete "${item}"?`)) return;
    const key = getListKey();
    const updated = { ...settings, [key]: settings[key].filter(i => i !== item) };
    setSettings(updated);
    saveSystemSettings(updated);
  };

  const handleMappingChange = (designation: string, category: string) => {
    const updated = {
      ...settings,
      designationMapping: {
        ...settings.designationMapping,
        [designation]: category
      }
    };
    setSettings(updated);
    saveSystemSettings(updated);
  };

  // --- Field Handlers ---
  const handleToggleField = (key: string) => {
    const updatedFields = settings.fieldConfigs.map(f => {
      if (f.key === key) {
        if (f.isLocked) return f;
        return { ...f, enabled: !f.enabled };
      }
      return f;
    });
    const updated = { ...settings, fieldConfigs: updatedFields };
    setSettings(updated);
    saveSystemSettings(updated);
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel.toLowerCase().replace(/\s+/g, '_');
    
    if (settings.fieldConfigs.some(f => f.key === key)) {
      alert('A field with this name already exists.');
      return;
    }

    const newField: FieldConfig = {
      key,
      label: newFieldLabel,
      type: newFieldType,
      required: false,
      enabled: true,
      isSystem: false,
      isLocked: false
    };

    const updated = {
      ...settings,
      fieldConfigs: [...settings.fieldConfigs, newField]
    };
    setSettings(updated);
    saveSystemSettings(updated);
    setNewFieldLabel('');
  };

  const handleDeleteField = (key: string) => {
    if (!window.confirm("Permanently delete this field? Data stored in this field for existing employees might be lost if you re-save them.")) return;
    const updated = {
      ...settings,
      fieldConfigs: settings.fieldConfigs.filter(f => f.key !== key)
    };
    setSettings(updated);
    saveSystemSettings(updated);
  };

  // --- Feature Handlers ---
  const handleToggleFeature = (featureKey: keyof typeof settings.features) => {
    const updated = {
      ...settings,
      features: {
        ...settings.features,
        [featureKey]: !settings.features[featureKey]
      }
    };
    setSettings(updated);
    saveSystemSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-200 rounded-lg">
              <SettingsIcon size={20} className="text-gray-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Admin Configuration</h2>
              <p className="text-xs text-gray-500">System settings, form fields, and feature toggles</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <button 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center ${activeTab === 'lists' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('lists')}
          >
            <List size={16} className="mr-2" /> Dropdown Options
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center ${activeTab === 'fields' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('fields')}
          >
            <Layout size={16} className="mr-2" /> Form Fields
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center ${activeTab === 'features' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('features')}
          >
            <ToggleLeft size={16} className="mr-2" /> Feature Access
          </button>
        </div>
        
        <div className="p-0 flex-1 overflow-y-auto bg-gray-50">
          
          {/* === LISTS TAB === */}
          {activeTab === 'lists' && (
            <div className="p-6">
              <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 inline-flex flex-wrap gap-y-2">
                <button 
                  className={`px-4 py-1.5 rounded-md text-sm ${activeListTab === 'designations' ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveListTab('designations')}
                >
                  Designations (Mapping)
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-md text-sm ${activeListTab === 'categories' ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveListTab('categories')}
                >
                  Staff Categories
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-md text-sm ${activeListTab === 'types' ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveListTab('types')}
                >
                  Employment Types
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-md text-sm ${activeListTab === 'statuses' ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveListTab('statuses')}
                >
                  Statuses
                </button>
              </div>

              <div className="mb-4 flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder={`Add new ${activeListTab}...`}
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <Button onClick={handleAddItem} disabled={!newItem.trim()}>
                  <Plus size={16} className="mr-2" /> Add
                </Button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {settings[getListKey()].map(item => (
                  <div key={item} className="flex justify-between items-center p-3 hover:bg-gray-50">
                    <span className="text-gray-700 font-medium">{item}</span>
                    
                    {/* Special Mapping UI for Designations */}
                    {activeListTab === 'designations' && (
                       <div className="flex items-center ml-auto mr-4">
                         <span className="text-xs text-gray-400 mr-2">Maps to Category:</span>
                         <select 
                           className="text-sm border-gray-300 rounded focus:ring-red-500 focus:border-red-500 py-1"
                           value={settings.designationMapping[item] || ''}
                           onChange={(e) => handleMappingChange(item, e.target.value)}
                         >
                           <option value="">-- None --</option>
                           {settings.staffCategories.map(cat => (
                             <option key={cat} value={cat}>{cat}</option>
                           ))}
                         </select>
                       </div>
                    )}

                    <button onClick={() => handleDeleteItem(item)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === FIELDS TAB === */}
          {activeTab === 'fields' && (
            <div className="p-6">
               <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                 <h4 className="text-sm font-bold text-gray-700 mb-3">Add Custom Field</h4>
                 <div className="flex gap-3">
                   <div className="flex-1">
                     <input 
                       type="text" 
                       placeholder="Field Label (e.g. Blood Group)" 
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                       value={newFieldLabel}
                       onChange={e => setNewFieldLabel(e.target.value)}
                     />
                   </div>
                   <div className="w-32">
                     <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as FieldInputType)}
                     >
                       <option value="text">Text</option>
                       <option value="number">Number</option>
                       <option value="date">Date</option>
                       <option value="email">Email</option>
                       <option value="tel">Phone</option>
                     </select>
                   </div>
                   <Button onClick={handleAddField} size="sm">
                     <Plus size={16} className="mr-2" /> Add
                   </Button>
                 </div>
               </div>

               <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Label</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                       <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visibility</th>
                       <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {settings.fieldConfigs.map(field => (
                       <tr key={field.key} className={!field.enabled ? 'bg-gray-50' : ''}>
                         <td className="px-4 py-3 text-sm text-gray-900 flex items-center">
                           {field.label}
                           {field.isSystem && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">System</span>}
                         </td>
                         <td className="px-4 py-3 text-sm text-gray-500 capitalize">{field.type}</td>
                         <td className="px-4 py-3 text-center">
                           <button 
                             onClick={() => handleToggleField(field.key)}
                             disabled={field.isLocked}
                             className={`text-2xl focus:outline-none transition-colors ${field.isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${field.enabled ? 'text-green-500' : 'text-gray-300'}`}
                           >
                             {field.enabled ? <ToggleRight /> : <ToggleLeft />}
                           </button>
                         </td>
                         <td className="px-4 py-3 text-right">
                           {!field.isSystem && (
                             <button onClick={() => handleDeleteField(field.key)} className="text-gray-400 hover:text-red-600">
                               <Trash2 size={16} />
                             </button>
                           )}
                           {field.isSystem && field.isLocked && <Lock size={14} className="ml-auto text-gray-300" />}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* === FEATURES TAB === */}
          {activeTab === 'features' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                 
                 {/* Unit Edit Permission */}
                 <div className="flex items-center justify-between p-4">
                   <div>
                     <h4 className="font-medium text-gray-900">Allow Unit Heads to Edit/Add</h4>
                     <p className="text-sm text-gray-500">If disabled, Unit Heads can only view their employee list (Read-Only).</p>
                   </div>
                   <button 
                     onClick={() => handleToggleFeature('allowUnitEdit')}
                     className={`text-3xl focus:outline-none transition-colors ${settings.features.allowUnitEdit ? 'text-green-500' : 'text-gray-300'}`}
                   >
                     {settings.features.allowUnitEdit ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   </button>
                 </div>

                 {/* Transfer Permission */}
                 <div className="flex items-center justify-between p-4">
                   <div>
                     <h4 className="font-medium text-gray-900">Allow Unit Transfers</h4>
                     <p className="text-sm text-gray-500">If enabled, Unit Heads can transfer employees to other depots. Admins always have access.</p>
                   </div>
                   <button 
                     onClick={() => handleToggleFeature('allowTransfer')}
                     className={`text-3xl focus:outline-none transition-colors ${settings.features.allowTransfer ? 'text-green-500' : 'text-gray-300'}`}
                   >
                     {settings.features.allowTransfer ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   </button>
                 </div>
                 
                 {/* Delete Permission */}
                 <div className="flex items-center justify-between p-4">
                   <div>
                     <h4 className="font-medium text-gray-900">Allow Deletion</h4>
                     <p className="text-sm text-gray-500">Enable admins to permanently delete employee records.</p>
                   </div>
                   <button 
                     onClick={() => handleToggleFeature('allowDelete')}
                     className={`text-3xl focus:outline-none transition-colors ${settings.features.allowDelete ? 'text-green-500' : 'text-gray-300'}`}
                   >
                     {settings.features.allowDelete ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   </button>
                 </div>

                 {/* Export Permission */}
                 <div className="flex items-center justify-between p-4">
                   <div>
                     <h4 className="font-medium text-gray-900">Allow CSV Export</h4>
                     <p className="text-sm text-gray-500">Show the export button on dashboards.</p>
                   </div>
                   <button 
                     onClick={() => handleToggleFeature('allowExport')}
                     className={`text-3xl focus:outline-none transition-colors ${settings.features.allowExport ? 'text-green-500' : 'text-gray-300'}`}
                   >
                     {settings.features.allowExport ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   </button>
                 </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
           <Button variant="outline" onClick={onClose}>Close Settings</Button>
        </div>
      </div>
    </div>
  );
};

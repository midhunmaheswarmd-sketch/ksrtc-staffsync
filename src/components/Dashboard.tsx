
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, LogOut, Plus, Download, Search, 
  MapPin, UserCheck, UserMinus, BarChart3,
  Edit2, Trash2, Filter, ShieldCheck, Settings as SettingsIcon,
  ArrowRightLeft, AlertCircle, CheckSquare, Square, X
} from 'lucide-react';
import { Employee, UserRole, SystemSettings } from '../types';
import * as db from '../services/storageService';
import { UNIT_CODES } from '../constants';
import { Button } from './Button';
import { EmployeeModal } from './EmployeeModal';
import { BulkImport } from './BulkImport';
import { Settings } from './Settings';
import { TransferModal } from './TransferModal';

interface DashboardProps {
  user: { role: UserRole; unitCode: string };
  onLogout: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, setGlobalLoading }) => {
  const isAdmin = user.role === 'ADMIN';
  
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>(user.unitCode);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  
  // Bulk Selection State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());

  // Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(db.getSystemSettings());

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [transferEmployees, setTransferEmployees] = useState<Employee[]>([]);

  // Load data when filter changes
  useEffect(() => {
    loadData();
    // Refresh settings whenever data is reloaded in case they changed
    setSystemSettings(db.getSystemSettings());
    // Clear selection when view changes
    setSelectedEmployeeIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnitFilter, isSettingsOpen]); 

  const loadData = () => {
    setGlobalLoading(true);
    setTimeout(() => {
        const data = db.getEmployees(selectedUnitFilter);
        setEmployees(data);
        setGlobalLoading(false);
    }, 300);
  };

  const handleSaveEmployee = (emp: Employee, isNew: boolean) => {
    try {
        db.saveEmployee(emp, isNew);
        loadData();
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (window.confirm(`CRITICAL: Are you sure you want to permanently delete ${name} (PEN: ${id})?\n\nThis action cannot be undone.`)) {
      db.deleteEmployee(id);
      loadData();
    }
  };

  const handleBulkDelete = () => {
     if (selectedEmployeeIds.size === 0) return;
     if (window.confirm(`Are you sure you want to delete ${selectedEmployeeIds.size} selected employees?\n\nThis cannot be undone.`)) {
        db.bulkDeleteEmployees(Array.from(selectedEmployeeIds));
        setSelectedEmployeeIds(new Set());
        loadData();
     }
  };

  const handleTransferConfirm = (emps: Employee[], newUnit: string) => {
      // Bulk update
      const updatedList = emps.map(e => ({
          ...e,
          unitCode: newUnit,
          status: 'Transferred'
      }));
      db.bulkUpdateEmployees(updatedList);
      
      const count = emps.length;
      alert(`Successfully transferred ${count} employee${count > 1 ? 's' : ''} to ${newUnit}`);
      setSelectedEmployeeIds(new Set());
      loadData();
  };

  const handleBulkImport = (newEmps: Employee[]) => {
    setGlobalLoading(true);
    setTimeout(() => {
        const result = db.bulkSaveEmployees(newEmps);
        setGlobalLoading(false);
        setIsBulkMode(false);
        
        let message = `Successfully imported ${result.added} employees.`;
        if (result.errors.length > 0) {
            message += `\n\n${result.errors.length} skipped due to duplicates or errors:\n- ${result.errors.slice(0, 5).join('\n- ')}`;
            if(result.errors.length > 5) message += `\n...and ${result.errors.length - 5} more.`;
        }
        alert(message);
        loadData();
    }, 800);
  };

  const handleExport = () => {
    // Dynamic export based on active fields
    const activeFields = systemSettings.fieldConfigs.filter(f => f.enabled);
    const headers = activeFields.map(f => f.label);
    
    const csvContent = [
      headers.join(','),
      ...employees.map(e => {
        return activeFields.map(f => {
           let val;
           // Check if it's a core field or custom field
           if (['id', 'name', 'unitCode', 'status', 'type', 'designation', 'phone', 'email', 'joinedDate'].includes(f.key)) {
             val = (e as any)[f.key];
           } else {
             val = e.customFields?.[f.key];
           }
           return val ? `"${val}"` : '';
        }).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `KSRTC_${selectedUnitFilter}_Staff_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const stats = useMemo(() => {
    const total = employees.length;
    const permanent = employees.filter(e => e.type === 'Permanent').length;
    const badali = employees.filter(e => e.type === 'Badali').length;
    return { total, permanent, badali };
  }, [employees]);

  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    // Simplified search logic
    const matchesSearch = 
      e.name.toLowerCase().includes(term) || 
      e.id.toLowerCase().includes(term) ||
      e.designation.toLowerCase().includes(term) ||
      (e.status || '').toLowerCase().includes(term);
    
    const matchesType = filterType === 'ALL' || e.type === filterType;

    return matchesSearch && matchesType;
  });

  // Calculate permissions
  // Admin has full access. Unit Head access depends on features settings.
  const canAddEdit = isAdmin || systemSettings.features.allowUnitEdit;
  const canTransfer = isAdmin || systemSettings.features.allowTransfer;
  // Delete usually follows strict rules, allowing based on global setting + edit permission for units
  const canDelete = isAdmin || (systemSettings.features.allowUnitEdit && systemSettings.features.allowDelete);

  // If any action is possible, we show the action columns/checkboxes
  const showActions = canAddEdit || canTransfer || canDelete;

  // Dynamic Columns
  const dynamicColumns = systemSettings.fieldConfigs.filter(f => f.enabled);

  // Checkbox Logic
  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedEmployeeIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedEmployeeIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedEmployeeIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
          setSelectedEmployeeIds(new Set());
      } else {
          setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.id)));
      }
  };

  const isAllSelected = filteredEmployees.length > 0 && selectedEmployeeIds.size === filteredEmployees.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className={`p-2 rounded-lg ${isAdmin ? 'bg-gray-800 text-yellow-400' : 'bg-red-700 text-white'}`}>
               {isAdmin ? <ShieldCheck size={20} /> : <Users size={20} />}
             </div>
             <div>
               <h1 className="text-xl font-bold text-gray-900">{isAdmin ? 'Admin Console' : 'Unit Dashboard'}</h1>
               <div className="flex items-center text-xs text-gray-500">
                 <MapPin size={12} className="mr-1" />
                 VIEW: <span className="font-bold text-gray-700 ml-1">{selectedUnitFilter === 'ALL' ? 'GLOBAL' : selectedUnitFilter}</span>
               </div>
             </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin && (
                <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)}>
                    <SettingsIcon size={16} className="mr-2" /> Settings
                </Button>
            )}
            <Button variant="outline" onClick={onLogout} size="sm" className="text-gray-600 hover:text-red-600">
                <LogOut size={16} className="mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Admin Filter Bar */}
        {isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center space-x-4">
             <span className="text-sm font-medium text-gray-700">Filter View:</span>
             <select
               className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
               value={selectedUnitFilter}
               onChange={(e) => setSelectedUnitFilter(e.target.value)}
             >
               <option value="ALL">All Units</option>
               {UNIT_CODES.map(code => (
                 <option key={code} value={code}>Unit: {code}</option>
               ))}
             </select>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4 z-10">
              <BarChart3 size={24} />
            </div>
            <div className="z-10">
              <p className="text-sm text-gray-500 font-medium">{selectedUnitFilter === 'ALL' ? 'Global Strength' : 'Unit Strength'}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
             <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Permanent Staff</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.permanent}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
             <div className="p-3 rounded-full bg-yellow-50 text-yellow-600 mr-4">
              <UserMinus size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Badali Staff</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.badali}</h3>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
          <div className="flex space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
               <select 
                 className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 appearance-none bg-white min-w-[140px]"
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value)}
               >
                 <option value="ALL">All Categories</option>
                 {systemSettings.employeeTypes.map(t => (
                     <option key={t} value={t}>{t}</option>
                 ))}
               </select>
               <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          <div className="flex space-x-2 w-full sm:w-auto">
            {systemSettings.features.allowExport && (
              <Button variant="outline" onClick={handleExport}>
                <Download size={16} className="mr-2" /> Export
              </Button>
            )}
            
            {canAddEdit && (
              <>
                <Button variant="secondary" onClick={() => setIsBulkMode(!isBulkMode)}>
                  {isBulkMode ? 'Close Import' : 'Bulk Import'}
                </Button>
                <Button onClick={() => { setEditingEmployee(null); setIsAddModalOpen(true); }}>
                  <Plus size={16} className="mr-2" /> Add Staff
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bulk Import Section */}
        {isBulkMode && canAddEdit && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <BulkImport 
              defaultUnitCode={selectedUnitFilter === 'ALL' ? UNIT_CODES[0] : selectedUnitFilter}
              allowUnitSelection={isAdmin}
              onImport={handleBulkImport} 
              onCancel={() => setIsBulkMode(false)}
            />
          </div>
        )}

        {/* Employee Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {showActions && (
                    <th className="px-4 py-3 w-10">
                       <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                         {isAllSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                       </button>
                    </th>
                  )}
                  {dynamicColumns.map(col => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                  {showActions && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployeeIds.has(emp.id);
                    return (
                    <tr key={emp.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50' : ''}`}>
                      {showActions && (
                        <td className="px-4 py-4">
                           <button onClick={() => toggleSelection(emp.id)} className={`focus:outline-none ${isSelected ? 'text-red-600' : 'text-gray-300 hover:text-gray-500'}`}>
                              {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                           </button>
                        </td>
                      )}
                      {dynamicColumns.map(col => {
                         let val;
                         // Access data either from root or customFields
                         if (['id', 'name', 'unitCode', 'status', 'type', 'designation', 'phone', 'email', 'joinedDate'].includes(col.key)) {
                           val = (emp as any)[col.key];
                         } else {
                           val = emp.customFields?.[col.key];
                         }

                         // Rendering logic for specific types
                         if (col.key === 'id') {
                           return <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{val}</td>;
                         }
                         if (col.key === 'name') {
                            return <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{val}</td>;
                         }
                         if (col.key === 'status') {
                           return (
                             <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                               <div className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${val === 'Working' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                  <span className="text-sm text-gray-700">{val || 'Unknown'}</span>
                               </div>
                             </td>
                           );
                         }
                         if (col.key === 'unitCode') {
                           return (
                             <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                               <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-bold">{val}</span>
                             </td>
                           );
                         }
                         if (col.key === 'type') {
                           return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  val === 'Permanent' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : val === 'Badali' 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {val}
                                </span>
                              </td>
                           );
                         }
                         if (col.key === 'staffCategory') {
                            return <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 italic">{val}</td>;
                         }

                         // Default render
                         return <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{val}</td>;
                      })}
                      
                      {showActions && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canTransfer && (
                                <button 
                                    onClick={() => { setTransferEmployees([emp]); setIsTransferOpen(true); }}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                    title="Transfer Unit"
                                >
                                    <ArrowRightLeft size={18} />
                                </button>
                            )}
                            {canAddEdit && (
                              <button 
                                onClick={() => { setEditingEmployee(emp); setIsAddModalOpen(true); }}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                  onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                              >
                                  <Trash2 size={18} />
                              </button>
                            )}
                        </td>
                      )}
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan={dynamicColumns.length + (showActions ? 2 : 0)} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="text-gray-300 w-12 h-12 mb-2" />
                        <p>No employees found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedEmployeeIds.size > 0 && showActions && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="flex items-center">
                    <span className="font-bold text-lg mr-2">{selectedEmployeeIds.size}</span>
                    <span className="text-gray-400 text-sm">Selected</span>
                </div>
                
                <div className="h-8 w-px bg-gray-700"></div>

                <div className="flex gap-3">
                   {canTransfer && (
                       <Button size="sm" variant="secondary" onClick={() => {
                           const selected = employees.filter(e => selectedEmployeeIds.has(e.id));
                           setTransferEmployees(selected);
                           setIsTransferOpen(true);
                       }}>
                           <ArrowRightLeft size={16} className="mr-2" /> Bulk Transfer
                       </Button>
                   )}
                   {canDelete && (
                       <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                           <Trash2 size={16} className="mr-2" /> Delete Selected
                       </Button>
                   )}
                </div>

                <button 
                  onClick={() => setSelectedEmployeeIds(new Set())} 
                  className="ml-2 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>
        )}

      </main>

      {/* Modals */}
      <EmployeeModal 
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingEmployee(null); }}
        onSave={handleSaveEmployee}
        defaultUnitCode={selectedUnitFilter === 'ALL' ? UNIT_CODES[0] : selectedUnitFilter}
        allowUnitSelection={isAdmin}
        initialData={editingEmployee}
      />

      <Settings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => { setIsTransferOpen(false); setTransferEmployees([]); }}
        employees={transferEmployees}
        onConfirm={handleTransferConfirm}
      />
    </div>
  );
};

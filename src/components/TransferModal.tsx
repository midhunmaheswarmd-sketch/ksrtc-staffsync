
import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { UNIT_CODES } from '../constants';
import { Button } from './Button';
import { ArrowRightLeft, X, AlertTriangle, Users } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (employees: Employee[], newUnitCode: string) => void;
  employees: Employee[] | null; // Changed from single employee to array
}

export const TransferModal: React.FC<TransferModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  employees 
}) => {
  const [newUnit, setNewUnit] = useState('');
  const [step, setStep] = useState<'SELECT' | 'CONFIRM'>('SELECT');

  // Reset state when modal opens/closes or employee changes
  useEffect(() => {
    if (isOpen) {
      setNewUnit('');
      setStep('SELECT');
    }
  }, [isOpen, employees]);

  if (!isOpen || !employees || employees.length === 0) return null;

  const isBulk = employees.length > 1;
  const singleEmployee = employees[0];

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit) return;
    setStep('CONFIRM');
  };

  const handleFinalConfirm = () => {
    onConfirm(employees, newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center text-blue-800 font-bold">
            <ArrowRightLeft size={20} className="mr-2" />
            Transfer {isBulk ? 'Staff' : 'Employee'}
          </div>
          <button onClick={onClose} className="text-blue-400 hover:text-blue-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Employee Info */}
          <div className="mb-4">
             <p className="text-sm text-gray-500 mb-2">Transferring:</p>
             {isBulk ? (
               <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                 <Users className="text-gray-400 w-8 h-8 mr-3" />
                 <div>
                   <div className="font-semibold text-gray-800 text-lg">{employees.length} Employees</div>
                   <div className="text-xs text-gray-500">Selected for bulk transfer</div>
                 </div>
               </div>
             ) : (
               <>
                 <div className="font-semibold text-gray-800 text-lg">{singleEmployee.name}</div>
                 <div className="text-xs text-gray-500 font-mono">PEN: {singleEmployee.id}</div>
               </>
             )}
          </div>

          {/* Visual Indicator */}
          <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-lg">
             <div className="text-center w-1/2">
                <div className="text-xs text-gray-400 uppercase">From</div>
                <div className="font-bold text-red-700 text-lg truncate">
                    {isBulk ? 'Multiple' : singleEmployee.unitCode}
                </div>
             </div>
             <ArrowRightLeft className="text-gray-300" />
             <div className="text-center w-1/2">
                 <div className="text-xs text-gray-400 uppercase">To</div>
                 <div className={`font-bold text-xl ${newUnit ? 'text-green-700' : 'text-gray-300'}`}>
                    {newUnit || '?'}
                 </div>
             </div>
          </div>

          {step === 'SELECT' ? (
            <form onSubmit={handleProceed}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Destination Unit</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  required
                  autoFocus
                >
                  <option value="" disabled>Select Unit...</option>
                  {UNIT_CODES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!newUnit}>
                  Next
                </Button>
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in zoom-in duration-200">
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                 <div className="flex items-start">
                    <AlertTriangle className="text-yellow-600 w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                       <p className="font-semibold mb-1">Confirm Transfer?</p>
                       <p>
                         {isBulk 
                           ? `These ${employees.length} employees` 
                           : singleEmployee.name
                         } will be moved to the <strong>{newUnit}</strong> unit roster.
                       </p>
                    </div>
                 </div>
               </div>
               
               <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setStep('SELECT')}>Back</Button>
                <Button onClick={handleFinalConfirm} variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Confirm Transfer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

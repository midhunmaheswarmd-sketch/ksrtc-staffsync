
import React, { useState, useRef } from 'react';
import { Upload, Sparkles, AlertCircle, CheckCircle, FileText, Download, X } from 'lucide-react';
import { Button } from './Button';
import { parseBulkEmployeeData } from '../services/geminiService';
import { Employee, ParsedEmployee } from '../types';
import { UNIT_CODES } from '../constants';
import { getSystemSettings } from '../services/storageService';

interface BulkImportProps {
  defaultUnitCode: string;
  allowUnitSelection?: boolean;
  onImport: (employees: Employee[]) => void;
  onCancel: () => void;
}

export const BulkImport: React.FC<BulkImportProps> = ({ 
  defaultUnitCode, 
  allowUnitSelection = false,
  onImport, 
  onCancel 
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [targetUnit, setTargetUnit] = useState(defaultUnitCode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Employee[]>([]);

  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  // Convert ParsedEmployee (AI partial format) to full Employee
  const mapParsedToFull = (parsed: ParsedEmployee[]): Employee[] => {
    const settings = getSystemSettings();
    const defaultDesig = settings.designations[0] || 'Driver';
    const defaultType = settings.employeeTypes[0] || 'Permanent';
    const defaultStatus = settings.statuses[0] || 'Working';

    return parsed.map((p, idx) => {
        const designation = settings.designations.includes(p.designation) ? p.designation : defaultDesig;
        // Auto map category
        let staffCategory = '';
        if (settings.designationMapping[designation]) {
            staffCategory = settings.designationMapping[designation];
        } else if (settings.staffCategories[0]) {
            staffCategory = settings.staffCategories[0];
        }

        return {
            id: p.pen || `TMP-${Date.now()}-${idx}`, // Fallback temporary ID
            name: p.name,
            designation: designation,
            type: p.type || defaultType,
            status: defaultStatus,
            unitCode: targetUnit, // AI currently defaults to selected unit as it parses unstructured text
            phone: p.phone || '',
            email: p.email || '',
            joinedDate: new Date().toISOString().split('T')[0],
            customFields: {
                staffCategory: staffCategory
            }
        };
    });
  };

  const handleAiParse = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await parseBulkEmployeeData(textInput);
      const employees = mapParsedToFull(result);
      setParsedPreview(employees);
    } catch (err) {
      setError("Failed to process text. Ensure API Key is set and text is readable.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CSV Handling Logic ---

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setParsedPreview([]);

    // Validation
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setError("Invalid file format. Please upload a CSV file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 2MB limit.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        if (data.length === 0) {
          setError("No valid employee records found in CSV.");
        } else {
          setParsedPreview(data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError("Error reading file.");
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // Helper to split CSV line respecting quotes
  const splitCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
  };

  const parseCSV = (csvText: string): Employee[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error("CSV file is empty or missing headers.");

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Helper to find column index
    const getIndex = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

    const idxId = getIndex(['pen', 'id', 'identifier']);
    const idxName = getIndex(['name', 'staff', 'employee']);
    const idxUnit = getIndex(['unit', 'code', 'depot']); // New: Support Unit Column
    const idxDesig = getIndex(['designation', 'role', 'position']);
    const idxType = getIndex(['type', 'employment']); // Employment Type
    const idxCategory = getIndex(['category', 'staffcategory']); // Staff Category
    const idxStatus = getIndex(['status']);
    const idxPhone = getIndex(['phone', 'mobile']);
    const idxEmail = getIndex(['email']);

    if (idxName === -1) throw new Error("CSV must contain a 'Name' column.");

    const settings = getSystemSettings();
    const defaultDesig = settings.designations[0] || 'Driver';
    const defaultType = settings.employeeTypes[0] || 'Permanent';
    const defaultStatus = settings.statuses[0] || 'Working';
    
    const results: Employee[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = splitCSVLine(lines[i]);
      if (row.length < 2) continue; // Skip empty/malformed lines

      const name = row[idxName];
      if (!name) continue;

      // Extract values or use defaults
      const rawDesig = idxDesig !== -1 ? row[idxDesig] : '';
      const designation = settings.designations.includes(rawDesig) ? rawDesig : defaultDesig;

      // Handle category logic
      let category = '';
      if (idxCategory !== -1 && row[idxCategory]) {
          category = row[idxCategory];
      } else if (settings.designationMapping[designation]) {
          category = settings.designationMapping[designation];
      }

      const rawType = idxType !== -1 ? row[idxType] : '';
      const rawStatus = idxStatus !== -1 ? row[idxStatus] : '';
      
      // Determine Unit: CSV column > Selected Dropdown
      let assignedUnit = targetUnit;
      if (idxUnit !== -1 && row[idxUnit]) {
          const csvUnit = row[idxUnit].toUpperCase().trim();
          // Optional: Validate if this unit code is valid? 
          // For now, assume admin puts correct code or we map it if valid, else default
          if (UNIT_CODES.includes(csvUnit)) {
              assignedUnit = csvUnit;
          }
      }

      results.push({
        id: (idxId !== -1 && row[idxId]) ? row[idxId] : `CSV-${Date.now()}-${i}`,
        name: name,
        designation: designation,
        type: settings.employeeTypes.includes(rawType) ? rawType : defaultType,
        status: settings.statuses.includes(rawStatus) ? rawStatus : defaultStatus,
        unitCode: assignedUnit,
        phone: idxPhone !== -1 ? row[idxPhone] : '',
        email: idxEmail !== -1 ? row[idxEmail] : '',
        joinedDate: new Date().toISOString().split('T')[0],
        customFields: {
            staffCategory: category
        }
      });
    }

    return results;
  };

  const handleDownloadTemplate = () => {
    const headers = "PEN,Name,Unit,Designation,EmploymentType,Status,Phone,Email";
    const sample = "10555,John Doe,TVM,Driver,Permanent,Working,9847012345,john@example.com";
    const blob = new Blob([`${headers}\n${sample}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'staff_import_template_v2.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    onImport(parsedPreview);
    setParsedPreview([]);
    setTextInput('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Bulk Import Employees</h3>
          <p className="text-sm text-gray-500">
            {allowUnitSelection ? 'Upload mixed units or select a target default.' : `Add multiple employees to ${targetUnit}.`}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'text' ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            AI Text Paste
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'file' ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            CSV Upload
          </button>
        </div>
      </div>

      {/* Target Unit Selector for Admins */}
      {allowUnitSelection && (
        <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
           <label className="block text-sm font-medium text-blue-800 mb-1">Default Unit</label>
           <div className="flex items-center gap-2">
            <select 
                className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                value={targetUnit}
                onChange={(e) => {
                setTargetUnit(e.target.value);
                setParsedPreview([]); // Reset preview if unit changes
                }}
            >
                {UNIT_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-xs text-blue-600">
                (Used if 'Unit' column is missing in CSV)
            </span>
           </div>
        </div>
      )}

      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="relative">
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Paste unstructured employee list below
             </label>
             <textarea
               className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 font-mono text-sm"
               placeholder="e.g. 10234 John Doe, Driver, Permanent, 9847012345&#10;10567 Jane Smith, Conductor, Badali, 9847098765"
               value={textInput}
               onChange={(e) => setTextInput(e.target.value)}
             />
             <div className="absolute top-2 right-2">
               <Sparkles className="text-yellow-500 w-5 h-5 animate-pulse" />
             </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 italic">
              * Powered by Gemini AI. Can understand messy formats.
            </span>
            <div className="space-x-2">
               <Button variant="outline" onClick={onCancel}>Cancel</Button>
               <Button onClick={handleAiParse} isLoading={isProcessing} disabled={!textInput}>
                 <Sparkles className="w-4 h-4 mr-2" />
                 Parse Data
               </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'file' && (
        <div className="space-y-4">
           <div 
             className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-colors ${
               dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400'
             }`}
             onDragEnter={handleDrag}
             onDragLeave={handleDrag}
             onDragOver={handleDrag}
             onDrop={handleDrop}
           >
            <div className="p-4 bg-gray-50 rounded-full mb-3">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
              ) : (
                <Upload className={`w-8 h-8 ${dragActive ? 'text-red-600' : 'text-gray-400'}`} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {dragActive ? "Drop the file here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">CSV files only (max 2MB)</p>
            </div>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".csv"
              onChange={handleFileChange}
            />
            
            <div className="mt-4 flex gap-3">
               <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                 Select File
               </Button>
               <button 
                 onClick={handleDownloadTemplate}
                 className="inline-flex items-center text-xs text-red-600 hover:text-red-800 underline"
               >
                 <Download size={12} className="mr-1" /> Template
               </button>
            </div>
          </div>
          
          <div className="flex justify-end">
             <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {parsedPreview.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Preview ({parsedPreview.length} employees)
            </h4>
            <Button onClick={handleConfirmImport}>Confirm Import</Button>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PEN</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedPreview.map((emp, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm text-gray-900 font-mono">{emp.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{emp.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 font-bold">{emp.unitCode}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{emp.designation}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 italic">{emp.customFields?.staffCategory}</td>
                    <td className="px-4 py-2 text-sm">
                       <span className={`px-2 py-0.5 rounded text-xs ${emp.type === 'Permanent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {emp.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

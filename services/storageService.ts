
import { Employee, SystemSettings, FieldConfig, FeatureConfig } from '../types';
import { DESIGNATIONS, STAFF_CATEGORIES, INITIAL_DESIGNATION_MAPPING } from '../constants';

const EMP_STORAGE_KEY = 'ksrtc_employees_v1';
const SETTINGS_STORAGE_KEY = 'ksrtc_settings_v3'; // Bumped version for new schema

// --- Default Configuration ---

const DEFAULT_FIELDS: FieldConfig[] = [
  { key: 'id', label: 'PEN (ID)', type: 'text', required: true, enabled: true, isSystem: true, isLocked: true },
  { key: 'name', label: 'Full Name', type: 'text', required: true, enabled: true, isSystem: true, isLocked: true },
  { key: 'unitCode', label: 'Unit Code', type: 'text', required: true, enabled: true, isSystem: true, isLocked: true },
  { key: 'status', label: 'Status', type: 'select', required: true, enabled: true, isSystem: true, isLocked: false, listKey: 'statuses' },
  { key: 'designation', label: 'Designation', type: 'select', required: true, enabled: true, isSystem: true, isLocked: false, listKey: 'designations' },
  { key: 'staffCategory', label: 'Staff Category', type: 'select', required: true, enabled: true, isSystem: true, isLocked: false, listKey: 'staffCategories' }, // New field
  { key: 'type', label: 'Employment Type', type: 'select', required: true, enabled: true, isSystem: true, isLocked: false, listKey: 'employeeTypes' }, // Renamed label
  { key: 'phone', label: 'Phone Number', type: 'tel', required: false, enabled: true, isSystem: true, isLocked: false },
  { key: 'email', label: 'Email Address', type: 'email', required: false, enabled: true, isSystem: true, isLocked: false },
  { key: 'joinedDate', label: 'Joined Date', type: 'date', required: false, enabled: true, isSystem: true, isLocked: false },
];

const DEFAULT_FEATURES: FeatureConfig = {
  allowTransfer: true,
  allowDelete: true,
  allowExport: true,
  allowUnitEdit: true // Default to true or false depending on preference, currently enabling it
};

const DEFAULT_SETTINGS: SystemSettings = {
  designations: DESIGNATIONS,
  employeeTypes: ['Permanent', 'Badali'],
  statuses: ['Working', 'On Leave', 'Suspended', 'Retired', 'Transferred'],
  staffCategories: STAFF_CATEGORIES,
  designationMapping: INITIAL_DESIGNATION_MAPPING,
  fieldConfigs: DEFAULT_FIELDS,
  features: DEFAULT_FEATURES
};

export const getSystemSettings = (): SystemSettings => {
  const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!data) return DEFAULT_SETTINGS;
  
  const parsed = JSON.parse(data);
  // Merge strategies to handle schema migrations
  return { 
    ...DEFAULT_SETTINGS, 
    ...parsed,
    // Ensure fieldConfigs exists if migrating from old version
    fieldConfigs: parsed.fieldConfigs || DEFAULT_FIELDS,
    features: { ...DEFAULT_FEATURES, ...(parsed.features || {}) },
    staffCategories: parsed.staffCategories || STAFF_CATEGORIES,
    designationMapping: parsed.designationMapping || INITIAL_DESIGNATION_MAPPING
  };
};

export const saveSystemSettings = (settings: SystemSettings): void => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

// --- Employee Management ---

export const getAllEmployeesRaw = (): Employee[] => {
  const allData = localStorage.getItem(EMP_STORAGE_KEY);
  return allData ? JSON.parse(allData) : [];
};

export const getEmployees = (unitCode: string): Employee[] => {
  const allData = getAllEmployeesRaw();
  if (unitCode === 'ALL') return allData;
  return allData.filter(e => e.unitCode === unitCode);
};

export const checkIdExists = (id: string): boolean => {
  const employees = getAllEmployeesRaw();
  return employees.some(e => e.id === id);
};

export const saveEmployee = (employee: Employee, isNewEntry: boolean): void => {
  const employees = getAllEmployeesRaw();
  
  if (isNewEntry) {
    if (employees.some(e => e.id === employee.id)) {
      throw new Error(`Duplicate PEN: Employee with ID ${employee.id} already exists.`);
    }
    employees.push(employee);
  } else {
    // Edit mode
    const index = employees.findIndex(e => e.id === employee.id);
    if (index >= 0) {
      employees[index] = employee;
    } else {
      employees.push(employee);
    }
  }
  
  localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(employees));
};

export const deleteEmployee = (id: string): void => {
  const employees = getAllEmployeesRaw();
  const filtered = employees.filter(e => e.id !== id);
  localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(filtered));
};

export const bulkDeleteEmployees = (ids: string[]): void => {
  const employees = getAllEmployeesRaw();
  const filtered = employees.filter(e => !ids.includes(e.id));
  localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(filtered));
};

export interface BulkImportResult {
  added: number;
  errors: string[];
}

export const bulkSaveEmployees = (newEmployees: Employee[]): BulkImportResult => {
  const current = getAllEmployeesRaw();
  
  // Create a map for fast lookup of existing IDs
  const existingIds = new Set(current.map(e => e.id));
  const errors: string[] = [];
  const toAdd: Employee[] = [];
  
  // For updates (e.g. transfers), we might be passing existing employees with new data.
  // If the ID exists in the *new* batch, we assume it's an overwrite/update if specifically intended,
  // but standard bulk import usually implies adding new.
  // However, for bulk transfer, we usually use saveEmployee iteratively or a specific bulkUpdate.
  // Here, we'll assume this function is strictly for ADDING new employees via import.
  // If an ID exists, we skip it to prevent accidental overwrites during import.

  newEmployees.forEach(emp => {
    // Check if ID exists in the database
    if (existingIds.has(emp.id)) {
       // However, if we are doing a "Bulk Transfer", the ID *will* exist. 
       // We need to differentiate between "Import New" and "Update Existing".
       // For now, let's assume if the ID exists, we check if it's an update (same ID, different data).
       // But simpler: Bulk Import tool is for onboarding. 
       errors.push(`Skipped ${emp.name} (PEN: ${emp.id}) - ID already exists.`);
    } else {
      // Check for duplicates within the uploaded file itself
      if (toAdd.some(e => e.id === emp.id)) {
         errors.push(`Skipped duplicate in batch: ${emp.name} (PEN: ${emp.id})`);
      } else {
        toAdd.push(emp);
      }
    }
  });
  
  const combined = [...current, ...toAdd];
  localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(combined));

  return { added: toAdd.length, errors };
};

// New function specifically for Bulk Updates (Transfers)
export const bulkUpdateEmployees = (updatedEmployees: Employee[]): void => {
    let allData = getAllEmployeesRaw();
    const updateMap = new Map(updatedEmployees.map(e => [e.id, e]));

    allData = allData.map(emp => {
        if (updateMap.has(emp.id)) {
            return updateMap.get(emp.id)!;
        }
        return emp;
    });

    localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(allData));
};

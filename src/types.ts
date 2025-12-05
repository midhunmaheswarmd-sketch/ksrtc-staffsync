
export enum EmployeeType {
  PERMANENT = 'Permanent',
  BADALI = 'Badali',
}

export interface Employee {
  id: string; // PEN (Personal Employment Number)
  name: string;
  designation: string;
  type: string; // Employment Type (Permanent/Badali)
  status: string;
  unitCode: string;
  phone: string;
  email?: string;
  joinedDate: string;
  // Dynamic fields storage
  customFields?: Record<string, any>;
}

export interface Unit {
  code: string;
  name: string;
}

export type UserRole = 'ADMIN' | 'UNIT_HEAD';

export interface User {
  unitCode: string;
  username: string;
  role: UserRole;
}

// --- New Configuration Types ---

export type FieldInputType = 'text' | 'number' | 'email' | 'tel' | 'date' | 'select';

export interface FieldConfig {
  key: string;          // e.g., 'phone', 'bloodGroup'
  label: string;        // e.g., 'Phone Number'
  type: FieldInputType;
  required: boolean;
  enabled: boolean;     // Switch to turn On/Off
  isSystem: boolean;    // If true, cannot be deleted (only disabled if allowed)
  isLocked: boolean;    // If true, cannot be disabled (e.g., ID, UnitCode)
  options?: string[];   // For select types (if not using global lists)
  listKey?: 'designations' | 'employeeTypes' | 'statuses' | 'staffCategories'; // Connects to the lists in settings
}

export interface FeatureConfig {
  allowTransfer: boolean;
  allowDelete: boolean;
  allowExport: boolean;
  allowUnitEdit: boolean; // New: Allow Unit Heads to add/edit/import
}

export interface SystemSettings {
  designations: string[];
  employeeTypes: string[];
  statuses: string[];
  staffCategories: string[]; // New list: Civil, Mechanical, etc.
  designationMapping: Record<string, string>; // New: Designation -> Category
  fieldConfigs: FieldConfig[];
  features: FeatureConfig;
}

// For AI Parsing response
export interface ParsedEmployee {
  name: string;
  designation: string;
  type: string;
  phone?: string;
  email?: string;
  pen?: string;
}


export const UNIT_CODES = [
  "ADR", "ALP", "ALV", "ANK", "ARD", "ARK", "ATL", "CDM", "CGR", "CHR", "CHT", "CLD", 
  "CTL", "CTR", "CTY", "CWS", "EDT", "EKM", "EMY", "ETP", "GVR", "HPD", "IJK", "KDR", 
  "KGD", "KHD", "KKD", "KKM", "KLM", "KLP", "KMG", "KMR", "KMY", "KNI", "KNP", "KNR", 
  "KPM", "KPT", "KTD", "KTM", "KTP", "KTR", "KYM", "MKD", "MLA", "MLP", "MLT", "MND", 
  "MNR", "MPY", "MVK", "MVP", "NBR", "NDD", "NDM", "NPR", "NTA", "PBR", "PDK", "PDM", 
  "PLA", "PLD", "PLK", "PLR", "PMN", "PNI", "PNK", "PNR", "PPD", "PPM", "PRK", "PSL", 
  "PTA", "PVM", "PVR", "RNI", "RWA", "RWE", "RWK", "RWM", "SBY", "TBN", "TDP", "TDY", 
  "TLY", "TPM", "TSR", "TSY", "TVL", "TVM", "VDK", "VJD", "VDA", "VKB", "VKM", "VND", 
  "VRD", "VTR", "VZM"
];

export const DESIGNATIONS = [
  "Conductor", "Driver", "Inspector", "Mechanic", "Station Master", "Clerk", "Guard",
  "Draftsman", "AE(Civil)", "AO", "ATO", "AWM", "DE", "DTO", "LO", "ED", "FA & CAO",
  "Stores Officer", "Welfare Officer", "Works Manager", "HVS", "VS", "ADE", "Blacksmith",
  "Chargeman", "Coach Builder", "Electrician", "Garage Mazdoor", "Glass Cutter", "Painter",
  "Pump Operator", "Tinker", "Tyre Inspector", "Tyre Retreader", "Upholsterer", "Welder",
  "Assistant", "Binder", "FC Supdt", "Peon", "Steno", "Supdt", "Sweeper", "Sweeper Cum SCA",
  "Ticket Issuer", "Typist", "Security", "ASK", "Store Assistant", "Store Issuer", "Store Keeper"
];

export const STAFF_CATEGORIES = [
  "Civil", "Conductor", "Driver", "Higher Division", "Line Staff", "Mechanical",
  "Ministerial", "Security All", "Store"
];

export const INITIAL_DESIGNATION_MAPPING: Record<string, string> = {
  "Draftsman": "Civil",
  "Conductor": "Conductor",
  "Driver": "Driver",
  "AE(Civil)": "Higher Division",
  "AO": "Higher Division",
  "ATO": "Higher Division",
  "AWM": "Higher Division",
  "DE": "Higher Division",
  "DTO": "Higher Division",
  "LO": "Higher Division",
  "ED": "Higher Division",
  "FA & CAO": "Higher Division",
  "Stores Officer": "Higher Division",
  "Welfare Officer": "Higher Division",
  "Works Manager": "Higher Division",
  "HVS": "Line Staff",
  "Inspector": "Line Staff",
  "Station Master": "Line Staff", // SM mapped to Station Master
  "SM": "Line Staff",
  "VS": "Line Staff",
  "ADE": "Mechanical",
  "Blacksmith": "Mechanical",
  "Chargeman": "Mechanical",
  "Coach Builder": "Mechanical",
  "Electrician": "Mechanical",
  "Garage Mazdoor": "Mechanical",
  "Glass Cutter": "Mechanical",
  "Mechanic": "Mechanical",
  "Painter": "Mechanical",
  "Pump Operator": "Mechanical",
  "Tinker": "Mechanical",
  "Tyre Inspector": "Mechanical",
  "Tyre Retreader": "Mechanical",
  "Upholsterer": "Mechanical",
  "Welder": "Mechanical",
  "Assistant": "Ministerial",
  "Binder": "Ministerial",
  "Clerk": "Ministerial", // Assuming Clerk fits here or similar
  "FC Supdt": "Ministerial",
  "Peon": "Ministerial",
  "Steno": "Ministerial",
  "Supdt": "Ministerial",
  "Sweeper": "Ministerial",
  "Sweeper Cum SCA": "Ministerial",
  "Ticket Issuer": "Ministerial",
  "Typist": "Ministerial",
  "Security": "Security All",
  "ASK": "Store",
  "Store Assistant": "Store",
  "Store Issuer": "Store",
  "Store Keeper": "Store"
};

// Mock default password for demo
export const DEFAULT_PASSWORD = "ksrtc";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin123";

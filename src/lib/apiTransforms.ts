// API response transformation utilities
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

export const transformObjectKeys = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformObjectKeys);
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    transformed[camelKey] = transformObjectKeys(value);
  }
  return transformed;
};

// School-specific transformations
export interface ApiSchool {
  id: number | string;
  school_name?: string;
  schoolName?: string;
  name?: string;
  udise_code?: string | null;
  udiseCode?: string | null;
  udise_school_code?: string | null;
  state_name?: string;
  stateName?: string;
  district_name?: string;
  districtName?: string;
  block_name?: string | null;
  blockName?: string | null;
  institution_id?: string;
  institutionId?: string;
  school_type?: string | null;
  schoolType?: string | null;
  management?: string | null;
  managementType?: string | null;
  status?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  user_count?: number;
  userCount?: number;
}

export interface School {
  id: number | string;
  schoolName: string;
  udiseCode: string | null;
  stateName: string;
  districtName: string;
  blockName: string | null;
  institutionId: string;
  schoolType: string | null;
  management: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export const transformSchool = (apiSchool: any): School => {
  // First normalize the object keys to handle both camelCase and snake_case
  const normalized = transformObjectKeys(apiSchool);
  
  return {
    id: normalized.id || apiSchool.id || '',
    schoolName: normalized.schoolName || normalized.name || apiSchool.school_name || apiSchool.schoolName || apiSchool.name || '',
    udiseCode: normalized.udiseCode || normalized.udiseSchoolCode || apiSchool.udise_code || apiSchool.udise_school_code || null,
    stateName: normalized.stateName || apiSchool.state_name || apiSchool.stateName || '',
    districtName: normalized.districtName || apiSchool.district_name || apiSchool.districtName || '',
    blockName: normalized.blockName || apiSchool.block_name || apiSchool.blockName || null,
    institutionId: normalized.institutionId || apiSchool.institution_id || apiSchool.institutionId || '',
    schoolType: normalized.schoolType || apiSchool.school_type || apiSchool.schoolType || null,
    management: normalized.management || normalized.managementType || apiSchool.management || apiSchool.managementType || null,
    status: normalized.status || apiSchool.status || 'pending',
    createdAt: normalized.createdAt || apiSchool.created_at || apiSchool.createdAt || '',
    updatedAt: normalized.updatedAt || apiSchool.updated_at || apiSchool.updatedAt || '',
    userCount: normalized.userCount || apiSchool.user_count || apiSchool.userCount || 0,
  };
};

export const transformSchools = (apiSchools: any[]): School[] => {
  if (!Array.isArray(apiSchools)) {
    console.warn('[transformSchools] Expected array, got:', typeof apiSchools);
    return [];
  }
  return apiSchools.map(school => transformSchool(school));
};

// User-specific transformations  
export interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  school_id?: number;
  school_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: number;
  schoolName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const transformUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    email: apiUser.email,
    role: apiUser.role,
    schoolId: apiUser.school_id,
    schoolName: apiUser.school_name,
    status: apiUser.status,
    createdAt: apiUser.created_at,
    updatedAt: apiUser.updated_at,
  };
};

export const transformUsers = (apiUsers: ApiUser[]): User[] => {
  return apiUsers.map(transformUser);
};
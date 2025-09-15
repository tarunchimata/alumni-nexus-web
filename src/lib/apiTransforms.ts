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
  id: number;
  school_name: string;
  udise_code: string | null;
  state_name: string;
  district_name: string;
  block_name: string | null;
  institution_id: string;
  school_type: string | null;
  management: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export interface School {
  id: number;
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

export const transformSchool = (apiSchool: ApiSchool): School => {
  return {
    id: apiSchool.id,
    schoolName: apiSchool.school_name,
    udiseCode: apiSchool.udise_code,
    stateName: apiSchool.state_name,
    districtName: apiSchool.district_name,
    blockName: apiSchool.block_name,
    institutionId: apiSchool.institution_id,
    schoolType: apiSchool.school_type,
    management: apiSchool.management,
    status: apiSchool.status,
    createdAt: apiSchool.created_at,
    updatedAt: apiSchool.updated_at,
    userCount: apiSchool.user_count,
  };
};

export const transformSchools = (apiSchools: ApiSchool[]): School[] => {
  return apiSchools.map(transformSchool);
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
/**
 * Authentication utilities and role-based routing helpers
 */
import * as Sentry from "@sentry/react";

export type UserRole = 'learner' | 'teacher' | 'parent' | 'leader' | 'admin' | 'data_entry' | 'school' | 'curriculum_designer';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  tenant: string | null;
  school_id?: string | null;
  tenant_name?: string;
  tenant_code?: string;
  teacher_school_ids?: string[];
  teacher_schools?: Array<{
    id: string;
    name: string;
    code?: string;
  }>;
  dashboard_url?: string;
  date_joined: string;
  is_active: boolean;
  avatar_url?: string | null;
}

const SENTRY_TAG_KEYS = [
  "role",
  "tenant_id",
  "tenant_code",
  "school_id",
  "selected_school_id",
  "school_name",
  "teacher_school_count",
  "dashboard_url",
];

const clearSentryContext = (): void => {
  Sentry.setUser(null);
  Sentry.setContext("tenant", null as unknown as Record<string, unknown>);
  Sentry.setContext("school", null as unknown as Record<string, unknown>);
  SENTRY_TAG_KEYS.forEach((key) => {
    Sentry.setTag(key, null as unknown as string);
  });
};

export const applySentryUserContext = (user: User | null): void => {
  if (!user) {
    clearSentryContext();
    return;
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const selectedSchoolId = getSelectedTeacherSchoolId();
  const selectedSchoolName = getSelectedTeacherSchoolName();

  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
    segment: user.role,
    ...(fullName ? { name: fullName } : {}),
  });

  Sentry.setTag("role", user.role);

  if (user.tenant) {
    Sentry.setTag("tenant_id", user.tenant);
  }

  if (user.tenant_code) {
    Sentry.setTag("tenant_code", user.tenant_code);
  }

  if (user.school_id) {
    Sentry.setTag("school_id", user.school_id);
  }

  if (selectedSchoolId) {
    Sentry.setTag("selected_school_id", selectedSchoolId);
  }

  if (selectedSchoolName) {
    Sentry.setTag("school_name", selectedSchoolName);
  }

  if (user.teacher_school_ids?.length) {
    Sentry.setTag("teacher_school_count", String(user.teacher_school_ids.length));
  }

  if (user.dashboard_url) {
    Sentry.setTag("dashboard_url", user.dashboard_url);
  }

  Sentry.setContext("tenant", {
    id: user.tenant ?? null,
    name: user.tenant_name ?? null,
    code: user.tenant_code ?? null,
  });

  Sentry.setContext("school", {
    id: user.school_id ?? null,
    selected_id: selectedSchoolId ?? null,
    name: selectedSchoolName ?? null,
    teacher_school_count: user.teacher_school_ids?.length ?? 0,
  });
};

/**
 * Get the dashboard route for a given user role
 */
export const getDashboardRoute = (role: UserRole): string => {
  const dashboardMap: Record<UserRole, string> = {
    learner: '/student',
    teacher: '/teacher',
    parent: '/parent',
    leader: '/leader',
    school: '/school',
    admin: '/admin',
    data_entry: '/admin/curriculum-entry',
    curriculum_designer: '/admin/curriculum-designer',
  };

  return dashboardMap[role] || '/student';
};

/**
 * Check if user has permission to access a route
 */
export const canAccessRoute = (userRole: UserRole, routePath: string): boolean => {
  const roleRoutes: Record<UserRole, string[]> = {
    learner: ['/student', '/'],
    teacher: ['/teacher', '/'],
    parent: ['/parent', '/'],
    leader: ['/leader', '/'],
    school: ['/school', '/leader', '/'],
    admin: ['/admin', '/leader', '/teacher', '/parent', '/student', '/'],
    data_entry: ['/admin/curriculum-entry', '/'],
    curriculum_designer: ['/admin/curriculum-designer', '/'],
  };
  
  const allowedRoutes = roleRoutes[userRole] || [];
  return allowedRoutes.some(route => routePath.startsWith(route));
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    learner: 'Student',
    teacher: 'Teacher',
    parent: 'Parent',
    leader: 'Leader',
    school: 'School Admin',
    admin: 'Administrator',
    data_entry: 'Data Entry',
    curriculum_designer: 'Curriculum Designer',
  };
  
  return roleNames[role] || 'User';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = sessionStorage.getItem('access_token'); // tokens in sessionStorage
  return !!token;
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

/**
 * Clear authentication data
 */
export const clearAuth = (): void => {
  sessionStorage.removeItem('access_token'); // tokens in sessionStorage
  sessionStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('selected_school_id');
  localStorage.removeItem('selected_school_name');
  clearSentryContext();
};

export const setSelectedTeacherSchool = (schoolId: string, schoolName?: string): void => {
  localStorage.setItem('selected_school_id', schoolId);
  if (schoolName) {
    localStorage.setItem('selected_school_name', schoolName);
  } else {
    localStorage.removeItem('selected_school_name');
  }
};

export const getSelectedTeacherSchoolId = (): string | null =>
  localStorage.getItem('selected_school_id');

export const getSelectedTeacherSchoolName = (): string | null =>
  localStorage.getItem('selected_school_name');

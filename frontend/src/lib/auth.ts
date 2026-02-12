/**
 * Authentication utilities and role-based routing helpers
 */

export type UserRole = 'learner' | 'teacher' | 'parent' | 'leader' | 'admin' | 'data_entry' | 'school';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  tenant: string | null;
  tenant_name?: string;
  tenant_code?: string;
  dashboard_url?: string;
  date_joined: string;
  is_active: boolean;
  avatar_url?: string | null;
}

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
    school: ['/school', '/leader', '/'], // School admin can access school dashboard
    admin: ['/admin', '/leader', '/teacher', '/parent', '/student', '/'], // Admin can access all
    data_entry: ['/admin/curriculum-entry', '/'],
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
  };
  
  return roleNames[role] || 'User';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
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
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

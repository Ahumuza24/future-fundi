/**
 * Role constants for Future Fundi.
 *
 * Single source of truth for role string literals. Import ROLES instead of
 * hard-coding strings like 'admin', 'teacher', etc.
 *
 * Usage:
 *   import { ROLES, isAdminRole, isTeacherRole } from '@/lib/roles';
 *   if (user.role === ROLES.ADMIN) { ... }
 */

import type { UserRole } from '@/lib/auth';

// ── Role string constants ────────────────────────────────────────────────────

export const ROLES = {
  LEARNER: 'learner',
  TEACHER: 'teacher',
  PARENT: 'parent',
  LEADER: 'leader',
  ADMIN: 'admin',
  DATA_ENTRY: 'data_entry',
  SCHOOL: 'school',
} as const satisfies Record<string, UserRole>;

// ── Role sets (for permission checks) ────────────────────────────────────────

/** Roles that can access the admin dashboard. */
export const ADMIN_ROLES: ReadonlySet<UserRole> = new Set([ROLES.ADMIN]);

/** Roles that can manage school-level data. */
export const SCHOOL_ROLES: ReadonlySet<UserRole> = new Set([
  ROLES.SCHOOL,
  ROLES.LEADER,
]);

/** Roles that can deliver sessions and capture artifacts. */
export const TEACHER_ROLES: ReadonlySet<UserRole> = new Set([ROLES.TEACHER]);

/** All authenticated user roles. */
export const ALL_ROLES: ReadonlySet<UserRole> = new Set(Object.values(ROLES));

// ── Type guard helpers ────────────────────────────────────────────────────────

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.has(role);
}

export function isTeacherRole(role: UserRole): boolean {
  return TEACHER_ROLES.has(role);
}

export function isSchoolRole(role: UserRole): boolean {
  return SCHOOL_ROLES.has(role);
}

export function isLearnerRole(role: UserRole): boolean {
  return role === ROLES.LEARNER;
}

// ── Dashboard URL map ─────────────────────────────────────────────────────────

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  [ROLES.LEARNER]: '/student/dashboard',
  [ROLES.TEACHER]: '/teacher/dashboard',
  [ROLES.PARENT]: '/parent/portal',
  [ROLES.LEADER]: '/leader/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.DATA_ENTRY]: '/admin/dashboard',
  [ROLES.SCHOOL]: '/school/dashboard',
};

// ── Human-readable labels ─────────────────────────────────────────────────────

export const ROLE_LABEL: Record<UserRole, string> = {
  [ROLES.LEARNER]: 'Student',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.PARENT]: 'Parent',
  [ROLES.LEADER]: 'Leader',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.DATA_ENTRY]: 'Data Entry',
  [ROLES.SCHOOL]: 'School Admin',
};

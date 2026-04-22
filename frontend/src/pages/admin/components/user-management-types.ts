export type UserRole = 'learner' | 'teacher' | 'parent' | 'leader' | 'admin' | 'data_entry';

export interface ManagedUser {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_active: boolean;
    tenant?: { id: string; name: string };
    schools?: Array<{ id: string; name: string }>;
    date_joined: string;
    last_login: string | null;
    current_class?: string;
}

export interface School {
    id: string;
    name: string;
}

export interface UserStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    role_distribution: Record<string, number>;
    recent_registrations_30d: number;
    active_today: number;
}

export interface UserFormData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    password: string;
    is_active: boolean;
    school_ids: string[];
    current_class: string;
}

export const STUDENT_CLASSES = [
    "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7",
    "S.1", "S.2", "S.3", "S.4", "S.5", "S.6",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
] as const;

export const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    learner: { bg: 'bg-blue-100', text: 'text-blue-700' },
    teacher: { bg: 'bg-green-100', text: 'text-green-700' },
    parent: { bg: 'bg-purple-100', text: 'text-purple-700' },
    leader: { bg: 'bg-orange-100', text: 'text-orange-700' },
    admin: { bg: 'bg-red-100', text: 'text-red-700' },
    data_entry: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
};

export const getRoleColors = (role: string): { bg: string; text: string } =>
    ROLE_COLORS[role] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };

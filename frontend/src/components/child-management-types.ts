export interface Course {
    id: string;
    name: string;
    description: string;
}

export interface Child {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth?: string;
    age?: number;
    current_school?: string;
    current_class?: string;
    consent_media: boolean;
    equity_flag: boolean;
    joined_at?: string;
}

export interface ChildFormData {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    current_school: string;
    current_class: string;
    username?: string;
    password?: string;
    password_confirm?: string;
    new_password?: string;
    new_password_confirm?: string;
    consent_media: boolean;
    equity_flag: boolean;
    pathway_ids?: string[];
}

export interface ApiError {
    response?: {
        data?: {
            [key: string]: string[] | string | undefined;
            detail?: string;
        };
    };
}

export const PRIMARY_CLASSES = ['P.1', 'P.2', 'P.3', 'P.4', 'P.5', 'P.6', 'P.7'] as const;
export const SECONDARY_CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'] as const;
export const GRADE_CLASSES = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7',
    'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13',
] as const;

export const EMPTY_FORM: ChildFormData = {
    first_name: '', last_name: '', date_of_birth: '', current_school: '',
    current_class: '', username: '', password: '', password_confirm: '',
    consent_media: true, equity_flag: false, pathway_ids: [],
};

/**
 * Child Service
 * Business logic for child/learner management operations
 */
import { childApi, courseApi } from "@/lib/api";
import type { AxiosError } from "axios";

// --- Types ---

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

interface ApiErrorResponse {
  response?: {
    data?: {
      [key: string]: string[] | string | undefined;
      detail?: string;
    };
  };
}

// --- Service Functions ---

/**
 * Fetch all children for the current parent user
 */
export async function fetchChildren(): Promise<Child[]> {
  const response = await childApi.getAll();
  return response.data || [];
}

/**
 * Fetch all available courses for enrollment
 */
export async function fetchAvailableCourses(): Promise<Course[]> {
  const response = await courseApi.getAll();
  return response.data || [];
}

/**
 * Create a new child/learner
 */
export async function createChild(formData: ChildFormData): Promise<Child> {
  const payload = {
    first_name: formData.first_name,
    last_name: formData.last_name,
    date_of_birth: formData.date_of_birth || null,
    current_school: formData.current_school,
    current_class: formData.current_class,
    username: formData.username,
    password: formData.password,
    consent_media: formData.consent_media,
    equity_flag: formData.equity_flag,
    pathway_ids: formData.pathway_ids || [],
  };

  const response = await childApi.create(payload);
  return response.data;
}

/**
 * Update an existing child
 */
export async function updateChild(
  childId: string,
  formData: ChildFormData
): Promise<Child> {
  const payload: Partial<ChildFormData> = {
    first_name: formData.first_name,
    last_name: formData.last_name,
    date_of_birth: formData.date_of_birth || null,
    current_school: formData.current_school,
    current_class: formData.current_class,
    consent_media: formData.consent_media,
    equity_flag: formData.equity_flag,
  };

  if (formData.new_password) {
    payload.new_password = formData.new_password;
  }

  const response = await childApi.update(childId, payload);
  return response.data;
}

/**
 * Delete a child
 */
export async function deleteChild(childId: string): Promise<void> {
  await childApi.delete(childId);
}

/**
 * Extract error messages from API error response
 */
export function extractErrorMessages(error: AxiosError): string[] {
  const apiError = error as unknown as ApiErrorResponse;
  const errorData = apiError.response?.data;

  if (!errorData) {
    return ["An unexpected error occurred"];
  }

  const messages: string[] = [];

  Object.entries(errorData).forEach(([key, value]) => {
    if (key === "detail" && typeof value === "string") {
      messages.push(value);
    } else if (Array.isArray(value)) {
      value.forEach((msg) => messages.push(`${key}: ${msg}`));
    } else if (typeof value === "string" && key !== "detail") {
      messages.push(`${key}: ${value}`);
    }
  });

  return messages.length > 0 ? messages : ["An unexpected error occurred"];
}

/**
 * Validate child form data
 */
export function validateChildForm(
  formData: ChildFormData,
  isEditing: boolean
): string[] {
  const errors: string[] = [];

  if (!formData.first_name?.trim()) {
    errors.push("First name is required");
  }

  if (!formData.last_name?.trim()) {
    errors.push("Last name is required");
  }

  if (!isEditing) {
    if (!formData.username?.trim()) {
      errors.push("Username is required for new children");
    }
    if (!formData.password) {
      errors.push("Password is required for new children");
    }
    if (formData.password !== formData.password_confirm) {
      errors.push("Passwords do not match");
    }
  } else if (formData.new_password) {
    if (formData.new_password !== formData.new_password_confirm) {
      errors.push("New passwords do not match");
    }
    if (formData.new_password.length < 8) {
      errors.push("New password must be at least 8 characters");
    }
  }

  return errors;
}

/**
 * Create initial form state
 */
export function createInitialFormState(): ChildFormData {
  return {
    first_name: "",
    last_name: "",
    date_of_birth: "",
    current_school: "",
    current_class: "",
    username: "",
    password: "",
    password_confirm: "",
    consent_media: true,
    equity_flag: false,
    pathway_ids: [],
  };
}

/**
 * Create form state from existing child
 */
export function createFormStateFromChild(child: Child): ChildFormData {
  return {
    first_name: child.first_name,
    last_name: child.last_name,
    date_of_birth: child.date_of_birth || "",
    current_school: child.current_school || "",
    current_class: child.current_class || "",
    consent_media: child.consent_media,
    equity_flag: child.equity_flag,
    pathway_ids: [],
  };
}

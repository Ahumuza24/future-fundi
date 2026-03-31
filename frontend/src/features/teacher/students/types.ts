export interface TeacherStudentDetail {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_email: string;
  current_school: string;
  current_class: string;
  badges_count: number;
  credentials_count: number;
  attendance_rate: number;
}

export interface TeacherArtifactMedia {
  type?: string;
  url?: string;
  filename?: string;
  thumbnail_url?: string;
}

export interface TeacherArtifactItem {
  id: string;
  title: string;
  reflection: string;
  submitted_at: string;
  module_name?: string;
  status: string;
  uploaded_by_student: boolean;
  rejection_reason?: string;
  media_refs?: TeacherArtifactMedia[];
}

export interface TeacherBadgeItem {
  id: string;
  badge_name: string;
  description: string;
  awarded_by_name: string;
  awarded_at: string;
  module_name?: string;
}

export interface TeacherCredentialItem {
  id: string;
  name: string;
  issuer: string;
  issued_at: string;
}

export interface TeacherEnrollment {
  id: string;
  course: string;
  course_name: string;
  current_level_name: string;
  enrolled_at: string;
  is_active: boolean;
}

export interface TeacherModuleOption {
  id: string;
  name: string;
  badge_name?: string;
  description?: string;
}

export interface TeacherProgressFormState {
  completed_module_ids: string[];
  artifacts: number;
  score: number;
}

export interface TeacherBadgeFormState {
  badge_name: string;
  description: string;
}

export interface TeacherProgressRequirements {
  modules: { required: number; completed: number; met: boolean };
  artifacts: { required: number; submitted: number; met: boolean };
  assessment: { required: number; score: number; met: boolean };
}

export interface TeacherProgressData {
  id: string;
  level: string;
  level_name: string;
  level_number: number;
  modules_completed: number;
  completed_module_ids: string[];
  artifacts_submitted: number;
  assessment_score: number;
  teacher_confirmed: boolean;
  completed: boolean;
  completion_percentage: number;
  available_modules?: TeacherModuleOption[];
  requirements: TeacherProgressRequirements;
}

export interface TeacherStudentDetailResponse {
  student: TeacherStudentDetail;
  badges?: TeacherBadgeItem[];
  credentials?: TeacherCredentialItem[];
  enrollments?: TeacherEnrollment[];
  artifacts?: TeacherArtifactItem[];
}

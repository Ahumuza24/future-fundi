export type ContentStatus = 'draft' | 'active' | 'archived';

export interface CmsPathway {
  id: string;
  title: string;
  description: string;
  status: ContentStatus;
  track_count: number;
  created_at: string;
  updated_at: string;
}

export interface CmsTrack {
  id: string;
  title: string;
  description: string;
  pathway: string;
  pathway_title: string;
  status: ContentStatus;
  program_count: number;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface CmsProgram {
  id: string;
  title: string;
  description: string;
  track: string;
  track_title: string;
  pathway_title: string;
  status: ContentStatus;
  module_count: number;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface CmsModule {
  id: string;
  title: string;
  description: string;
  program: string;
  program_title: string;
  track_title: string;
  pathway_title: string;
  status: ContentStatus;
  outcome_statement: string;
  duration_sessions: number;
  teacher_notes: string;
  sequence_order: number;
  needs_review: boolean;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  unit_count: number;
  structural_warning?: string;
  created_at: string;
  updated_at: string;
}

export interface CmsUnit {
  id: string;
  title: string;
  description: string;
  module: string;
  module_title: string;
  status: ContentStatus;
  sequence_order: number;
  lesson_count: number;
  structural_warning?: string;
  created_at: string;
  updated_at: string;
}

export interface CmsLesson {
  id: string;
  title: string;
  description: string;
  unit: string;
  unit_title: string;
  status: ContentStatus;
  sequence_order: number;
  task_count: number;
  structural_warning?: string;
  created_at: string;
  updated_at: string;
}

export interface CmsTask {
  id: string;
  title: string;
  description: string;
  lesson: string;
  lesson_title: string;
  status: ContentStatus;
  sequence_order: number;
  task_type: string;
  structural_warning?: string;
  created_at: string;
  updated_at: string;
}

export interface PeerReviewQueueItem {
  id: string;
  title: string;
  program_title: string;
  track_title: string;
  pathway_title: string;
  status: ContentStatus;
  needs_review: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  updated_at: string;
}

export interface HierarchyContext {
  pathway: CmsPathway | null;
  track: CmsTrack | null;
  program: CmsProgram | null;
  module: CmsModule | null;
  unit: CmsUnit | null;
  lesson: CmsLesson | null;
}

export type WizardStep =
  | 'pathway'
  | 'track'
  | 'program'
  | 'module'
  | 'unit'
  | 'lesson'
  | 'task'
  | 'review';

export const WIZARD_STEPS: WizardStep[] = [
  'pathway',
  'track',
  'program',
  'module',
  'unit',
  'lesson',
  'task',
  'review',
];

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  pathway: 'Pathway',
  track: 'Track',
  program: 'Program',
  module: 'Module',
  unit: 'Unit',
  lesson: 'Lesson',
  task: 'Task',
  review: 'Review & Publish',
};

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
};

export const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: 'text-fundi-yellow bg-fundi-yellow/10',
  active: 'text-fundi-lime bg-fundi-lime/10',
  archived: 'text-gray-400 bg-gray-400/10',
};

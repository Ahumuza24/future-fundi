export type CompletionStatus = "not_started" | "in_progress" | "partial_complete" | "complete";
export type FlagType = "at_risk" | "missed_sessions" | "behind_schedule";
export type PipelineStatus = "stalled" | "needs_push" | "on_track" | "certified";

export interface CohortLearnerRow {
  learner_id: string;
  learner_name: string;
  level: string;
  pathway: string;
  module: string;
  module_id: string | null;
  units_completed: number;
  units_total: number;
  attendance_count: number;
  completion_status: CompletionStatus;
  microcredential_eligible: boolean;
  completion_pct: number;
}

export interface PendingBadgeAward {
  learner_id: string;
  learner_name: string;
  badge_title: string;
  badge_template_id: string;
  unit_title: string;
  module_title: string;
  module_id: string;
  evidence_ids: string[];
}

export interface RecentBadge {
  learner_name: string;
  badge_title: string;
  date_awarded: string | null;
}

export interface BadgeReadinessData {
  pending_awards: PendingBadgeAward[];
  recently_issued: RecentBadge[];
}

export interface EligibleLearner {
  learner_id: string;
  learner_name: string;
  module: string;
  module_id: string;
  microcredential_template: string;
  microcredential_template_id: string | null;
  evidence_ids: string[];
  badge_record_ids: string[];
  artifact_submitted: boolean;
  reflection_submitted: boolean;
  teacher_verified: boolean;
  quiz_passed: boolean;
}

export interface NotYetEligibleLearner {
  learner_id: string;
  learner_name: string;
  module: string;
  module_id: string;
  units_completed: number;
  units_total: number;
  missing: string[];
}

export interface MicrocredentialReadinessData {
  eligible: EligibleLearner[];
  not_yet_eligible: NotYetEligibleLearner[];
}

export interface InterventionFlag {
  learner_id: string;
  learner_name: string;
  flag_type: FlagType;
  detail: string;
  module: string;
}

export interface CertificationPipelineRow {
  learner_id: string;
  learner_name: string;
  program: string;
  microcredentials_earned: number;
  microcredentials_required: number;
  capstone_submitted: boolean;
  status: PipelineStatus;
}

export interface DualViewModule {
  id: string;
  name: string;
  outcome_statement: string;
  units_completed: number;
  units_total: number;
  completion_status: CompletionStatus;
  microcredential_eligible: boolean;
}

export interface DualViewLesson {
  id: string;
  title: string;
  duration_minutes: number;
  learner_objectives: string[];
  learner_content: string;
}

export interface DualViewArtifact {
  id: string;
  title: string;
  status: string;
  submitted_at: string;
}

export interface DualViewLearnerContent {
  module: DualViewModule | null;
  lesson: DualViewLesson | null;
  artifacts: DualViewArtifact[];
}

export interface DualViewLessonGuide {
  teacher_content: string;
  resource_links: Array<{ url: string; title: string; type: string }>;
}

export interface DualViewTaskRubric {
  task_id: string;
  task_title: string;
  teacher_rubric: string;
  answer_key: string;
}

export interface DualViewTeacherContent {
  module_notes: string;
  lesson_guide: DualViewLessonGuide | null;
  task_rubric: DualViewTaskRubric | null;
}

export interface DualViewData {
  learner: {
    id: string;
    name: string;
    level: string;
    equity_flag: boolean;
    growth: { leaves_count: number; fruit_count: number } | null;
  };
  learner_content: DualViewLearnerContent;
  teacher_content: DualViewTeacherContent;
}

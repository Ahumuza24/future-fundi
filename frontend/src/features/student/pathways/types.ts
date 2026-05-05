export interface PathwayEnrollment {
  id: string;
  enrolledAt: string | null;
}

export interface PathwayCourse {
  id: string;
  name: string;
  description: string;
}

export interface PathwayLevelProgress {
  completionPercentage: number;
  completed: boolean;
  completedAt: string | null;
}

export interface PathwayModuleMedia {
  id?: string;
  name?: string;
  title?: string;
  url?: string;
  file?: string;
  path?: string;
  src?: string;
  link?: string;
  type?: string;
  content_type?: string;
}

export interface PathwayModule {
  id: string;
  name: string;
  description: string;
  content: string;
  badgeName?: string | null;
  mediaFiles: PathwayModuleMedia[];
}

export interface PathwayLevel {
  id: string;
  levelNumber: number;
  name: string;
  description: string;
  learningOutcomes: string[];
  requiredModulesCount: number;
  requiredArtifactsCount: number;
  requiredAssessmentScore: number;
  requiresTeacherConfirmation: boolean;
  modules: PathwayModule[];
  progress: PathwayLevelProgress;
  isLocked: boolean;
  isCurrent: boolean;
}

export interface PathwayCurrentLevel {
  id: string | null;
  name: string | null;
  levelNumber: number;
}

export interface PathwayProgressSummary {
  overallPercentage: number;
  completedLevels: number;
  totalLevels: number;
}

export interface GatePayload {
  is_open: boolean;
  reason: string;
  detail: string;
}

export interface AccessPayload {
  can_preview: boolean;
  can_open: boolean;
  can_submit: boolean;
}

export interface HierarchyTask {
  id: string;
  title: string;
  type: string;
  evidence_required: boolean;
  artifact_type: string | null;
  gate: GatePayload;
  access: AccessPayload;
  learner_instructions?: string;
}

export interface HierarchyLesson {
  id: string;
  title: string;
  duration_minutes: number;
  learner_objectives: string[];
  learner_content?: string;
  gate: GatePayload;
  access: AccessPayload;
  tasks: HierarchyTask[];
}

export interface HierarchyUnit {
  id: string;
  title: string;
  learning_objectives: string[];
  gate: GatePayload;
  access: AccessPayload;
  lessons: HierarchyLesson[];
}

export interface HierarchyModule {
  id: string;
  name: string;
  outcome_statement: string;
  gate: GatePayload;
  access: AccessPayload;
  units: HierarchyUnit[];
}

export interface HierarchyProgram {
  id: string;
  title: string;
  gate: GatePayload;
  access: AccessPayload;
  modules: HierarchyModule[];
}

export interface HierarchyTrack {
  id: string;
  title: string;
  gate: GatePayload;
  access: AccessPayload;
  programs: HierarchyProgram[];
}

export interface PathwayHierarchy {
  id: string;
  name: string;
  gate: GatePayload;
  access: AccessPayload;
  tracks: HierarchyTrack[];
}

export interface PathwayData {
  enrollment: PathwayEnrollment;
  course: PathwayCourse;
  currentLevel: PathwayCurrentLevel;
  progress: PathwayProgressSummary;
  levels: PathwayLevel[];
  hierarchy?: PathwayHierarchy;
}

export interface PathwayModuleWithLevel extends PathwayModule {
  levelName?: string | null;
  trackTitle?: string | null;
  programTitle?: string | null;
  outcome_statement?: string;
  gate?: GatePayload;
  access?: AccessPayload;
  units?: HierarchyUnit[];
}

export interface SelectedMedia {
  url: string;
  type: string;
  name: string;
}

export interface NormalizedMediaResource {
  key: string;
  url?: string;
  displayName: string;
  typeLabel: string;
  rawType?: string;
  isImage: boolean;
  isVideo: boolean;
}

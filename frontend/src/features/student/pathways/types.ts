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

export interface PathwayData {
  enrollment: PathwayEnrollment;
  course: PathwayCourse;
  currentLevel: PathwayCurrentLevel;
  progress: PathwayProgressSummary;
  levels: PathwayLevel[];
}

export interface PathwayModuleWithLevel extends PathwayModule {
  levelName?: string | null;
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

export interface StudentDashboardLearner {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  currentSchool: string;
  currentClass: string;
  age?: number;
}

export type StudentPathwayStatus = 'not_started' | 'good' | 'warning' | 'critical';

export interface StudentDashboardPathway {
  id: string;
  title: string;
  description?: string;
  progress: number;
  currentLevel: string;
  currentLevelNumber?: number;
  currentModule: string;
  totalLevels: number;
  currentLevelProgress?: number;
  color: string;
  icon: string;
  status: StudentPathwayStatus;
  microCredentialsEarned: number;
  totalMicroCredentials: number;
}

export interface StudentDashboardLesson {
  id: string;
  title: string;
  date: string;
  time?: string;
  type?: string;
  color: string;
  pathway: string;
  microcredential: string;
  fullDate: string;
  startTime: string;
  endTime: string;
}

export interface StudentDashboardBadge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  earnedAt: string | null;
  earnedDate?: string;
  type: string;
  pathway: string;
  color: string;
  isLocked: boolean;
}

export interface StudentDashboardData {
  learner: StudentDashboardLearner;
  pathways: StudentDashboardPathway[];
  upcomingLessons: StudentDashboardLesson[];
  activeProjects?: unknown[];
  badges: StudentDashboardBadge[];
}

export interface StudentArtifactMediaRef {
  type?: string;
  url?: string;
  filename?: string;
  name?: string;
  label?: string;
  size?: number;
}

export interface StudentArtifact {
  id: string;
  title: string;
  reflection: string;
  submitted_at: string | null;
  teacher_name: string;
  media_refs: StudentArtifactMediaRef[];
  status?: string;
  rejection_reason?: string;
}

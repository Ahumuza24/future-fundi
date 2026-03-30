export type StudentProgressStatus = "on_track" | "needs_attention" | "completed";

export interface StudentPathwaySummary {
  id: string;
  name: string;
}

export interface StudentProgressSummary {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  currentLevel: string;
  completionPercentage: number;
  modulesCompleted: number;
  totalModules: number;
  artifactsSubmitted: number;
  assessmentScore: number;
  status: StudentProgressStatus;
}

export interface StudentBadgeSummary {
  id: string;
  name: string;
  description: string;
  moduleName: string | null;
  awardedAt: string | null;
}

export interface StudentArtifactMedia {
  type: string;
  url: string | null;
  filename?: string | null;
  thumbnailUrl?: string | null;
}

export interface StudentArtifactSummary {
  id: string;
  title: string;
  submittedAt: string;
  moduleName: string | null;
  status: string;
  uploadedByStudent: boolean;
  media: StudentArtifactMedia[];
}

export interface StudentAttendanceSession {
  id: string;
  date: string;
  moduleName: string | null;
  status: string;
}

export interface StudentAttendanceRecord {
  id: string;
  status: string;
  notes: string;
  markedAt: string;
  session: StudentAttendanceSession | null;
}

export interface SchoolStudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username?: string | null;
  currentClass: string;
  consentMedia: boolean;
  equityFlag: boolean;
  joinedAt?: string | null;
  parentName?: string | null;
  pathways: StudentPathwaySummary[];
  progress: StudentProgressSummary[];
  badges: StudentBadgeSummary[];
  artifacts: StudentArtifactSummary[];
  attendance: StudentAttendanceRecord[];
}

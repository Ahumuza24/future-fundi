export interface GrowthBadge {
  title: string;
  date_awarded: string | null;
  icon_url: string;
}

export interface GrowthMicrocredential {
  title: string;
  module: string;
  date_issued: string | null;
}

export interface GrowthSummary {
  level: string;
  equity_flag: boolean;
  leaves_count: number;
  fruit_count: number;
  roots_score: Record<string, number>;
  trunk_score: Record<string, number>;
  branches: Array<{ branch_name: string; score: number; primary: boolean }>;
  badges: GrowthBadge[];
  microcredentials: GrowthMicrocredential[];
}

export interface ModuleProgressData {
  module_id: string;
  module_name: string;
  outcome_statement: string;
  pathway: string;
  units_completed: number;
  units_total: number;
  completion_pct: number;
  microcredential_eligible: boolean;
  status: string;
}

export interface ArtifactMediaRef {
  type: string;
  url: string;
  filename: string;
}

export interface EvidenceArtifact {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  evidence_status?: "pending" | "verified" | "rejected" | "corrected";
  submitted_at: string | null;
  module: string;
  task?: string;
  uploaded_by_student: boolean;
  reflection: string;
  media_refs: ArtifactMediaRef[];
}

export interface CohortPosition {
  level: string;
  peers_above: number;
  peers_same: number;
  peers_below: number;
  total_peers: number;
}

export interface IssuedCertification {
  title: string;
  program: string;
  date_issued: string | null;
}

export interface InProgressCertification {
  program_id: string;
  microcredentials_earned: number;
  microcredentials_required: number;
}

export interface CertificationsData {
  issued: IssuedCertification[];
  in_progress: InProgressCertification[];
}

export const LEVEL_LABELS: Record<string, string> = {
  explorer: "Explorer",
  builder: "Builder",
  practitioner: "Practitioner",
  pre_professional: "Pre-Professional",
};

export const ARTIFACT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const ARTIFACT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export interface Pathway {
  id: string;
  title: string;
  description: string;
  progress: number;
  currentLevel: string;
  currentLevelNumber: number;
  currentModule: string;
  totalLevels: number;
  currentLevelProgress: number;
  status: string;
  microCredentialsEarned: number;
  totalMicroCredentials: number;
}

export interface UpcomingLesson {
  id: string;
  title: string;
  pathway: string;
  date: string;
  time: string;
  startTime: string;
  type: "session" | "activity";
}

export interface StudentDashboardData {
  learner: {
    firstName: string;
    lastName: string;
    fullName: string;
    currentSchool: string;
    currentClass: string;
  };
  pathways: Pathway[];
  upcomingLessons: UpcomingLesson[];
}

export const PATHWAY_STATUS_STYLE: Record<string, string> = {
  good: "bg-fundi-lime/10 text-[#496400]",
  warning: "bg-fundi-yellow/20 text-[#d4b800]",
  critical: "bg-fundi-red/15 text-fundi-red",
  not_started: "bg-[#e8e8e8] text-[#5b5b5b]",
};

export const PATHWAY_STATUS_LABEL: Record<string, string> = {
  good: "On Track",
  warning: "Needs Attention",
  critical: "Behind",
  not_started: "Not Started",
};

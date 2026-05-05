export interface ChildSummary {
  learner_id: string;
  name: string;
  level: string;
  leaves_count: number;
  fruit_count: number;
  equity_flag: boolean;
}

export interface ChildGrowth {
  level: string;
  leaves_count: number;
  fruit_count: number;
  recent_badges: Array<{ title: string; date_awarded: string | null }>;
}

export interface ChildBadge {
  title: string;
  date_awarded: string | null;
}

export interface ChildMicrocredential {
  title: string;
  module: string;
  date_issued: string | null;
}

export interface ChildRecognition {
  badges: ChildBadge[];
  microcredentials: ChildMicrocredential[];
}

export interface ChildArtifact {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string | null;
  module: string;
  uploaded_by_student: boolean;
}

export interface ChildSession {
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  module_name: string;
  status: string;
}

export const LEVEL_LABELS: Record<string, string> = {
  explorer: "Explorer",
  builder: "Builder",
  practitioner: "Practitioner",
  pre_professional: "Pre-Professional",
};

export const ARTIFACT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export const ARTIFACT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export interface PathwayDemandRow {
  pathway: string;
  track: string;
  enrolled_learners: number;
}

export interface CompletionRateRow {
  pathway: string;
  module_name: string;
  learners_in_progress: number;
  learners_complete: number;
  completion_pct: number;
}

export interface BadgeDistributionRow {
  badge_title: string;
  unit_title: string;
  issued_count: number;
}

export interface MicrocredentialIssuanceRow {
  module_name: string;
  month: number;
  year: number;
  issued_count: number;
}

export interface CertificationRateRow {
  program_name: string;
  cert_title: string;
  issued_count: number;
  learners_enrolled: number;
}

export type LevelDistribution = Record<string, number>;
export type AgeBandBreakdown = Record<string, number>;

export const LEVEL_LABELS: Record<string, string> = {
  explorer: "Explorer",
  builder: "Builder",
  practitioner: "Practitioner",
  pre_professional: "Pre-Professional",
};

export const LEVEL_COLORS: Record<string, string> = {
  explorer: "bg-cyan-500",
  builder: "bg-lime-500",
  practitioner: "bg-purple-500",
  pre_professional: "bg-orange-500",
};

export const AGE_BAND_LABELS: Record<string, string> = {
  "6-8": "Ages 6–8",
  "9-12": "Ages 9–12",
  "13-15": "Ages 13–15",
  "16-18": "Ages 16–18",
  unknown: "Unknown",
};

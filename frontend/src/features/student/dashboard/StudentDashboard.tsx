import { useQuery } from "@tanstack/react-query";
import { learnerDashboardApi, studentApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Calendar, GraduationCap, Rocket } from "lucide-react";
import type {
  GrowthSummary,
  ModuleProgressData,
  EvidenceArtifact,
  CohortPosition,
  CertificationsData,
  StudentDashboardData,
} from "@/pages/student/learner-dashboard-types";
import { LEVEL_LABELS } from "@/pages/student/learner-dashboard-types";
import GrowthTreePanel from "@/pages/student/components/GrowthTreePanel";
import ModuleProgressPanel from "@/pages/student/components/ModuleProgressPanel";
import EvidencePortfolioPanel from "@/pages/student/components/EvidencePortfolioPanel";
import CohortPositionPanel from "@/pages/student/components/CohortPositionPanel";
import RecognitionPanel from "@/pages/student/components/RecognitionPanel";
import PathwaysPanel from "@/pages/student/components/PathwaysPanel";
import UpcomingSessionsPanel from "@/pages/student/components/UpcomingSessionsPanel";

function usePanel<T>(key: string, fetcher: () => Promise<{ data: T }>) {
  return useQuery<T>({ queryKey: [key], queryFn: () => fetcher().then((r) => r.data) });
}

const EMPTY_GROWTH: GrowthSummary = {
  level: "explorer",
  equity_flag: false,
  leaves_count: 0,
  fruit_count: 0,
  roots_score: {},
  trunk_score: {},
  branches: [],
  badges: [],
  microcredentials: [],
};

const EMPTY_CERTS: CertificationsData = { issued: [], in_progress: [] };
const EMPTY_COHORT: CohortPosition = {
  level: "explorer",
  peers_above: 0,
  peers_same: 0,
  peers_below: 0,
  total_peers: 0,
};

function PanelSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={`${className} bg-white rounded-xl animate-pulse shadow-[0_4px_24px_rgba(240,87,34,0.04)]`}
    />
  );
}

const TODAY = new Date().toLocaleDateString("en-UG", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function StudentDashboard() {
  const user = useAuthStore((state) => state.user);

  const studentDashboard = usePanel<StudentDashboardData>(
    "student-dashboard",
    studentApi.getDashboard
  );

  const growth = usePanel<GrowthSummary>("learner-growth", learnerDashboardApi.getGrowth);
  const moduleProgress = usePanel<ModuleProgressData | null>(
    "learner-module",
    learnerDashboardApi.getModuleProgress
  );
  const evidence = usePanel<{ artifacts: EvidenceArtifact[] }>(
    "learner-evidence",
    learnerDashboardApi.getEvidence
  );
  const cohort = usePanel<CohortPosition>(
    "learner-cohort",
    learnerDashboardApi.getCohortPosition
  );
  const certs = usePanel<CertificationsData>(
    "learner-certs",
    learnerDashboardApi.getCertifications
  );

  const growthData = growth.data ?? EMPTY_GROWTH;
  const certsData = certs.data ?? EMPTY_CERTS;
  const cohortData = cohort.data ?? EMPTY_COHORT;
  const firstName = user?.first_name ?? "Fundi";
  const pathways = studentDashboard.data?.pathways ?? [];
  const upcomingLessons = studentDashboard.data?.upcomingLessons ?? [];

  return (
    <div className="bg-[#f6f6f6] min-h-screen p-6 md:p-8 space-y-6">
      {/* Welcome banner + cohort rank */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-8 rounded-xl border-l-8 border-fundi-orange relative overflow-hidden shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
          <div className="relative z-10">
            <p className="text-fundi-orange font-bold tracking-widest text-xs uppercase mb-2">
              My Learning Journey
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#2f2f2f] tracking-tight mb-4 leading-tight">
              Keep Building, {firstName}!
            </h1>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 bg-[#f1f1f1] rounded-full px-3 py-1 text-sm text-[#5b5b5b] font-medium">
                <Calendar className="h-3.5 w-3.5" />
                {TODAY}
              </span>
              {growthData.level && (
                <span className="flex items-center gap-1.5 bg-fundi-cyan/10 text-fundi-cyan rounded-full px-3 py-1 text-sm font-bold">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {LEVEL_LABELS[growthData.level] ?? growthData.level}
                </span>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-fundi-orange/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-8 opacity-[0.05] pointer-events-none">
            <Rocket className="h-36 w-36" />
          </div>
        </div>

        <div className="lg:col-span-4">
          {cohort.isLoading ? (
            <PanelSkeleton className="h-full min-h-[200px]" />
          ) : (
            <CohortPositionPanel data={cohortData} />
          )}
        </div>
      </div>

      {/* Bento content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {studentDashboard.isLoading ? (
            <PanelSkeleton className="h-64" />
          ) : (
            <PathwaysPanel pathways={pathways} />
          )}
          {moduleProgress.isLoading ? (
            <PanelSkeleton className="h-64" />
          ) : (
            <ModuleProgressPanel data={moduleProgress.data ?? null} />
          )}
          {evidence.isLoading ? (
            <PanelSkeleton className="h-64" />
          ) : (
            <EvidencePortfolioPanel artifacts={evidence.data?.artifacts ?? []} />
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          {growth.isLoading ? (
            <PanelSkeleton className="h-64" />
          ) : (
            <GrowthTreePanel data={growthData} />
          )}
          {studentDashboard.isLoading ? (
            <PanelSkeleton className="h-48" />
          ) : (
            <UpcomingSessionsPanel lessons={upcomingLessons} />
          )}
          {certs.isLoading || growth.isLoading ? (
            <PanelSkeleton className="h-64" />
          ) : (
            <RecognitionPanel growth={growthData} certifications={certsData} />
          )}
        </div>
      </div>
    </div>
  );
}

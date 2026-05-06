import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { learnerDashboardApi, studentApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { ArrowRight, BookOpen, Calendar, GraduationCap, LockOpen, Rocket } from "lucide-react";
import type {
  GrowthSummary,
  ModuleProgressData,
  EvidenceArtifact,
  CertificationsData,
  StudentDashboardData,
  Pathway,
} from "@/pages/student/learner-dashboard-types";
import { LEVEL_LABELS } from "@/pages/student/learner-dashboard-types";
import GrowthTreePanel from "@/pages/student/components/GrowthTreePanel";
import EvidencePortfolioPanel from "@/pages/student/components/EvidencePortfolioPanel";
import RecognitionPanel from "@/pages/student/components/RecognitionPanel";
import UpcomingSessionsPanel from "@/pages/student/components/UpcomingSessionsPanel";
import { Button } from "@/components/ui/button";

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

function PanelSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={`${className} bg-white rounded-xl animate-pulse shadow-[0_4px_24px_rgba(240,87,34,0.04)]`}
    />
  );
}

function pickActivePathway(pathways: Pathway[]): Pathway | null {
  return (
    pathways.find((pathway) => pathway.progress > 0 && pathway.progress < 100)
    ?? pathways.find((pathway) => pathway.progress < 100)
    ?? pathways[0]
    ?? null
  );
}

function CurrentPathwayCard({
  pathway,
  moduleProgress,
}: {
  pathway: Pathway | null;
  moduleProgress: ModuleProgressData | null;
}) {
  if (!pathway) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-6 bg-fundi-orange rounded-full shrink-0" />
          <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-fundi-orange" />
            Current Pathway
          </h3>
        </div>
        <p className="text-sm text-[#5b5b5b] text-center py-8">
          No active pathway yet. Ask your teacher to enroll you.
        </p>
      </div>
    );
  }

  const progress = Math.max(0, Math.min(100, Math.round(pathway.progress)));
  const levelLabel = pathway.currentLevelNumber > 0
    ? `Level ${pathway.currentLevelNumber}`
    : "Starting soon";
  const nextMilestone = moduleProgress?.module_name
    ? `Complete ${moduleProgress.module_name} to keep progressing`
    : `Continue ${pathway.currentModule}`;

  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-fundi-orange/5 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="heading-font flex items-center gap-2 text-xl font-extrabold text-[#2f2f2f]">
            <BookOpen className="h-5 w-5 text-fundi-orange" />
            Current Pathway
          </h3>
          <span className="rounded-full bg-fundi-orange/10 px-3 py-1 text-xs font-extrabold text-fundi-orange">
            {levelLabel}
          </span>
        </div>

        <div className="mb-7">
          <div className="mb-2 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-fundi-orange">
                Active Pathway
              </p>
              <h4 className="heading-font line-clamp-2 text-2xl font-black tracking-tight text-[#2f2f2f]">
                {pathway.title}
              </h4>
            </div>
            <span className="shrink-0 text-xl font-black text-fundi-orange">{progress}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-[#e8e8e8]">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-fundi-orange to-fundi-orange-light transition-all duration-700"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 rounded-full bg-white/20" />
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-lg border-l-4 border-fundi-cyan bg-[#f1f1f1] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fundi-cyan text-white">
              <LockOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-fundi-cyan">
                Next Milestone
              </p>
              <p className="mt-1 text-sm font-bold text-[#5b5b5b]">{nextMilestone}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-[#f6f6f6] p-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#777]">
              Current Module
            </p>
            <p className="line-clamp-2 text-sm font-bold text-[#2f2f2f]">{pathway.currentModule}</p>
          </div>
          <Button asChild className="h-full min-h-16 gap-2 rounded-lg">
            <Link to={`/student/pathway/${pathway.id}`}>
              Continue Learning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
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
  const certs = usePanel<CertificationsData>(
    "learner-certs",
    learnerDashboardApi.getCertifications
  );

  const growthData = growth.data ?? EMPTY_GROWTH;
  const certsData = certs.data ?? EMPTY_CERTS;
  const firstName = user?.first_name ?? "Fundi";
  const pathways = studentDashboard.data?.pathways ?? [];
  const activePathway = pickActivePathway(pathways);
  const upcomingLessons = studentDashboard.data?.upcomingLessons ?? [];

  return (
    <div className="bg-[#f6f6f6] min-h-screen p-6 md:p-8 space-y-6">
      {/* Welcome banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-white p-8 rounded-xl border-l-8 border-fundi-orange relative overflow-hidden shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
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
      </div>

      {/* Bento content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {studentDashboard.isLoading || moduleProgress.isLoading ? (
            <PanelSkeleton className="h-64" />
          ) : (
            <CurrentPathwayCard
              pathway={activePathway}
              moduleProgress={moduleProgress.data ?? null}
            />
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

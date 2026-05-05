import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { teacherDashboardApi, teacherApi } from "@/lib/api";
import { toast } from "@/lib/toast";
import CohortProgressPanel from "./components/CohortProgressPanel";
import InterventionFlagsPanel from "./components/InterventionFlagsPanel";
import BadgeCompletionPanel from "./components/BadgeCompletionPanel";
import MicrocredentialReadinessPanel from "./components/MicrocredentialReadinessPanel";
import ArtifactQualityPanel from "./components/ArtifactQualityPanel";
import CertificationPipelinePanel from "./components/CertificationPipelinePanel";
import LearnerDetailView from "./components/LearnerDetailView";
import type {
  BadgeReadinessData,
  MicrocredentialReadinessData,
  InterventionFlag,
  PendingBadgeAward,
  CertificationPipelineRow,
  CohortLearnerRow,
  DualViewData,
} from "./teacher-dashboard-types";

const STALE_TIME_MS = 60_000;
const DUAL_VIEW_STALE_MS = 30_000;

function buildQueryOptions<T>(queryKey: string[], fetcher: () => Promise<{ data: T }>) {
  return {
    queryKey,
    queryFn: async (): Promise<T> => {
      const res = await fetcher();
      return res.data;
    },
    staleTime: STALE_TIME_MS,
  };
}

export default function TeacherDashboard() {
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);

  const cohort = useQuery<CohortLearnerRow[]>(
    buildQueryOptions(["teacher-cohort-progress"], teacherDashboardApi.getCohortProgress)
  );
  const badges = useQuery<BadgeReadinessData>(
    buildQueryOptions(["teacher-badge-readiness"], teacherDashboardApi.getBadgeReadiness)
  );
  const microcreds = useQuery<MicrocredentialReadinessData>(
    buildQueryOptions(["teacher-mc-readiness"], teacherDashboardApi.getMicrocredentialReadiness)
  );
  const interventions = useQuery<InterventionFlag[]>(
    buildQueryOptions(["teacher-interventions"], teacherDashboardApi.getInterventions)
  );
  const certPipeline = useQuery<CertificationPipelineRow[]>(
    buildQueryOptions(["teacher-cert-pipeline"], teacherDashboardApi.getCertificationPipeline)
  );
  const pendingArtifacts = useQuery<{ results: unknown[] }>(
    buildQueryOptions(["teacher-pending-artifacts"], teacherApi.getPendingArtifacts)
  );

  const dualView = useQuery<DualViewData>({
    queryKey: ["teacher-dual-view", selectedLearnerId],
    queryFn: async (): Promise<DualViewData> => {
      const res = await teacherDashboardApi.getLearnerDualView(selectedLearnerId!);
      return res.data;
    },
    enabled: !!selectedLearnerId,
    staleTime: DUAL_VIEW_STALE_MS,
  });

  const handleAwardBadge = useCallback(
    async (award: PendingBadgeAward) => {
      try {
        await teacherApi.badges.awardBadge({
          learner_id: award.learner_id,
          badge_name: award.badge_title,
          description: award.unit_title ? `Completed ${award.unit_title}` : undefined,
          module_id: award.module_id,
        });
        badges.refetch();
      } catch {
        toast.error("Failed to award badge.");
      }
    },
    [badges]
  );

  const isLoading = cohort.isLoading || badges.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (cohort.isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Could not load dashboard data.</p>
            <Button onClick={() => cohort.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const artifactList = Array.isArray(
    (pendingArtifacts.data as { results?: unknown[] } | undefined)?.results
  )
    ? (pendingArtifacts.data as { results: unknown[] }).results
    : [];

  return (
    <div className="min-h-screen p-4 lg:p-6 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-sm text-gray-500">
            Cohort view · click any learner name to open individual view
          </p>
        </header>

        {selectedLearnerId && dualView.data ? (
          <LearnerDetailView
            data={dualView.data}
            onBack={() => setSelectedLearnerId(null)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left — 3 columns — cohort overview */}
            <div className="lg:col-span-3 min-h-[600px]">
              <CohortProgressPanel
                rows={cohort.data ?? []}
                onSelectLearner={setSelectedLearnerId}
              />
            </div>

            {/* Right — 2 columns — teacher action panels */}
            <div className="lg:col-span-2 space-y-4">
              <InterventionFlagsPanel
                flags={interventions.data ?? []}
                onSelectLearner={setSelectedLearnerId}
              />
              <ArtifactQualityPanel
                artifacts={artifactList as Parameters<typeof ArtifactQualityPanel>[0]["artifacts"]}
                onRefresh={() => pendingArtifacts.refetch()}
              />
              <BadgeCompletionPanel
                data={badges.data ?? { pending_awards: [], recently_issued: [] }}
                onAwardBadge={handleAwardBadge}
              />
              <MicrocredentialReadinessPanel
                data={microcreds.data ?? { eligible: [], not_yet_eligible: [] }}
                onSelectLearner={setSelectedLearnerId}
              />
              <CertificationPipelinePanel
                rows={certPipeline.data ?? []}
                onSelectLearner={setSelectedLearnerId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parentDashboardApi } from "@/lib/api";
import type {
  ChildSummary,
  ChildGrowth,
  ChildRecognition,
  ChildArtifact,
  ChildSession,
} from "./parent-dashboard-types";
import ChildSelectorPanel from "./components/ChildSelectorPanel";
import ChildGrowthPanel from "./components/ChildGrowthPanel";
import ChildRecognitionPanel from "./components/ChildRecognitionPanel";
import ChildArtifactsPanel from "./components/ChildArtifactsPanel";
import ChildSessionsPanel from "./components/ChildSessionsPanel";

function usePanelEnabled<T>(
  key: string[],
  fetcher: () => Promise<{ data: T }>,
  enabled: boolean
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => fetcher().then((r) => r.data),
    enabled,
  });
}

function PanelSkeleton({ className = "h-48" }: { className?: string }) {
  return <div className={`${className} bg-gray-100 rounded-xl animate-pulse`} />;
}

const EMPTY_GROWTH: ChildGrowth = { level: "explorer", leaves_count: 0, fruit_count: 0, recent_badges: [] };
const EMPTY_RECOGNITION: ChildRecognition = { badges: [], microcredentials: [] };

export default function ParentPortal() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const childrenQuery = useQuery<{ children: ChildSummary[] }>({
    queryKey: ["parent-children"],
    queryFn: () => parentDashboardApi.getChildren().then((r) => r.data),
  });

  const children = childrenQuery.data?.children ?? [];
  const activeId = selectedId ?? children[0]?.learner_id ?? null;
  const hasChild = !!activeId;

  const growth = usePanelEnabled<ChildGrowth>(
    ["parent-growth", activeId ?? ""],
    () => parentDashboardApi.getGrowth(activeId!),
    hasChild
  );
  const recognition = usePanelEnabled<ChildRecognition>(
    ["parent-recognition", activeId ?? ""],
    () => parentDashboardApi.getRecognition(activeId!),
    hasChild
  );
  const artifactsQuery = usePanelEnabled<{ artifacts: ChildArtifact[] }>(
    ["parent-artifacts", activeId ?? ""],
    () => parentDashboardApi.getArtifacts(activeId!),
    hasChild
  );
  const sessionsQuery = usePanelEnabled<{ sessions: ChildSession[] }>(
    ["parent-sessions", activeId ?? ""],
    () => parentDashboardApi.getSessions(activeId!),
    hasChild
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Parent Portal</h1>

      {childrenQuery.isLoading ? (
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <ChildSelectorPanel
          children={children}
          selectedId={activeId}
          onSelect={setSelectedId}
        />
      )}

      {!hasChild && !childrenQuery.isLoading && (
        <p className="text-sm text-gray-400 text-center py-10">
          No children linked — contact your school to link your account.
        </p>
      )}

      {hasChild && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {growth.isLoading ? (
            <PanelSkeleton />
          ) : (
            <ChildGrowthPanel data={growth.data ?? EMPTY_GROWTH} />
          )}

          {recognition.isLoading ? (
            <PanelSkeleton />
          ) : (
            <ChildRecognitionPanel data={recognition.data ?? EMPTY_RECOGNITION} />
          )}

          {artifactsQuery.isLoading ? (
            <PanelSkeleton />
          ) : (
            <ChildArtifactsPanel artifacts={artifactsQuery.data?.artifacts ?? []} />
          )}

          {sessionsQuery.isLoading ? (
            <PanelSkeleton />
          ) : (
            <ChildSessionsPanel sessions={sessionsQuery.data?.sessions ?? []} />
          )}
        </div>
      )}
    </div>
  );
}

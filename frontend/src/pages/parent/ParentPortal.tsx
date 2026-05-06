import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Apple,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderOpen,
  GraduationCap,
  Leaf,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { parentDashboardApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type {
  ChildSummary,
  ChildGrowth,
  ChildRecognition,
  ChildArtifact,
  ChildSession,
} from "./parent-dashboard-types";
import {
  ARTIFACT_STATUS_COLORS,
  ARTIFACT_STATUS_LABELS,
  LEVEL_LABELS,
} from "./parent-dashboard-types";

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

const EMPTY_GROWTH: ChildGrowth = {
  level: "explorer",
  leaves_count: 0,
  fruit_count: 0,
  recent_badges: [],
};
const EMPTY_RECOGNITION: ChildRecognition = { badges: [], microcredentials: [] };

const LEVEL_ORDER = ["explorer", "builder", "practitioner", "pre_professional"];

const EVIDENCE_STATUS_STYLE: Record<string, string> = {
  verified: "bg-fundi-lime/10 text-[#496400]",
  pending: "bg-fundi-yellow/20 text-[#7d6e1c]",
  corrected: "bg-fundi-cyan/15 text-[#005968]",
  rejected: "bg-fundi-red/10 text-fundi-red",
};

function PanelSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={`${className} animate-pulse rounded-xl bg-white shadow-[0_4px_24px_rgba(240,87,34,0.04)]`}
    />
  );
}

function formatDate(date: string | null) {
  if (!date) return "TBD";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-UG", {
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(date: string | null) {
  if (!date) return "";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-UG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ChildSwitcher({
  children,
  selectedId,
  onSelect,
}: {
  children: ChildSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl bg-[#e8e8e8] p-1">
      {children.map((child) => (
        <button
          key={child.learner_id}
          onClick={() => onSelect(child.learner_id)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-extrabold transition-all",
            selectedId === child.learner_id
              ? "bg-white text-fundi-orange shadow-sm"
              : "text-[#5b5b5b] hover:bg-white/60 hover:text-[#2f2f2f]"
          )}
        >
          {child.name.split(" ")[0] || child.name}
        </button>
      ))}
      <Link
        to="/parent/children"
        className="flex items-center rounded-lg px-3 py-2 text-[#5b5b5b] hover:bg-white/60 hover:text-[#2f2f2f]"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ChildSummaryCard({
  child,
  growth,
  recognition,
  artifacts,
}: {
  child: ChildSummary;
  growth: ChildGrowth;
  recognition: ChildRecognition;
  artifacts: ChildArtifact[];
}) {
  const verifiedEvidence = artifacts.filter((artifact) => artifact.evidence_status === "verified").length;
  const currentProgram = child.current_program || child.current_track || "Learning pathway";

  return (
    <section className="relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <span className="absolute left-0 top-0 h-full w-1 bg-fundi-orange" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-fundi-orange/10 text-fundi-orange">
          <GraduationCap className="h-14 w-14" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="heading-font text-3xl font-black tracking-tight text-[#2f2f2f]">
                {child.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-fundi-cyan">
                {currentProgram}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-fundi-lime/10 px-3 py-1 text-xs font-extrabold text-[#496400]">
              <span className="h-2 w-2 rounded-full bg-fundi-lime" />
              Active
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Growth Level" value={LEVEL_LABELS[growth.level] ?? growth.level} icon={Sparkles} />
            <Metric label="Recognition" value={`${recognition.badges.length + recognition.microcredentials.length}`} icon={Award} />
            <Metric label="Verified Evidence" value={`${verifiedEvidence}`} icon={ShieldCheck} />
          </div>
        </div>
      </div>
      {(child.current_school || child.current_class) && (
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#5b5b5b]">
          {child.current_school && <span className="rounded-full bg-[#f1f1f1] px-3 py-1">{child.current_school}</span>}
          {child.current_class && <span className="rounded-full bg-[#f1f1f1] px-3 py-1">{child.current_class}</span>}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg bg-[#f6f6f6] p-4">
      <Icon className="mb-2 h-5 w-5 text-fundi-orange" />
      <p className="text-lg font-black text-[#2f2f2f]">{value}</p>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#777]">{label}</p>
    </div>
  );
}

function GrowthPathPanel({ growth }: { growth: ChildGrowth }) {
  const currentIndex = Math.max(0, LEVEL_ORDER.indexOf(growth.level));
  const progress = LEVEL_ORDER.length > 1 ? (currentIndex / (LEVEL_ORDER.length - 1)) * 100 : 0;
  const progressWidth = currentIndex === 0 ? "0" : `calc(${progress}% - 1.5rem)`;

  return (
    <section className="rounded-xl bg-[#f1f1f1] p-6 shadow-[0_4px_24px_rgba(240,87,34,0.04)]">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="heading-font text-xl font-black tracking-tight text-[#2f2f2f]">Growth Path</h3>
          <p className="text-sm font-medium text-[#5b5b5b]">
            {LEVEL_LABELS[growth.level] ?? growth.level} progress snapshot
          </p>
        </div>
        <span className="rounded-full bg-white px-4 py-1 text-xs font-extrabold text-fundi-orange">
          {growth.leaves_count} leaves / {growth.fruit_count} fruit
        </span>
      </div>

      <div className="relative mb-8 px-2">
        <div className="absolute left-6 right-6 top-5 h-1 rounded-full bg-[#dddddd]" />
        <div
          className="absolute left-6 top-5 h-1 rounded-full bg-fundi-orange transition-all"
          style={{ width: progressWidth }}
        />
        <div className="relative z-10 grid grid-cols-4 gap-2">
          {LEVEL_ORDER.map((level, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            return (
              <div key={level} className="flex min-w-0 flex-col items-center gap-3 text-center">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-4 bg-white",
                    done && "border-fundi-orange bg-fundi-orange text-white",
                    active && "border-fundi-orange text-fundi-orange shadow-lg",
                    !done && !active && "border-[#dddddd] text-[#9d9d9d]"
                  )}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : active ? <Sparkles className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>
                <span className="max-w-[7rem] text-[10px] font-black uppercase tracking-wide text-[#5b5b5b]">
                  {LEVEL_LABELS[level] ?? level}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-4">
          <Leaf className="mb-2 h-5 w-5 text-[#496400]" />
          <p className="text-2xl font-black">{growth.leaves_count}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b5b5b]">Learning Leaves</p>
        </div>
        <div className="rounded-lg bg-white p-4">
          <Apple className="mb-2 h-5 w-5 text-fundi-orange" />
          <p className="text-2xl font-black">{growth.fruit_count}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b5b5b]">Growth Fruit</p>
        </div>
      </div>
    </section>
  );
}

function RecognitionWall({ recognition }: { recognition: ChildRecognition }) {
  const recentBadges = recognition.badges.slice(0, 4);
  const recentCredentials = recognition.microcredentials.slice(0, 3);

  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="heading-font flex items-center gap-2 text-xl font-black tracking-tight">
          <Award className="h-5 w-5 text-fundi-orange" />
          Badges & Credentials
        </h3>
        <span className="rounded-full bg-fundi-orange/10 px-3 py-1 text-xs font-extrabold text-fundi-orange">
          {recognition.badges.length + recognition.microcredentials.length}
        </span>
      </div>

      {recentBadges.length === 0 && recentCredentials.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#777]">Recognition will appear after verified evidence is approved.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentBadges.map((badge) => (
              <div key={`${badge.title}-${badge.date_awarded}`} className="rounded-xl bg-[#f6f6f6] p-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fundi-yellow/30 text-fundi-orange">
                  <Award className="h-6 w-6" />
                </div>
                <h4 className="line-clamp-2 text-xs font-black text-[#2f2f2f]">{badge.title}</h4>
                <p className="mt-1 text-[10px] font-semibold text-[#777]">{formatDateLong(badge.date_awarded)}</p>
              </div>
            ))}
          </div>

          {recentCredentials.length > 0 && (
            <div className="space-y-2">
              {recentCredentials.map((credential) => (
                <div key={`${credential.title}-${credential.date_issued}`} className="flex items-center gap-3 rounded-lg bg-fundi-lime/10 p-3">
                  <GraduationCap className="h-5 w-5 shrink-0 text-[#496400]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#2f2f2f]">{credential.title}</p>
                    <p className="truncate text-xs text-[#5b5b5b]">{credential.module || formatDateLong(credential.date_issued)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function EvidencePortfolio({ artifacts }: { artifacts: ChildArtifact[] }) {
  const verified = artifacts.filter((artifact) => artifact.evidence_status === "verified").length;
  const pending = artifacts.filter((artifact) => artifact.evidence_status === "pending" || artifact.status === "pending").length;

  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="heading-font flex items-center gap-2 text-xl font-black tracking-tight">
            <FolderOpen className="h-5 w-5 text-fundi-orange" />
            Evidence Portfolio
          </h3>
          <p className="mt-1 text-sm font-medium text-[#5b5b5b]">Teacher-approved work, artifacts, and verification status.</p>
        </div>
        <div className="flex gap-2 text-xs font-extrabold">
          <span className="rounded-full bg-fundi-lime/10 px-3 py-1 text-[#496400]">{verified} verified</span>
          <span className="rounded-full bg-fundi-yellow/20 px-3 py-1 text-[#7d6e1c]">{pending} pending</span>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#777]">Evidence will appear after work is submitted or captured.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {artifacts.slice(0, 6).map((artifact) => {
            const evidenceLabel = artifact.evidence_status || artifact.status;
            return (
              <article key={artifact.id} className="rounded-xl border border-[#e8e8e8] bg-[#f6f6f6] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="line-clamp-2 text-sm font-black text-[#2f2f2f]">{artifact.title}</h4>
                    <p className="mt-1 truncate text-xs font-semibold text-[#5b5b5b]">
                      {artifact.module || artifact.task || "General evidence"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide",
                      EVIDENCE_STATUS_STYLE[evidenceLabel] ?? ARTIFACT_STATUS_COLORS[artifact.status] ?? "bg-[#e8e8e8] text-[#5b5b5b]"
                    )}
                  >
                    {evidenceLabel === artifact.status ? ARTIFACT_STATUS_LABELS[artifact.status] : evidenceLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#777]">
                  <span>{formatDateLong(artifact.submitted_at)}</span>
                  <span>{artifact.media_count ?? 0} media</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function UpcomingSessions({ sessions }: { sessions: ChildSession[] }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <h3 className="heading-font mb-5 flex items-center gap-2 text-xl font-black tracking-tight">
        <CalendarDays className="h-5 w-5 text-fundi-cyan" />
        Upcoming Sessions
      </h3>
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#777]">No upcoming sessions scheduled.</p>
        ) : (
          sessions.map((session, index) => (
            <article key={`${session.date}-${session.start_time}-${index}`} className="flex gap-3 rounded-xl bg-[#f6f6f6] p-3">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-fundi-cyan/10 text-fundi-cyan">
                <span className="text-lg font-black">{formatDate(session.date).split(" ")[1] ?? ""}</span>
                <span className="text-[10px] font-extrabold uppercase">{formatDate(session.date).split(" ")[0] ?? ""}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-black text-[#2f2f2f]">{session.module_name || "Learning Session"}</h4>
                <p className="mt-1 text-xs font-semibold text-[#5b5b5b]">
                  {session.start_time ?? "TBD"}{session.end_time ? ` - ${session.end_time}` : ""}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ActivitySummary({
  growth,
  recognition,
  artifacts,
}: {
  growth: ChildGrowth;
  recognition: ChildRecognition;
  artifacts: ChildArtifact[];
}) {
  const latestArtifact = artifacts[0];
  const latestBadge = recognition.badges[0] ?? recognition.microcredentials[0];

  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <h3 className="heading-font mb-5 flex items-center gap-2 text-xl font-black tracking-tight">
        <FileText className="h-5 w-5 text-[#496400]" />
        Learning Updates
      </h3>
      <div className="space-y-4">
        {latestArtifact && (
          <div className="flex gap-3">
            <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-fundi-orange/10 p-2 text-fundi-orange">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-[#2f2f2f]"><span className="font-black">New evidence:</span> {latestArtifact.title}</p>
              <p className="mt-1 text-xs text-[#777]">{formatDateLong(latestArtifact.submitted_at)}</p>
            </div>
          </div>
        )}
        {latestBadge && (
          <div className="flex gap-3">
            <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-fundi-yellow/30 p-2 text-fundi-orange">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-[#2f2f2f]"><span className="font-black">Recognition:</span> {latestBadge.title}</p>
              <p className="mt-1 text-xs text-[#777]">Evidence-backed achievement</p>
            </div>
          </div>
        )}
        {!latestArtifact && !latestBadge && (
          <p className="py-6 text-center text-sm text-[#777]">
            Updates will appear when evidence, sessions, or recognition records are available.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-[#f6f6f6] p-3">
            <p className="text-xl font-black">{growth.recent_badges.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#777]">Recent badges</p>
          </div>
          <div className="rounded-lg bg-[#f6f6f6] p-3">
            <p className="text-xl font-black">{artifacts.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#777]">Evidence items</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ParentPortal() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const childrenQuery = useQuery<{ children: ChildSummary[] }>({
    queryKey: ["parent-children"],
    queryFn: () => parentDashboardApi.getChildren().then((r) => r.data),
  });

  const children = childrenQuery.data?.children ?? [];
  const activeId = selectedId ?? children[0]?.learner_id ?? null;
  const activeChild = children.find((child) => child.learner_id === activeId) ?? children[0] ?? null;
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

  const growthData = growth.data ?? EMPTY_GROWTH;
  const recognitionData = recognition.data ?? EMPTY_RECOGNITION;
  const artifacts = artifactsQuery.data?.artifacts ?? [];
  const sessions = sessionsQuery.data?.sessions ?? [];

  const parentName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Parent";

  return (
    <div className="min-h-screen bg-[#f6f6f6] px-3 py-8 text-[#2f2f2f] sm:px-4 lg:px-6">
      <div className="flex w-full flex-col gap-8">
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/fundi_bots_logo.png" alt="Fundi Bots" className="h-9 w-auto object-contain" />
              <span className="rounded-full bg-fundi-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-fundi-orange">
                Parent Portal
              </span>
            </div>
            <h1 className="heading-font mb-2 text-4xl font-black tracking-tight text-[#2f2f2f] md:text-6xl">
              Welcome back, {parentName}
            </h1>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#5b5b5b]">
              A clear view of progress, recognition, upcoming sessions, and the evidence behind each achievement.
            </p>
          </div>

          {childrenQuery.isLoading ? (
            <div className="h-12 w-72 animate-pulse rounded-xl bg-white" />
          ) : children.length > 0 ? (
            <ChildSwitcher children={children} selectedId={activeId} onSelect={setSelectedId} />
          ) : null}
        </header>

        {!hasChild && !childrenQuery.isLoading && (
          <section className="rounded-xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-fundi-orange" />
            <h2 className="heading-font text-2xl font-black">No children linked</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5b5b5b]">
              Contact your school to link your parent account to a learner profile.
            </p>
          </section>
        )}

        {hasChild && activeChild && (
          <>
            {growth.isLoading || recognition.isLoading || artifactsQuery.isLoading ? (
              <PanelSkeleton className="h-52" />
            ) : (
              <ChildSummaryCard
                child={activeChild}
                growth={growthData}
                recognition={recognitionData}
                artifacts={artifacts}
              />
            )}

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                {growth.isLoading ? <PanelSkeleton /> : <GrowthPathPanel growth={growthData} />}
                {artifactsQuery.isLoading ? <PanelSkeleton className="h-96" /> : <EvidencePortfolio artifacts={artifacts} />}
              </div>
              <div className="space-y-6 xl:col-span-4">
                {recognition.isLoading ? <PanelSkeleton /> : <RecognitionWall recognition={recognitionData} />}
                {sessionsQuery.isLoading ? <PanelSkeleton /> : <UpcomingSessions sessions={sessions} />}
                {growth.isLoading || recognition.isLoading || artifactsQuery.isLoading ? (
                  <PanelSkeleton />
                ) : (
                  <ActivitySummary growth={growthData} recognition={recognitionData} artifacts={artifacts} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

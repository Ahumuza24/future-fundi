import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers3,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseApi, studentApi } from "@/lib/api";
import type { Pathway, StudentDashboardData } from "@/pages/student/learner-dashboard-types";

interface CatalogCourse {
  id: string;
  name: string;
  description?: string;
  levels?: unknown[];
  modules?: unknown[];
  careers?: unknown[];
}

const normalizeList = <T,>(payload: T[] | { results?: T[] } | undefined): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload?.results ?? [];
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const pathwayTone = [
  {
    accent: "bg-fundi-orange",
    text: "text-fundi-orange",
    soft: "bg-fundi-orange/10",
    icon: BookOpen,
  },
  {
    accent: "bg-fundi-cyan",
    text: "text-fundi-cyan",
    soft: "bg-fundi-cyan/10",
    icon: Layers3,
  },
  {
    accent: "bg-fundi-lime",
    text: "text-[#496400]",
    soft: "bg-fundi-lime/20",
    icon: GraduationCap,
  },
];

const catalogTone = [
  {
    background: "from-fundi-cyan/25 via-white to-fundi-orange/10",
    chip: "text-fundi-cyan",
    icon: Sparkles,
    label: "Creative Skills",
  },
  {
    background: "from-fundi-orange/20 via-white to-fundi-yellow/20",
    chip: "text-fundi-orange",
    icon: Layers3,
    label: "Science & Tech",
  },
  {
    background: "from-fundi-lime/25 via-white to-fundi-cyan/15",
    chip: "text-[#496400]",
    icon: Award,
    label: "Community",
  },
];

function ActivePathwayCard({ pathway, index }: { pathway: Pathway; index: number }) {
  const tone = pathwayTone[index % pathwayTone.length];
  const Icon = tone.icon;
  const progress = clampPercent(pathway.progress);
  const microCredentialProgress = pathway.totalMicroCredentials > 0
    ? clampPercent((pathway.microCredentialsEarned / pathway.totalMicroCredentials) * 100)
    : 0;

  return (
    <article className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(240,87,34,0.12)]">
      <span className={`absolute left-0 top-0 h-full w-1 ${tone.accent} transition-all group-hover:w-2`} />
      <div className="flex h-full flex-col gap-6 pl-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tone.soft}`}>
              <Icon className={`h-6 w-6 ${tone.text}`} />
            </div>
            <div className="min-w-0">
              <h3 className="heading-font truncate text-xl font-extrabold text-[#2f2f2f]">
                {pathway.title}
              </h3>
              <p className={`mt-1 text-xs font-extrabold uppercase tracking-widest ${tone.text}`}>
                {pathway.currentLevel}
              </p>
            </div>
          </div>
          <span className={`heading-font text-3xl font-black ${tone.text}`}>{progress}%</span>
        </div>

        <div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e8e8e8]">
            <div className={`h-full rounded-full ${tone.accent}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-[#f6f6f6] p-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#777]">
              Next Module
            </p>
            <p className="line-clamp-2 text-sm font-bold text-[#2f2f2f]">{pathway.currentModule}</p>
          </div>
          <div className="rounded-lg bg-[#f6f6f6] p-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#777]">
              Microcredentials
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#2f2f2f]">
                {pathway.microCredentialsEarned}/{pathway.totalMicroCredentials || 0}
              </p>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8e8e8]">
                <div className="h-full rounded-full bg-fundi-cyan" style={{ width: `${microCredentialProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <Button asChild className="mt-auto w-full gap-2 rounded-lg">
          <Link to={`/student/pathway/${pathway.id}`}>
            Continue Learning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function CatalogCard({ course, index }: { course: CatalogCourse; index: number }) {
  const tone = catalogTone[index % catalogTone.length];
  const Icon = tone.icon;
  const levelCount = course.levels?.length ?? 0;
  const moduleCount = course.modules?.length ?? 0;
  const weeks = Math.max(8, (levelCount || 3) * 4);
  const difficulty = moduleCount > 8 || levelCount > 3 ? "Intermediate" : "Beginner";

  return (
    <article className="group overflow-hidden rounded-xl bg-[#f1f1f1] transition-all hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${tone.background}`}>
        <img
          src="/fundi_bots_logo.png"
          alt=""
          className="absolute -right-5 -top-5 h-28 w-28 object-contain opacity-10"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.1),rgba(47,47,47,0.05))]" />
        <div className="absolute left-4 top-4 rounded bg-white/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider">
          <span className={tone.chip}>{tone.label}</span>
        </div>
        <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/90 shadow-sm">
          <Icon className={`h-6 w-6 ${tone.chip}`} />
        </div>
      </div>
      <div className="p-5">
        <h3 className="heading-font mb-1 line-clamp-1 text-lg font-extrabold text-[#2f2f2f]">
          {course.name}
        </h3>
        <p className="mb-4 line-clamp-2 min-h-10 text-xs text-[#5b5b5b]">
          {course.description || "Explore a Future Fundi pathway and build evidence-backed skills."}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded bg-[#dddddd] px-2 py-1 text-[10px] font-bold text-[#5b5b5b]">
            {difficulty}
          </span>
          <span className="rounded bg-[#dddddd] px-2 py-1 text-[10px] font-bold text-[#5b5b5b]">
            {weeks} Weeks
          </span>
        </div>
        <Button variant="outline" className="w-full rounded-lg text-xs">
          Ask Teacher to Enroll
        </Button>
      </div>
    </article>
  );
}

function CompletedPathwayRow({ pathway }: { pathway: Pathway }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl bg-[#e8e8e8] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fundi-lime/20 text-[#496400]">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="heading-font text-lg font-extrabold text-[#2f2f2f]">{pathway.title}</h3>
          <p className="text-xs font-medium text-[#777]">
            {pathway.microCredentialsEarned}/{pathway.totalMicroCredentials || 0} microcredentials earned
          </p>
        </div>
      </div>
      <Button variant="ghost" className="gap-2 rounded-lg bg-white text-xs shadow-sm">
        <Trophy className="h-4 w-4 text-fundi-orange" />
        View Certificate
      </Button>
    </article>
  );
}

export default function MyPathwaysPage() {
  const [query, setQuery] = useState("");

  const dashboardQuery = useQuery<StudentDashboardData>({
    queryKey: ["student-dashboard"],
    queryFn: () => studentApi.getDashboard().then((response) => response.data),
  });

  const catalogQuery = useQuery<CatalogCourse[]>({
    queryKey: ["student-pathway-catalog"],
    queryFn: () => courseApi.getAll().then((response) => normalizeList<CatalogCourse>(response.data)),
  });

  const pathways = dashboardQuery.data?.pathways ?? [];
  const activePathways = pathways.filter((pathway) => pathway.progress < 100);
  const completedPathways = pathways.filter((pathway) => pathway.progress >= 100);
  const enrolledTitles = useMemo(
    () => new Set(pathways.map((pathway) => pathway.title.toLowerCase())),
    [pathways]
  );

  const catalogCourses = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (catalogQuery.data ?? [])
      .filter((course) => !enrolledTitles.has(course.name.toLowerCase()))
      .filter((course) => {
        if (!search) {
          return true;
        }
        return `${course.name} ${course.description ?? ""}`.toLowerCase().includes(search);
      })
      .slice(0, 6);
  }, [catalogQuery.data, enrolledTitles, query]);

  const inProgressCount = activePathways.length;
  const averageProgress = activePathways.length > 0
    ? Math.round(activePathways.reduce((total, pathway) => total + pathway.progress, 0) / activePathways.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#f6f6f6] px-3 py-6 text-[#2f2f2f] sm:px-4 lg:px-6">
      <div className="flex w-full max-w-none flex-col gap-12">
        <header className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
                        <h1 className="heading-font mb-3 text-4xl font-black tracking-tight text-[#2f2f2f] md:text-6xl">
              My <span className="italic text-fundi-orange">Pathways</span>
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[#5b5b5b] md:text-base">
              Master the future through specialized learning journeys. Track progress,
              earn credentials, and choose the next pathway to ask your teacher about.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-[#777]">
              Search pathways
            </label>
            <div className="flex items-center gap-2 rounded-full bg-[#f1f1f1] px-4 py-2">
              <Search className="h-4 w-4 text-[#777]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search catalog..."
                className="w-full border-none bg-transparent text-sm text-[#2f2f2f] outline-none placeholder:text-[#777]"
              />
            </div>
          </div>
        </header>

        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="heading-font flex items-center gap-2 text-2xl font-extrabold">
              <span className="h-8 w-2 rounded-full bg-fundi-orange" />
              Active Pathways
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-fundi-orange/10 px-3 py-1 text-xs font-extrabold text-fundi-orange">
                {inProgressCount} In Progress
              </span>
              <span className="rounded-full bg-fundi-cyan/10 px-3 py-1 text-xs font-extrabold text-fundi-cyan">
                {averageProgress}% Average Progress
              </span>
            </div>
          </div>

          {dashboardQuery.isLoading ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-72 animate-pulse rounded-xl bg-white" />
              <div className="h-72 animate-pulse rounded-xl bg-white" />
            </div>
          ) : activePathways.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {activePathways.map((pathway, index) => (
                <ActivePathwayCard key={pathway.id} pathway={pathway} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#dddddd] bg-white p-8 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-fundi-orange" />
              <p className="font-bold text-[#2f2f2f]">No active pathways yet.</p>
              <p className="mt-1 text-sm text-[#5b5b5b]">Ask your teacher to enroll you in a pathway from the catalog.</p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="heading-font flex items-center gap-2 text-2xl font-extrabold">
              <span className="h-8 w-2 rounded-full bg-fundi-lime" />
              Pathway Catalog
            </h2>
            <span className="flex items-center gap-1 text-xs font-bold text-[#5b5b5b]">
              <Clock className="h-4 w-4 text-fundi-cyan" />
              Enrollment is managed by your teacher
            </span>
          </div>

          {catalogQuery.isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="h-72 animate-pulse rounded-xl bg-[#f1f1f1]" />
              <div className="h-72 animate-pulse rounded-xl bg-[#f1f1f1]" />
              <div className="h-72 animate-pulse rounded-xl bg-[#f1f1f1]" />
            </div>
          ) : catalogCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {catalogCourses.map((course, index) => (
                <CatalogCard key={course.id} course={course} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#f1f1f1] p-8 text-center text-sm text-[#5b5b5b]">
              {query ? "No catalog pathways match your search." : "No additional pathways are available right now."}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="heading-font flex items-center gap-2 text-2xl font-extrabold">
              <span className="h-8 w-2 rounded-full bg-[#adadad]" />
              Completed Pathways
            </h2>
          </div>

          {completedPathways.length > 0 ? (
            <div className="space-y-4">
              {completedPathways.map((pathway) => (
                <CompletedPathwayRow key={pathway.id} pathway={pathway} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#e8e8e8] p-6 text-sm text-[#5b5b5b]">
              Completed pathways will appear here once you finish every required level.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

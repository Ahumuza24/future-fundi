import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Download,
  Lock,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Verified,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { learnerDashboardApi } from "@/lib/api";
import type {
  CertificationsData,
  GrowthBadge,
  GrowthMicrocredential,
  GrowthSummary,
  IssuedCertification,
} from "@/pages/student/learner-dashboard-types";

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

const BADGE_TONES = [
  { soft: "bg-fundi-cyan/10", icon: "text-fundi-cyan", glow: "bg-fundi-cyan/5", Icon: BadgeCheck },
  { soft: "bg-fundi-pink/10", icon: "text-fundi-pink", glow: "bg-fundi-pink/5", Icon: Sparkles },
  { soft: "bg-fundi-lime/15", icon: "text-[#496400]", glow: "bg-fundi-lime/10", Icon: Trophy },
  { soft: "bg-fundi-orange/10", icon: "text-fundi-orange", glow: "bg-fundi-orange/5", Icon: Award },
];

const LOCKED_BADGES = [
  {
    title: "AI Architect",
    requirement: "Complete advanced maker projects and submit verified evidence.",
    Icon: Sparkles,
  },
  {
    title: "Pearl of Africa Envoy",
    requirement: "Participate in three community collaboration projects.",
    Icon: Trophy,
  },
  {
    title: "Cyber Guardian",
    requirement: "Pass a security-focused assessment and teacher review.",
    Icon: ShieldCheck,
  },
];

function SummaryCard({
  label,
  value,
  eyebrow,
  tone,
  children,
}: {
  label: string;
  value: string | number;
  eyebrow: string;
  tone: "orange" | "cyan" | "dark";
  children?: React.ReactNode;
}) {
  const styles = {
    orange: {
      card: "bg-white border-fundi-orange text-[#2f2f2f]",
      icon: "bg-fundi-orange/10 text-fundi-orange",
      eyebrow: "text-fundi-orange",
    },
    cyan: {
      card: "bg-white border-fundi-cyan text-[#2f2f2f]",
      icon: "bg-fundi-cyan/10 text-fundi-cyan",
      eyebrow: "text-fundi-cyan",
    },
    dark: {
      card: "bg-[#0e0e0e] border-fundi-lime text-white",
      icon: "bg-fundi-lime/20 text-fundi-lime",
      eyebrow: "text-fundi-lime",
    },
  }[tone];

  return (
    <article className={`rounded-xl border-l-4 p-6 transition-all hover:-translate-y-1 ${styles.card}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-lg p-3 ${styles.icon}`}>
          <Verified className="h-5 w-5" />
        </div>
        <span className={`text-xs font-extrabold uppercase tracking-widest ${styles.eyebrow}`}>
          {eyebrow}
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="heading-font text-4xl font-black">{value}</h3>
        <p className={tone === "dark" ? "font-semibold text-white/70" : "font-semibold text-[#5b5b5b]"}>
          {label}
        </p>
      </div>
      {children}
    </article>
  );
}

function BadgeCard({ badge, index }: { badge: GrowthBadge; index: number }) {
  const tone = BADGE_TONES[index % BADGE_TONES.length];
  const Icon = tone.Icon;

  return (
    <article className="group relative overflow-hidden rounded-xl bg-white p-6 text-center transition-all hover:scale-[1.02] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
      <div className={`absolute right-0 top-0 h-16 w-16 rounded-bl-full ${tone.glow}`} />
      <div className="relative mx-auto mb-4 h-24 w-24">
        <div className={`absolute inset-0 rounded-full ${tone.soft} transition-transform group-hover:scale-110`} />
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <Icon className={`h-12 w-12 ${tone.icon}`} />
        </div>
      </div>
      <h3 className="mb-1 line-clamp-2 text-lg font-extrabold text-[#2f2f2f]">{badge.title}</h3>
      <p className="mb-4 text-xs text-[#5b5b5b]">
        {badge.date_awarded ? `Earned ${badge.date_awarded}` : "Earned badge"}
      </p>
      <Button variant="ghost" className="w-full rounded-lg bg-[#f1f1f1] text-xs text-[#5b5b5b]">
        View Details
      </Button>
    </article>
  );
}

function MicrocredentialCard({ microcredential }: { microcredential: GrowthMicrocredential }) {
  return (
    <article className="rounded-xl border-l-4 border-fundi-cyan bg-white p-5 transition-all hover:bg-[#f6f6f6]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-fundi-cyan/10 text-fundi-cyan">
          <BadgeCheck className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-base font-extrabold text-[#2f2f2f]">
            {microcredential.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-[#5b5b5b]">
            {microcredential.module || "Future Fundi module"}
            {microcredential.date_issued ? ` - Issued ${microcredential.date_issued}` : ""}
          </p>
        </div>
      </div>
    </article>
  );
}

function CredentialRow({ credential }: { credential: IssuedCertification }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border-l-4 border-fundi-cyan bg-white p-6 transition-all hover:bg-[#f6f6f6] md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-fundi-cyan/10 text-fundi-cyan">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold leading-tight text-[#2f2f2f]">{credential.title}</h3>
          <p className="text-sm font-medium text-[#5b5b5b]">
            {credential.program}
            {credential.date_issued ? ` - Verified ${credential.date_issued}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="cyan" size="sm" className="rounded-full text-[10px] font-extrabold uppercase tracking-wider">
          Verify
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full bg-[#f1f1f1] text-[10px] font-extrabold uppercase tracking-wider text-[#5b5b5b]">
          <Share2 className="mr-1 h-3 w-3" />
          Share
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-[#777]">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

function ActivityItem({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "orange" | "cyan" | "gray";
}) {
  const style = {
    orange: "bg-fundi-orange text-white",
    cyan: "bg-fundi-cyan text-white",
    gray: "bg-[#dddddd] text-[#5b5b5b]",
  }[tone];

  return (
    <div className="relative flex gap-4">
      <div className={`z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style}`}>
        <Star className="h-3 w-3" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-[#2f2f2f]">{label}</p>
        <p className="text-xs text-[#5b5b5b]">{detail}</p>
      </div>
    </div>
  );
}

export default function BadgesCredentialsPage() {
  const [query, setQuery] = useState("");

  const growthQuery = useQuery<GrowthSummary>({
    queryKey: ["learner-growth"],
    queryFn: () => learnerDashboardApi.getGrowth().then((response) => response.data),
  });

  const certsQuery = useQuery<CertificationsData>({
    queryKey: ["learner-certs"],
    queryFn: () => learnerDashboardApi.getCertifications().then((response) => response.data),
  });

  const growth = growthQuery.data ?? EMPTY_GROWTH;
  const certifications = certsQuery.data ?? EMPTY_CERTS;
  const search = query.trim().toLowerCase();
  const filteredBadges = growth.badges.filter((badge) =>
    badge.title.toLowerCase().includes(search)
  );
  const totalEarned = growth.badges.length + growth.microcredentials.length;
  const inProgressCount = certifications.in_progress.length;
  const nextProgress = certifications.in_progress[0];
  const nextProgressPct = nextProgress
    ? Math.min(100, Math.round((nextProgress.microcredentials_earned / nextProgress.microcredentials_required) * 100))
    : 0;

  const activity = useMemo(() => {
    const rows = [
      ...growth.badges.slice(0, 2).map((badge) => ({
        label: `Earned "${badge.title}" badge`,
        detail: badge.date_awarded ? `${badge.date_awarded} - Badge record` : "Badge record",
        tone: "orange" as const,
      })),
      ...growth.microcredentials.slice(0, 2).map((credential) => ({
        label: `Issued "${credential.title}" microcredential`,
        detail: credential.date_issued ? `${credential.date_issued} - ${credential.module}` : credential.module,
        tone: "cyan" as const,
      })),
      ...certifications.issued.slice(0, 1).map((credential) => ({
        label: `Verified "${credential.title}"`,
        detail: credential.program,
        tone: "gray" as const,
      })),
    ];
    return rows.slice(0, 5);
  }, [certifications.issued, growth.badges, growth.microcredentials]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] px-3 py-8 text-[#2f2f2f] sm:px-4 lg:px-6">
      <div className="flex w-full flex-col gap-12">
        <header className="relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fundi-orange/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-fundi-cyan/10 blur-3xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              
              <h1 className="heading-font mb-4 text-4xl font-black tracking-tight text-[#2f2f2f] md:text-6xl">
                My Badges &amp; <br />
                <span className="text-fundi-orange">Credentials</span>
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-[#5b5b5b]">
                Visualize your growth across Future Fundi. Every badge, microcredential,
                and certificate is evidence of what you can now do.
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
              <label className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-[#777]">
                Search badges
              </label>
              <div className="flex items-center gap-2 rounded-full bg-[#f1f1f1] px-4 py-2">
                <Search className="h-4 w-4 text-[#777]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search badges..."
                  className="w-full border-none bg-transparent text-sm text-[#2f2f2f] outline-none placeholder:text-[#777]"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <SummaryCard label="Total Recognition Earned" value={totalEarned} eyebrow="Verified" tone="orange" />
          <SummaryCard label="Credentials in Progress" value={String(inProgressCount).padStart(2, "0")} eyebrow="Active" tone="cyan" />
          <SummaryCard label="Next Milestone" value={nextProgress ? `${nextProgressPct}%` : "0%"} eyebrow="Next" tone="dark">
            <div className="mt-5 space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-fundi-lime" style={{ width: `${nextProgressPct}%` }} />
              </div>
              <p className="text-sm text-white/60">
                {nextProgress
                  ? `${nextProgress.microcredentials_required - nextProgress.microcredentials_earned} microcredentials left`
                  : "Start a pathway to unlock your next milestone"}
              </p>
            </div>
          </SummaryCard>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="heading-font text-3xl font-black tracking-tight">Earned Badges</h2>
              <p className="text-sm text-[#5b5b5b]">Click on a badge to view achievement metadata.</p>
            </div>
            <Button variant="ghost" className="w-fit gap-2 text-fundi-orange">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {growthQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-64 animate-pulse rounded-xl bg-white" />
              <div className="h-64 animate-pulse rounded-xl bg-white" />
              <div className="h-64 animate-pulse rounded-xl bg-white" />
              <div className="h-64 animate-pulse rounded-xl bg-white" />
            </div>
          ) : filteredBadges.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredBadges.slice(0, 8).map((badge, index) => (
                <BadgeCard key={`${badge.title}-${index}`} badge={badge} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-8 text-center text-sm text-[#5b5b5b]">
              {query ? "No badges match your search." : "No badges earned yet. Keep submitting evidence to unlock your first badge."}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="heading-font text-3xl font-black tracking-tight">Locked &amp; Upcoming</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {LOCKED_BADGES.map(({ title, requirement, Icon }) => (
              <article
                key={title}
                className="relative min-w-72 rounded-xl border-2 border-dashed border-[#dddddd] bg-[#e8e8e8]/70 p-6 opacity-80 grayscale"
              >
                <Lock className="absolute right-4 top-4 h-5 w-5 text-[#777]" />
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#dddddd] text-[#777]">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 font-extrabold text-[#5b5b5b]">{title}</h3>
                <p className="text-xs italic leading-5 text-[#777]">Requirement: {requirement}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <h2 className="heading-font text-3xl font-black tracking-tight">Verified Credentials</h2>
            {certsQuery.isLoading ? (
              <div className="space-y-4">
                <div className="h-24 animate-pulse rounded-xl bg-white" />
                <div className="h-24 animate-pulse rounded-xl bg-white" />
              </div>
            ) : (
              <div className="space-y-4">
                {certifications.issued.map((credential) => (
                  <CredentialRow key={`${credential.title}-${credential.program}`} credential={credential} />
                ))}
                {growth.microcredentials.map((credential) => (
                  <MicrocredentialCard key={`${credential.title}-${credential.module}`} microcredential={credential} />
                ))}
                {certifications.issued.length === 0 && growth.microcredentials.length === 0 && (
                  <div className="rounded-xl bg-white p-8 text-sm text-[#5b5b5b]">
                    Verified credentials will appear here after your teacher approves them.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <h2 className="heading-font text-3xl font-black tracking-tight">Recent Activity</h2>
            <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
              <div className="absolute bottom-10 left-9 top-10 w-px bg-[#f1f1f1]" />
              <div className="space-y-6">
                {activity.length > 0 ? (
                  activity.map((item) => (
                    <ActivityItem
                      key={`${item.label}-${item.detail}`}
                      label={item.label}
                      detail={item.detail}
                      tone={item.tone}
                    />
                  ))
                ) : (
                  <p className="relative text-sm text-[#5b5b5b]">Recognition activity will appear here.</p>
                )}
              </div>
              <Button variant="ghost" className="mt-6 w-full text-xs font-bold text-[#777]">
                View Full History
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

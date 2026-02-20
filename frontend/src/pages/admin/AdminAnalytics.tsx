import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import {
    LineChart, Line, AreaChart, Area,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
    Users, School, CalendarDays, BarChart3,
    TrendingUp, CheckCircle2, UserPlus, RefreshCw,
    Loader2, AlertCircle, GraduationCap, Award,
    Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ─── Brand colours ──────────────────────────────────────────────────────── */
const C = {
    cyan: "#00BCD4",
    orange: "#FF6F00",
    lime: "#C6E003",
    purple: "#7C3AED",
    red: "#E91E37",
    pink: "#E91E8C",
    teal: "#00897B",
    amber: "#F59E0B",
    indigo: "#4F46E5",
    gray: "#9CA3AF",
};

const ROLE_COLORS: Record<string, string> = {
    learner: C.cyan,
    teacher: C.orange,
    parent: C.purple,
    admin: C.red,
    school: C.teal,
    leader: C.lime,
    data_entry: C.indigo,
};

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DashData {
    meta: { days: number; start_date: string; end_date: string };
    kpis: Record<string, number>;
    user_growth: { date: string; new_users: number; new_enrollments: number }[];
    session_trend: { date: string; total: number; completed: number; scheduled: number }[];
    role_distribution: { role: string; count: number }[];
    school_performance: { school: string; learners: number; sessions: number }[];
    top_teachers: { name: string; sessions: number; completed: number }[];
    attendance_trend: { date: string; rate: number; present: number; absent: number; late: number }[];
    top_courses: { "course__name": string; count: number }[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

/* ─── KPI card ───────────────────────────────────────────────────────────── */
function Kpi({
    label, value, sub, icon: Icon, color, fmt = String,
}: {
    label: string; value: number | string; sub?: string;
    icon: any; color: string;
    fmt?: (v: number | string) => string;
}) {
    return (
        <Card className="border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: color }}>
            <CardContent className="p-5 flex items-center gap-4">
                <div
                    className="p-3 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                >
                    <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                    <p className="text-2xl font-bold" style={{ color }}>
                        {typeof value === "number" ? fmt(value) : value}
                    </p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

/* ─── Section card ───────────────────────────────────────────────────────── */
function Section({ title, desc, icon: Icon, color, children }: any) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" style={{ color }} />
                    {title}
                </CardTitle>
                {desc && <CardDescription>{desc}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

/* ─── Custom tooltip ─────────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-gray-500 capitalize">{p.name.replace("_", " ")}:</span>
                    <span className="font-bold">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function AdminAnalytics() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<DashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.analytics.dashboard({ days });
            setData(res.data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => { fetch(); }, [fetch]);

    const kpis = data?.kpis ?? {};

    /* trim daily series so sparse charts don't look flat */
    const trimmedUserGrowth = data?.user_growth.filter(d => d.new_users > 0 || d.new_enrollments > 0) ?? [];
    const trimmedSessionTrend = data?.session_trend.filter(d => d.total > 0) ?? [];
    const trimmedAttendance = data?.attendance_trend.filter(d => d.present + d.absent + d.late > 0) ?? [];

    /* show ALL points but still format them */
    const userGrowthData = (data?.user_growth ?? []).map(d => ({ ...d, date: fmtDate(d.date) }));
    const sessionTrendData = (data?.session_trend ?? []).map(d => ({ ...d, date: fmtDate(d.date) }));
    const attTrendData = (data?.attendance_trend ?? []).map(d => ({ ...d, date: fmtDate(d.date) }));

    /* top courses horizontal bar data */
    const topCoursesData = (data?.top_courses ?? []).map(c => ({
        name: c["course__name"] ?? "—",
        enrollments: c.count,
    }));

    return (
        <div className="min-h-screen p-3 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ─────────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            Analytics
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Platform-wide insights and performance metrics
                            {data && (
                                <span className="text-xs ml-2 text-gray-400">
                                    ({data.meta.start_date} → {data.meta.end_date})
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Time window selector */}
                        <div className="flex rounded-lg border bg-white overflow-hidden text-sm">
                            {[7, 30, 60, 90].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDays(d)}
                                    className={`px-3 py-2 transition-colors ${days === d
                                            ? "text-white font-semibold"
                                            : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    style={days === d ? { backgroundColor: C.cyan } : {}}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" onClick={fetch} className="gap-2" disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* ── Error banner ───────────────────────────────────────────────── */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-4 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-red-800 text-sm">Failed to load analytics</p>
                                <p className="text-xs text-red-600">{error}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={fetch} className="ml-auto border-red-300">Retry</Button>
                        </CardContent>
                    </Card>
                )}

                {/* ── Loading ─────────────────────────────────────────────────────── */}
                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: C.cyan }} />
                            <p className="text-gray-400 text-sm">Loading analytics…</p>
                        </div>
                    </div>
                )}

                {/* ── Content ─────────────────────────────────────────────────────── */}
                {!loading && data && (
                    <>
                        {/* ── KPI strip ───────────────────────────────────────────────── */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                            <Kpi label="Total Users" value={kpis.total_users ?? 0} icon={Users} color={C.cyan} sub={`${kpis.active_users ?? 0} active`} />
                            <Kpi label={`New Users (${days}d)`} value={kpis.new_users ?? 0} icon={UserPlus} color={C.orange} />
                            <Kpi label="Total Sessions" value={kpis.total_sessions ?? 0} icon={CalendarDays} color={C.purple} sub={`${kpis.new_sessions ?? 0} this period`} />
                            <Kpi label="Session Completion" value={`${kpis.session_completion_rate ?? 0}%`} icon={CheckCircle2} color={C.teal} />
                            <Kpi label="Attendance Rate" value={`${kpis.attendance_rate ?? 0}%`} icon={TrendingUp} color={C.lime} />
                            <Kpi label="Enrollments" value={kpis.total_enrollments ?? 0} icon={GraduationCap} color={C.indigo} sub={`+${kpis.new_enrollments ?? 0} new`} />
                        </div>

                        {/* ── Row 1: User Growth + Session Trend ──────────────────────── */}
                        <div className="grid lg:grid-cols-2 gap-6">

                            <Section title="User & Enrollment Growth" desc={`New signups and enrollments over ${days} days`} icon={UserPlus} color={C.cyan}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={userGrowthData} margin={{ left: -20, right: 0 }}>
                                        <defs>
                                            <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C.cyan} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gEnroll" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C.orange} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={C.orange} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                        <Tooltip content={<ChartTip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Area type="monotone" dataKey="new_users" name="New Users" stroke={C.cyan} fill="url(#gUsers)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="new_enrollments" name="New Enrollments" stroke={C.orange} fill="url(#gEnroll)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Section>

                            <Section title="Session Activity" desc={`Daily sessions over ${days} days`} icon={CalendarDays} color={C.purple}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={sessionTrendData} margin={{ left: -20, right: 0 }}>
                                        <defs>
                                            <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C.purple} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C.teal} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                        <Tooltip content={<ChartTip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Area type="monotone" dataKey="total" name="Total" stroke={C.purple} fill="url(#gTotal)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="completed" name="Completed" stroke={C.teal} fill="url(#gComp)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke={C.amber} fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Section>

                        </div>

                        {/* ── Row 2: Attendance trend + Role pie ──────────────────────── */}
                        <div className="grid lg:grid-cols-3 gap-6">

                            <div className="lg:col-span-2">
                                <Section title="Attendance Rate" desc="Daily attendance % (present vs total marked)" icon={TrendingUp} color={C.lime}>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={attTrendData} margin={{ left: -20, right: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                            <Tooltip content={<ChartTip />} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Line type="monotone" dataKey="rate" name="Rate (%)" stroke={C.lime} strokeWidth={2.5} dot={false} />
                                            <Line type="monotone" dataKey="present" name="Present" stroke={C.teal} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
                                            <Line type="monotone" dataKey="absent" name="Absent" stroke={C.red} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Section>
                            </div>

                            <Section title="User Roles" desc="Distribution across platform" icon={Users} color={C.orange}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={data.role_distribution}
                                            dataKey="count"
                                            nameKey="role"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={78}
                                            innerRadius={40}
                                            paddingAngle={2}
                                        >
                                            {data.role_distribution.map((entry, idx) => (
                                                <Cell
                                                    key={entry.role}
                                                    fill={ROLE_COLORS[entry.role] ?? Object.values(C)[idx % Object.keys(C).length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: any, name: any) => [v, name]} />
                                        <Legend
                                            wrapperStyle={{ fontSize: 10 }}
                                            formatter={v => v.replace("_", " ")}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Section>

                        </div>

                        {/* ── Row 3: School performance + Top courses ──────────────────── */}
                        <div className="grid lg:grid-cols-2 gap-6">

                            <Section title="School Performance" desc="Learners & sessions by school (top 10)" icon={School} color={C.teal}>
                                {data.school_performance.length === 0 ? (
                                    <div className="flex flex-col items-center py-12 text-gray-300">
                                        <School className="h-10 w-10 mb-2" />
                                        <p className="text-sm">No school data yet</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={data.school_performance} margin={{ left: -20, right: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                                            <YAxis
                                                type="category"
                                                dataKey="school"
                                                tick={{ fontSize: 10 }}
                                                width={90}
                                                tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "…" : v}
                                            />
                                            <Tooltip content={<ChartTip />} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="learners" name="Learners" fill={C.teal} radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="sessions" name="Sessions" fill={C.purple} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Section>

                            <Section title="Top Pathways" desc="Most-enrolled courses" icon={GraduationCap} color={C.indigo}>
                                {topCoursesData.length === 0 ? (
                                    <div className="flex flex-col items-center py-12 text-gray-300">
                                        <GraduationCap className="h-10 w-10 mb-2" />
                                        <p className="text-sm">No enrollment data yet</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={topCoursesData} margin={{ left: -20, right: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                tick={{ fontSize: 10 }}
                                                width={90}
                                                tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "…" : v}
                                            />
                                            <Tooltip content={<ChartTip />} />
                                            <Bar dataKey="enrollments" name="Enrollments" fill={C.indigo} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Section>

                        </div>

                        {/* ── Row 4: Top teachers leaderboard ─────────────────────────── */}
                        <Section title="Top Teachers" desc={`Ranked by sessions in the last ${days} days`} icon={Award} color={C.orange}>
                            {data.top_teachers.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-gray-300">
                                    <Users className="h-10 w-10 mb-2" />
                                    <p className="text-sm">No session data yet for this period</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {data.top_teachers.map((t, i) => {
                                            const completionPct = t.sessions > 0
                                                ? Math.round(t.completed / t.sessions * 100) : 0;
                                            const medals = ["🥇", "🥈", "🥉"];
                                            return (
                                                <Card key={t.name + i} className="border hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                                                                style={{ backgroundColor: C.orange }}
                                                            >
                                                                {medals[i] ?? `#${i + 1}`}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-semibold text-sm text-gray-800 truncate">{t.name}</p>
                                                                <p className="text-xs text-gray-400">{t.sessions} sessions</p>
                                                                {/* mini progress bar */}
                                                                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all"
                                                                        style={{ width: `${completionPct}%`, backgroundColor: C.teal }}
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-gray-400 mt-0.5">
                                                                    {completionPct}% completed
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Section>

                    </>
                )}

            </div>
        </div>
    );
}

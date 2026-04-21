import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teacherApi } from "@/lib/api";
import {
    Users,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Save,
    Loader2,
    CalendarDays,
    Search,
    ChevronRight,
    RefreshCw,
    ListChecks,
    Eye,
    ArrowLeft,
    Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid } from "date-fns";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
interface Learner {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

interface AttendanceRecord {
    learner_id: string;
    status: "present" | "absent" | "late" | "excused";
    notes: string;
}

interface ExistingRecord {
    learner_id: string;
    learner_name: string;
    status: string;
    notes: string;
}

// List response — learners/attendance_records may be absent
interface SessionListItem {
    id: string;
    module_name?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    attendance_marked?: boolean;
    learners?: Learner[];
    attendance_records?: ExistingRecord[];
}

// Full detail — guaranteed to have learners array
interface SessionDetail extends SessionListItem {
    learners: Learner[];
    attendance_records: ExistingRecord[];
}

type RawSession = SessionListItem & {
    learners?: Learner[] | null;
    attendance_records?: ExistingRecord[] | null;
};

type Tab = "capture" | "history";

const STATUS_COLORS = {
    present: { bg: "bg-green-100",  text: "text-green-700",  border: "border-green-300",  dot: "bg-green-500"  },
    absent:  { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300",    dot: "bg-red-500"    },
    late:    { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-300",  dot: "bg-amber-500"  },
    excused: { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-300",   dot: "bg-blue-500"   },
} as const;

function safeDate(d?: string) {
    if (!d) return "—";
    try {
        const parsed = parseISO(d);
        return isValid(parsed) ? format(parsed, "EEE, dd MMM yyyy") : d;
    } catch {
        return d;
    }
}

function statusIcon(s: string) {
    if (s === "present") return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (s === "absent")  return <XCircle     className="h-4 w-4 text-red-600"   />;
    if (s === "late")    return <Clock        className="h-4 w-4 text-amber-600" />;
    return <AlertCircle className="h-4 w-4 text-blue-600" />;
}

/* ─────────────────────────────────────────────────────────
   Mark-attendance panel
   – fetches full session detail on mount so learners are present
───────────────────────────────────────────────────────── */
function MarkAttendancePanel({
    sessionId,
    sessionTitle,
    onDone,
}: {
    sessionId: string;
    sessionTitle: string;
    onDone: () => void;
}) {
    const [session, setSession]     = useState<SessionDetail | null>(null);
    const [fetching, setFetching]   = useState(true);
    const [fetchErr, setFetchErr]   = useState<string | null>(null);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [success, setSuccess]     = useState(false);

    useEffect(() => {
        const load = async () => {
            setFetching(true);
            setFetchErr(null);
            try {
                const res = await teacherApi.getAttendance(sessionId);
                const s: SessionDetail = {
                    ...res.data,
                    learners: res.data.learners ?? [],
                    attendance_records: res.data.attendance_records ?? [],
                };
                setSession(s);
                // Pre-fill from existing records
                const init: Record<string, AttendanceRecord> = {};
                (s.learners).forEach((l: Learner) => {
                    const existing = s.attendance_records.find(r => r.learner_id === l.id);
                    init[l.id] = {
                        learner_id: l.id,
                        status: (existing?.status as AttendanceRecord["status"]) ?? "present",
                        notes: existing?.notes ?? "",
                    };
                });
                setAttendance(init);
            } catch {
                setFetchErr("Failed to load session details.");
            } finally {
                setFetching(false);
            }
        };
        load();
    }, [sessionId]);

    const set = (id: string, status: AttendanceRecord["status"]) =>
        setAttendance(p => ({ ...p, [id]: { ...p[id], status } }));
    const setNote = (id: string, notes: string) =>
        setAttendance(p => ({ ...p, [id]: { ...p[id], notes } }));
    const markAllPresent = () =>
        setAttendance(p =>
            Object.fromEntries(
                Object.entries(p).map(([k, v]) => [k, { ...v, status: "present" as const }])
            )
        );

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            await teacherApi.markAttendance(sessionId, Object.values(attendance));
            setSuccess(true);
            setTimeout(onDone, 1200);
        } catch {
            setError("Failed to save attendance. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const learners = session?.learners ?? [];
    const present  = Object.values(attendance).filter(a => a.status === "present").length;
    const absent   = Object.values(attendance).filter(a => a.status === "absent").length;

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--fundi-cyan)" }} />
            </div>
        );
    }

    if (fetchErr) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={onDone} className="gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {fetchErr}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Sub-header */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost" size="sm" onClick={onDone} className="gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div>
                    <h2 className="font-bold text-lg" style={{ color: "var(--fundi-black)" }}>
                        {session?.module_name ?? sessionTitle}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {safeDate(session?.date)}
                        {session?.start_time && ` · ${session.start_time}`}
                    </p>
                </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total",   value: learners.length, color: "var(--fundi-cyan)" },
                    { label: "Present", value: present,         color: "var(--fundi-lime)" },
                    { label: "Absent",  value: absent,          color: "#ef4444"            },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Feedback banners */}
            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" /> Attendance saved!
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick actions */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    {learners.length} learner{learners.length !== 1 && "s"}
                </p>
                <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-1 text-xs"
                    disabled={learners.length === 0}>
                    <CheckCircle className="h-3 w-3" /> Mark All Present
                </Button>
            </div>

            {/* Learner cards */}
            <div className="space-y-3">
                {learners.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No learners enrolled in this session yet.</p>
                    </div>
                )}
                {learners.map((learner, i) => {
                    const rec = attendance[learner.id];
                    const currentStatus = rec?.status ?? "present";
                    return (
                        <motion.div key={learner.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}>
                            <Card className={`border-2 transition-colors ${STATUS_COLORS[currentStatus].border}`}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[currentStatus].dot}`} />
                                        <span className="font-semibold">{learner.full_name}</span>
                                    </div>
                                    {/* Status buttons */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {(["present", "absent", "late", "excused"] as const).map(s => {
                                            const c = STATUS_COLORS[s];
                                            const active = currentStatus === s;
                                            return (
                                                <button key={s} onClick={() => set(learner.id, s)}
                                                    className={`py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                                                        active
                                                            ? `${c.bg} ${c.text} ${c.border}`
                                                            : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                                                    }`}>
                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {/* Notes for absent / excused */}
                                    {(currentStatus === "absent" || currentStatus === "excused") && (
                                        <Input
                                            placeholder="Note (e.g. sick, family matter)…"
                                            value={rec?.notes ?? ""}
                                            onChange={e => setNote(learner.id, e.target.value)}
                                            className="text-sm h-8"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Save */}
            {learners.length > 0 && (
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onDone} disabled={saving}>Cancel</Button>
                    <Button onClick={save} disabled={saving || success}
                        style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                        className="gap-2 min-w-[140px]">
                        {saving
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                            : <><Save className="h-4 w-4" /> Save Attendance</>}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────
   History panel
───────────────────────────────────────────────────────── */
function AttendanceHistoryPanel({ sessions }: { sessions: SessionListItem[] }) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch]     = useState("");

    const marked = sessions.filter(s => s.attendance_marked);
    const filtered = marked.filter(s =>
        (s.module_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.date ?? "").includes(search)
    );

    // Generate CSV from attendance data
    const exportToCSV = () => {
        if (marked.length === 0) return;

        // CSV Header
        const headers = ["Session", "Date", "Learner Name", "Status", "Notes"];
        
        // CSV Rows
        const rows: string[][] = [];
        marked.forEach(session => {
            const sessionName = session.module_name ?? "Session";
            const sessionDate = session.date ?? "";
            
            if (session.attendance_records && session.attendance_records.length > 0) {
                session.attendance_records.forEach(record => {
                    rows.push([
                        sessionName,
                        sessionDate,
                        record.learner_name,
                        record.status,
                        record.notes || ""
                    ]);
                });
            } else {
                rows.push([sessionName, sessionDate, "No records", "", ""]);
            }
        });

        // Create CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map(row => 
                row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
            )
        ].join("\n");

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance-history-${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by module or date…" value={search}
                        onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportToCSV}
                    disabled={marked.length === 0}
                    className="gap-1.5 shrink-0"
                >
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-14 text-gray-400">
                    <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">
                        {marked.length === 0 ? "No attendance records yet." : "No results match your search."}
                    </p>
                    <p className="text-sm mt-1">Mark attendance from the Capture tab to see history here.</p>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map((session, i) => {
                    const records = session.attendance_records ?? [];
                    const pct = records.length
                        ? Math.round((records.filter(r => r.status === "present").length / records.length) * 100)
                        : null;
                    const isOpen = expanded === session.id;

                    return (
                        <motion.div key={session.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}>
                            <Card className="overflow-hidden">
                                <button className="w-full text-left"
                                    onClick={() => setExpanded(isOpen ? null : session.id)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="rounded-lg p-2 shrink-0"
                                                    style={{ backgroundColor: "rgba(0,191,165,0.1)" }}>
                                                    <CalendarDays className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate">{session.module_name ?? "Session"}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {safeDate(session.date)}
                                                        {session.start_time && ` · ${session.start_time}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {pct !== null && (
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-sm font-bold"
                                                            style={{ color: pct >= 80 ? "var(--fundi-lime)" : "#f59e0b" }}>
                                                            {pct}%
                                                        </p>
                                                        <p className="text-xs text-gray-400">attendance</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5">
                                                    {(["present","absent","late","excused"] as const).map(s => {
                                                        const count = records.filter(r => r.status === s).length;
                                                        if (!count) return null;
                                                        return (
                                                            <span key={s}
                                                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s].bg} ${STATUS_COLORS[s].text}`}>
                                                                {count}{s === "present" ? "P" : s === "absent" ? "A" : s === "late" ? "L" : "E"}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                            <div className="border-t bg-gray-50 px-4 py-3">
                                                {records.length === 0 ? (
                                                    <p className="text-sm text-gray-400 py-2">No attendance records for this session.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {records.map(r => (
                                                            <div key={r.learner_id}
                                                                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border text-sm">
                                                                {statusIcon(r.status)}
                                                                <span className="font-medium truncate flex-1">{r.learner_name}</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                                                    STATUS_COLORS[r.status as keyof typeof STATUS_COLORS]?.bg ?? "bg-gray-100"
                                                                } ${
                                                                    STATUS_COLORS[r.status as keyof typeof STATUS_COLORS]?.text ?? "text-gray-600"
                                                                }`}>
                                                                    {r.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   Main Hub
───────────────────────────────────────────────────────── */
export default function TeacherAttendanceHub() {
    const [tab, setTab]         = useState<Tab>("capture");
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [search, setSearch]   = useState("");

    // Instead of storing the full session object (which may lack fields),
    // store only id + title so MarkAttendancePanel fetches the full detail.
    const [active, setActive] = useState<{ id: string; title: string } | null>(null);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await teacherApi.getAttendanceSessions();
            const raw = Array.isArray(res.data)
                ? res.data
                : res.data?.results ?? res.data?.sessions ?? [];

            // Normalise — ensure arrays exist
            const data: SessionListItem[] = (raw as RawSession[]).map((session) => ({
                ...session,
                learners: session.learners ?? [],
                attendance_records: session.attendance_records ?? [],
            }));

            // Sort: needs-capture first, then by date desc
            data.sort((a, b) => {
                const aM = a.attendance_marked ? 1 : 0;
                const bM = b.attendance_marked ? 1 : 0;
                if (aM !== bM) return aM - bM;
                return (b.date ?? "").localeCompare(a.date ?? "");
            });

            setSessions(data);
        } catch {
            setError("Failed to load sessions. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const needsCapture = sessions.filter(s => !s.attendance_marked && s.status !== "cancelled");
    const markedCount  = sessions.filter(s => s.attendance_marked).length;

    const captureSessions = needsCapture.filter(s =>
        (s.module_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.date ?? "").includes(search)
    );

    /* ── Loading screen ─────────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: "var(--fundi-cyan)" }} />
                    <p className="text-gray-500 text-sm">Loading sessions…</p>
                </div>
            </div>
        );
    }

    /* ── Mark-attendance detail view ────────────────── */
    if (active) {
        return (
            <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto">
                <MarkAttendancePanel
                    sessionId={active.id}
                    sessionTitle={active.title}
                    onDone={() => { setActive(null); fetchSessions(); }}
                />
            </div>
        );
    }

    /* ── Main hub ───────────────────────────────────── */
    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            Attendance
                        </h1>
                        <p className="text-gray-500 mt-0.5 text-sm">Capture and review student attendance</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchSessions} className="gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <CalendarDays className="h-8 w-8 opacity-60" style={{ color: "var(--fundi-cyan)" }} />
                            <div>
                                <p className="text-2xl font-bold" style={{ color: "var(--fundi-cyan)" }}>
                                    {sessions.length}
                                </p>
                                <p className="text-xs text-gray-500">Total Sessions</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-400">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Clock className="h-8 w-8 text-amber-500 opacity-60" />
                            <div>
                                <p className="text-2xl font-bold text-amber-600">{needsCapture.length}</p>
                                <p className="text-xs text-gray-500">Needs Capture</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500 col-span-2 md:col-span-1">
                        <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500 opacity-60" />
                            <div>
                                <p className="text-2xl font-bold text-green-600">{markedCount}</p>
                                <p className="text-xs text-gray-500">Marked</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Error */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4 flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                        </CardContent>
                    </Card>
                )}

                {/* Tab bar */}
                <div className="flex gap-1 bg-white border rounded-xl p-1 w-fit">
                    {([
                        { id: "capture" as Tab, label: "Capture Attendance", icon: ListChecks },
                        { id: "history" as Tab, label: "Attendance History",  icon: Eye       },
                    ]).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                tab === t.id ? "text-white shadow" : "text-gray-500 hover:text-gray-700"
                            }`}
                            style={tab === t.id ? { backgroundColor: "var(--fundi-cyan)" } : {}}>
                            <t.icon className="h-4 w-4" />
                            {t.label}
                            {t.id === "capture" && needsCapture.length > 0 && (
                                <span className="ml-0.5 rounded-full bg-amber-400 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center">
                                    {needsCapture.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    {tab === "capture" && (
                        <motion.div key="capture" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }} className="space-y-4">

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Search sessions…" value={search}
                                    onChange={e => setSearch(e.target.value)} className="pl-9 bg-white" />
                            </div>

                            {captureSessions.length === 0 && (
                                <Card>
                                    <CardContent className="py-14 text-center text-gray-400">
                                        <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-500" />
                                        <p className="font-medium text-gray-600">All caught up!</p>
                                        <p className="text-sm mt-1">No sessions are pending attendance capture.</p>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="space-y-3">
                                {captureSessions.map((session, i) => {
                                    const learnerCount = session.learners?.length ?? 0;
                                    return (
                                        <motion.div key={session.id} initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                            <Card className="hover:shadow-md transition-shadow cursor-pointer group"
                                                onClick={() => setActive({
                                                    id: session.id,
                                                    title: session.module_name ?? "Session",
                                                })}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-4 justify-between">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="rounded-xl p-2.5 shrink-0"
                                                                style={{ backgroundColor: "rgba(0,191,165,0.12)" }}>
                                                                <CalendarDays className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold truncate">
                                                                    {session.module_name ?? "Untitled Session"}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {safeDate(session.date)}
                                                                    {session.start_time && (
                                                                        <> · <span className="font-medium">{session.start_time}</span></>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                                                                <Users className="h-3.5 w-3.5" />
                                                                {learnerCount} learner{learnerCount !== 1 && "s"}
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                session.status === "in_progress"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : session.status === "completed"
                                                                        ? "bg-gray-100 text-gray-600"
                                                                        : "bg-amber-100 text-amber-700"
                                                            }`}>
                                                                {(session.status ?? "pending").replace("_", " ")}
                                                            </span>
                                                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {tab === "history" && (
                        <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}>
                            <AttendanceHistoryPanel sessions={sessions} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

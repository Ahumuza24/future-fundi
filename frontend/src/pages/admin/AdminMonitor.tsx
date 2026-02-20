import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays, ListTodo, Users, RefreshCw, Filter,
    CheckCircle2, Clock, AlertCircle, BarChart3,
    BookOpen, GraduationCap, School, ChevronDown,
    TrendingUp, CheckCheck, XCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface SessionRecord {
    id: string; module_name: string; pathway: string;
    teacher_name: string; school: string; date: string;
    start_time: string | null; status: string; attendance_marked: boolean;
}
interface TaskRecord {
    id: string; teacher_name: string; title: string; description: string;
    due_date: string | null; priority: string; status: string; created_at: string;
}
interface AttendanceRecord {
    id: string; learner_name: string; module_name: string; pathway: string;
    teacher_name: string; school: string; session_date: string; attendance_status: string;
}

type Tab = "sessions" | "tasks" | "attendance";

/* ─── Status chips ────────────────────────────────────────────────────────── */
const SESSION_STATUS: Record<string, string> = {
    scheduled: "bg-blue-100  text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100   text-red-600",
};
const TASK_STATUS: Record<string, string> = {
    todo: "bg-gray-100   text-gray-700",
    in_progress: "bg-amber-100  text-amber-700",
    done: "bg-green-100  text-green-700",
};
const PRIORITY_COLOR: Record<string, string> = {
    urgent: "bg-red-100    text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100   text-gray-600",
};
const ATT_STATUS: Record<string, string> = {
    present: "bg-green-100 text-green-700",
    absent: "bg-red-100   text-red-600",
    late: "bg-amber-100 text-amber-700",
};

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon: Icon }:
    { label: string; value: number | string; sub?: string; color: string; icon: any }) {
    return (
        <Card className="border-l-4" style={{ borderLeftColor: color }}>
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-3xl font-bold" style={{ color }}>{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
                <Icon className="h-10 w-10 opacity-15" style={{ color }} />
            </CardContent>
        </Card>
    );
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AdminMonitor() {
    const [tab, setTab] = useState<Tab>("sessions");

    /* summary data */
    const [sessionsSummary, setSessionsSummary] = useState<any>(null);
    const [tasksSummary, setTasksSummary] = useState<any>(null);
    const [attSummary, setAttSummary] = useState<any>(null);

    /* table data */
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [tasks, setTasks] = useState<TaskRecord[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

    /* loading */
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingTable, setLoadingTable] = useState(false);

    /* filters */
    const [sessionStatus, setSessionStatus] = useState("");
    const [taskStatus, setTaskStatus] = useState("");
    const [taskPriority, setTaskPriority] = useState("");
    const [attStatus, setAttStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    /* ── Load summaries on mount ─────────────────────────────────────────── */
    const fetchSummaries = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const [s, t, a] = await Promise.all([
                adminApi.monitor.sessions.summary(),
                adminApi.monitor.tasks.summary(),
                adminApi.monitor.attendance.summary(),
            ]);
            setSessionsSummary(s.data);
            setTasksSummary(t.data);
            setAttSummary(a.data);
        } catch (e) { console.error(e); }
        finally { setLoadingSummary(false); }
    }, []);

    useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

    /* ── Load table when tab / filters change ────────────────────────────── */
    const fetchTable = useCallback(async () => {
        setLoadingTable(true);
        try {
            if (tab === "sessions") {
                const p: any = { page_size: 100 };
                if (sessionStatus) p.status = sessionStatus;
                if (dateFrom) p.date_from = dateFrom;
                if (dateTo) p.date_to = dateTo;
                const res = await adminApi.monitor.sessions.list(p);
                setSessions(res.data.results ?? []);
            } else if (tab === "tasks") {
                const p: any = { page_size: 100 };
                if (taskStatus) p.status = taskStatus;
                if (taskPriority) p.priority = taskPriority;
                const res = await adminApi.monitor.tasks.list(p);
                setTasks(res.data.results ?? []);
            } else {
                const p: any = { page_size: 100 };
                if (attStatus) p.status = attStatus;
                if (dateFrom) p.date_from = dateFrom;
                if (dateTo) p.date_to = dateTo;
                const res = await adminApi.monitor.attendance.list(p);
                setAttendance(res.data.results ?? []);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingTable(false); }
    }, [tab, sessionStatus, taskStatus, taskPriority, attStatus, dateFrom, dateTo]);

    useEffect(() => { fetchTable(); }, [fetchTable]);

    /* tabs config */
    const tabs: { id: Tab; label: string; icon: any; color: string }[] = [
        { id: "sessions", label: "Teacher Sessions", icon: CalendarDays, color: "var(--fundi-cyan)" },
        { id: "tasks", label: "Teacher Tasks", icon: ListTodo, color: "var(--fundi-purple)" },
        { id: "attendance", label: "Student Attendance", icon: Users, color: "var(--fundi-lime)" },
    ];

    /* ────────────────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen p-3 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            Activity Monitor
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Real-time oversight of sessions, tasks, and attendance
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => { fetchSummaries(); fetchTable(); }} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                </div>

                {/* ── Summary Stat Cards ─────────────────────────────────────────── */}
                {loadingSummary ? (
                    <div className="flex items-center gap-2 text-gray-400 py-4">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading summaries…
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                        <StatCard label="Sessions Today" value={sessionsSummary?.today ?? 0} color="var(--fundi-cyan)" icon={CalendarDays} />
                        <StatCard label="Sessions / Month" value={sessionsSummary?.this_month ?? 0} color="var(--fundi-cyan)" sub="this month" icon={BarChart3} />
                        <StatCard label="Attendance Pending" value={sessionsSummary?.attendance_pending ?? 0} color="var(--fundi-orange)" icon={AlertCircle} />
                        <StatCard label="Tasks Open" value={(tasksSummary?.by_status?.todo ?? 0) + (tasksSummary?.by_status?.in_progress ?? 0)} color="var(--fundi-purple)" icon={ListTodo} />
                        <StatCard label="Overdue Tasks" value={tasksSummary?.overdue ?? 0} color="var(--fundi-red)" icon={XCircle} />
                        <StatCard label="Attendance Rate" value={`${attSummary?.overall_attendance_rate ?? 0}%`} color="var(--fundi-lime)" icon={TrendingUp} />
                    </div>
                )}

                {/* ── Tabs ──────────────────────────────────────────────────────── */}
                <div className="flex gap-2 border-b">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${tab === t.id
                                    ? "border-current"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                                }`}
                            style={{ color: tab === t.id ? t.color : undefined, borderBottomColor: tab === t.id ? t.color : undefined }}>
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Filters bar ────────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl border">
                    <Filter className="h-4 w-4 text-gray-400" />

                    {/* Sessions filters */}
                    {tab === "sessions" && (<>
                        <select value={sessionStatus} onChange={e => setSessionStatus(e.target.value)}
                            className="text-sm border rounded-md px-3 py-1.5 bg-white">
                            <option value="">All Statuses</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </>)}

                    {/* Tasks filters */}
                    {tab === "tasks" && (<>
                        <select value={taskStatus} onChange={e => setTaskStatus(e.target.value)}
                            className="text-sm border rounded-md px-3 py-1.5 bg-white">
                            <option value="">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                        <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                            className="text-sm border rounded-md px-3 py-1.5 bg-white">
                            <option value="">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </>)}

                    {/* Attendance filters */}
                    {tab === "attendance" && (
                        <select value={attStatus} onChange={e => setAttStatus(e.target.value)}
                            className="text-sm border rounded-md px-3 py-1.5 bg-white">
                            <option value="">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    )}

                    {/* Date range (sessions + attendance) */}
                    {(tab === "sessions" || tab === "attendance") && (<>
                        <div className="flex items-center gap-1">
                            <label className="text-xs text-gray-500">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="text-sm border rounded-md px-2 py-1.5 bg-white" />
                        </div>
                        <div className="flex items-center gap-1">
                            <label className="text-xs text-gray-500">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="text-sm border rounded-md px-2 py-1.5 bg-white" />
                        </div>
                    </>)}

                    {/* Clear */}
                    <button onClick={() => { setSessionStatus(""); setTaskStatus(""); setTaskPriority(""); setAttStatus(""); setDateFrom(""); setDateTo(""); }}
                        className="text-xs text-gray-400 hover:text-gray-600 underline">Clear filters</button>
                </div>

                {/* ── Table area ─────────────────────────────────────────────────── */}
                {loadingTable ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">

                        {/* SESSIONS TABLE */}
                        {tab === "sessions" && (
                            <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <CalendarDays className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                                            Teacher Sessions
                                            <span className="ml-auto text-sm font-normal text-gray-500">{sessions.length} records</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {sessions.length === 0 ? (
                                            <div className="text-center py-16 text-gray-400">
                                                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                <p>No sessions found</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                                                            <th className="px-4 py-3">Module / Pathway</th>
                                                            <th className="px-4 py-3">Teacher</th>
                                                            <th className="px-4 py-3">School</th>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3">Status</th>
                                                            <th className="px-4 py-3">Attendance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {sessions.map((s, i) => (
                                                            <motion.tr key={s.id}
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                                transition={{ delay: i * 0.02 }}
                                                                className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <p className="font-semibold text-gray-800">{s.module_name}</p>
                                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <BookOpen className="h-3 w-3" />{s.pathway}
                                                                    </p>
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-700">{s.teacher_name}</td>
                                                                <td className="px-4 py-3 text-gray-500 text-xs">{s.school}</td>
                                                                <td className="px-4 py-3 text-gray-600">
                                                                    {new Date(s.date + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                                                                    {s.start_time && <p className="text-xs text-gray-400">{s.start_time}</p>}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SESSION_STATUS[s.status] ?? ""}`}>
                                                                        {s.status.replace("_", " ")}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {s.attendance_marked
                                                                        ? <span className="text-green-600 flex items-center gap-1 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> Marked</span>
                                                                        : <span className="text-amber-500 flex items-center gap-1 text-xs"><Clock className="h-3.5 w-3.5" /> Pending</span>}
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* TASKS TABLE */}
                        {tab === "tasks" && (
                            <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <ListTodo className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                                            Teacher Tasks
                                            <span className="ml-auto text-sm font-normal text-gray-500">{tasks.length} records</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {tasks.length === 0 ? (
                                            <div className="text-center py-16 text-gray-400">
                                                <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                <p>No tasks found</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                                                            <th className="px-4 py-3">Task</th>
                                                            <th className="px-4 py-3">Teacher</th>
                                                            <th className="px-4 py-3">Priority</th>
                                                            <th className="px-4 py-3">Status</th>
                                                            <th className="px-4 py-3">Due Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {tasks.map((t, i) => (
                                                            <motion.tr key={t.id}
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                                transition={{ delay: i * 0.02 }}
                                                                className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <p className="font-semibold text-gray-800">{t.title}</p>
                                                                    {t.description && <p className="text-xs text-gray-400 line-clamp-1">{t.description}</p>}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-700">{t.teacher_name}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[t.priority] ?? ""}`}>
                                                                        {t.priority}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS[t.status] ?? ""}`}>
                                                                        {t.status.replace("_", " ")}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                                    {t.due_date
                                                                        ? new Date(t.due_date + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                                                                        : <span className="text-gray-300">—</span>}
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* ATTENDANCE TABLE */}
                        {tab === "attendance" && (
                            <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {/* Attendance breakdown mini-cards */}
                                {attSummary && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <StatCard label="Present" value={attSummary.by_status?.present ?? 0} color="var(--fundi-lime)" icon={CheckCheck} />
                                        <StatCard label="Absent" value={attSummary.by_status?.absent ?? 0} color="var(--fundi-red)" icon={XCircle} />
                                        <StatCard label="Late" value={attSummary.by_status?.late ?? 0} color="var(--fundi-orange)" icon={Clock} />
                                        <StatCard label="This Month" value={attSummary.this_month ?? 0} color="var(--fundi-cyan)" icon={CalendarDays} />
                                    </div>
                                )}

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Users className="h-5 w-5" style={{ color: "var(--fundi-lime)" }} />
                                            Student Attendance Records
                                            <span className="ml-auto text-sm font-normal text-gray-500">{attendance.length} records</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {attendance.length === 0 ? (
                                            <div className="text-center py-16 text-gray-400">
                                                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                <p>No attendance records found</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                                                            <th className="px-4 py-3">Learner</th>
                                                            <th className="px-4 py-3">Module / Pathway</th>
                                                            <th className="px-4 py-3">Teacher</th>
                                                            <th className="px-4 py-3">School</th>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {attendance.map((a, i) => (
                                                            <motion.tr key={a.id}
                                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                                transition={{ delay: i * 0.02 }}
                                                                className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 font-semibold text-gray-800">{a.learner_name}</td>
                                                                <td className="px-4 py-3">
                                                                    <p className="text-gray-700">{a.module_name}</p>
                                                                    <p className="text-xs text-gray-400">{a.pathway}</p>
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-600">{a.teacher_name}</td>
                                                                <td className="px-4 py-3 text-gray-500 text-xs">{a.school}</td>
                                                                <td className="px-4 py-3 text-gray-600">
                                                                    {new Date(a.session_date + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${ATT_STATUS[a.attendance_status] ?? "bg-gray-100 text-gray-600"}`}>
                                                                        {a.attendance_status}
                                                                    </span>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

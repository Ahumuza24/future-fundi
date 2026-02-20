import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { teacherApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Calendar, Clock, Users, CheckCircle2, Play, CheckCheck,
    Loader2, AlertCircle, BookOpen, Pencil, Trash2, Filter,
    CalendarDays, ChevronRight, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Pathway {
    id: string;
    name: string;
    description: string;
    modules: { id: string; name: string }[];
}

interface Session {
    id: string;
    module: string;
    module_name: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    attendance_marked: boolean;
    notes: string;
    learner_count?: number;
}

/* ─── Config ─────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
    scheduled: { label: "Scheduled", color: "text-blue-600", bg: "bg-blue-50   border-blue-200", bar: "bg-blue-400" },
    in_progress: { label: "In Progress", color: "text-amber-600", bg: "bg-amber-50  border-amber-200", bar: "bg-amber-400" },
    completed: { label: "Completed", color: "text-green-600", bg: "bg-green-50  border-green-200", bar: "bg-green-400" },
    cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50    border-red-200", bar: "bg-red-400" },
};

const emptyForm = {
    pathway_id: "",
    module: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    notes: "",
    status: "scheduled",
};

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function TeacherSessions() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<Session[]>([]);
    const [pathways, setPathways] = useState<Pathway[]>([]);
    const [loading, setLoading] = useState(true);
    const [pathwaysLoading, setPathwaysLoading] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    /* derived */
    const selectedPathway = pathways.find(p => p.id === form.pathway_id) ?? null;
    const availableModules = selectedPathway?.modules ?? [];

    /* ── Data fetching ─────────────────────────────────────────────────── */
    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await teacherApi.getSessions();
            const data = res.data;
            setSessions(Array.isArray(data) ? data : (data?.results ?? []));
        } catch (e) {
            console.error("Failed to fetch sessions:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPathways = async () => {
        setPathwaysLoading(true);
        try {
            const res = await teacherApi.listPathways();
            setPathways(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error("Failed to load pathways:", e);
        } finally {
            setPathwaysLoading(false);
        }
    };

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    /* ── Dialog helpers ────────────────────────────────────────────────── */
    const openCreate = () => {
        setEditingSession(null);
        setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
        setError("");
        setDialogOpen(true);
        fetchPathways();
    };

    const openEdit = (s: Session) => {
        setEditingSession(s);
        // We need to figure out which pathway this module belongs to
        // We'll load pathways first, then set after
        setForm({
            pathway_id: "",   // will be resolved below after pathways load
            module: s.module,
            date: s.date,
            start_time: s.start_time || "",
            end_time: s.end_time || "",
            notes: s.notes || "",
            status: s.status,
        });
        setError("");
        setDialogOpen(true);
        // Load pathways and match existing module to its pathway
        setPathwaysLoading(true);
        teacherApi.listPathways().then(res => {
            const pw: Pathway[] = Array.isArray(res.data) ? res.data : [];
            setPathways(pw);
            const matchingPathway = pw.find(p => p.modules.some(m => m.id === s.module));
            if (matchingPathway) {
                setForm(f => ({ ...f, pathway_id: matchingPathway.id }));
            }
        }).catch(console.error).finally(() => setPathwaysLoading(false));
    };

    /* ── Save ──────────────────────────────────────────────────────────── */
    const handleSave = async () => {
        if (!form.module) return setError("Please select a microcredential.");
        if (!form.date) return setError("Please select a date.");
        setSaving(true);
        setError("");
        try {
            const payload = {
                module: form.module,
                date: form.date,
                start_time: form.start_time || undefined,
                end_time: form.end_time || undefined,
                notes: form.notes,
                status: form.status,
            };
            if (editingSession) {
                await teacherApi.updateSession(editingSession.id, payload);
            } else {
                await teacherApi.createSession(payload);
            }
            setDialogOpen(false);
            await fetchSessions();
        } catch (e: any) {
            const detail = e?.response?.data;
            setError(typeof detail === "string" ? detail : JSON.stringify(detail) || "Failed to save session.");
        } finally {
            setSaving(false);
        }
    };

    /* ── Actions ────────────────────────────────────────────────────────── */
    const handleStart = async (id: string) => { setActionLoading(id + "_start"); try { await teacherApi.startSession(id); await fetchSessions(); } catch (e) { } finally { setActionLoading(null); } };
    const handleComplete = async (id: string) => { setActionLoading(id + "_complete"); try { await teacherApi.completeSession(id); await fetchSessions(); } catch (e) { } finally { setActionLoading(null); } };
    const handleDelete = async (id: string) => { setActionLoading(id + "_delete"); try { await teacherApi.deleteSession(id); await fetchSessions(); } catch (e) { } finally { setActionLoading(null); setDeleteConfirmId(null); } };

    /* ── Derived ────────────────────────────────────────────────────────── */
    const filtered = sessions.filter(s => filterStatus === "all" || s.status === filterStatus);
    const stats = {
        total: sessions.length,
        scheduled: sessions.filter(s => s.status === "scheduled").length,
        in_progress: sessions.filter(s => s.status === "in_progress").length,
        completed: sessions.filter(s => s.status === "completed").length,
    };

    /* ─────────────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen p-3 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            My Sessions
                        </h1>
                        <p className="text-gray-500 mt-1">Schedule, manage, and track your teaching sessions</p>
                    </div>
                    <Button onClick={openCreate} className="flex items-center gap-2 shadow-lg"
                        style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}>
                        <Plus className="h-4 w-4" /> New Session
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: stats.total, color: "var(--fundi-cyan)", icon: CalendarDays },
                        { label: "Scheduled", value: stats.scheduled, color: "var(--fundi-purple)", icon: Calendar },
                        { label: "In Progress", value: stats.in_progress, color: "var(--fundi-orange)", icon: Clock },
                        { label: "Completed", value: stats.completed, color: "var(--fundi-lime)", icon: CheckCircle2 },
                    ].map((stat, i) => (
                        <motion.div key={stat.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}>
                            <Card className="border-l-4" style={{ borderLeftColor: stat.color }}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                        <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                                    </div>
                                    <stat.icon className="h-8 w-8 opacity-20" style={{ color: stat.color }} />
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Filter:</span>
                    {(["all", "scheduled", "in_progress", "completed", "cancelled"] as const).map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${filterStatus === s
                                    ? "border-[var(--fundi-cyan)] bg-[var(--fundi-cyan)] text-white"
                                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                                }`}>
                            {s === "all" ? "All" : STATUS_CONFIG[s]?.label || s}
                        </button>
                    ))}
                </div>

                {/* Session List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <CalendarDays className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-500 text-lg">No sessions found</p>
                            <p className="text-gray-400 text-sm mt-1">Click "New Session" to get started</p>
                            <Button onClick={openCreate} className="mt-4"
                                style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}>
                                <Plus className="h-4 w-4 mr-2" /> New Session
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <AnimatePresence>
                        <div className="space-y-3">
                            {filtered.map((session, idx) => {
                                const sConf = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.scheduled;
                                const isBusy = (k: string) => actionLoading === session.id + k;
                                return (
                                    <motion.div key={session.id}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }} transition={{ delay: idx * 0.04 }}>
                                        <Card className={`hover:shadow-md transition-all border-l-4 ${sConf.bar.replace("bg-", "border-")}`}>
                                            <CardContent className="p-5">
                                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-2">
                                                            <BookOpen className="h-5 w-5 mt-0.5 text-gray-400 flex-shrink-0" />
                                                            <div>
                                                                <h3 className="font-bold text-gray-800 text-lg leading-tight">
                                                                    {session.module_name || "Session"}
                                                                </h3>
                                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3.5 w-3.5" />
                                                                        {new Date(session.date + "T12:00:00").toLocaleDateString("en-ZA", {
                                                                            weekday: "short", year: "numeric", month: "short", day: "numeric"
                                                                        })}
                                                                    </span>
                                                                    {session.start_time && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                            {session.start_time}{session.end_time ? ` – ${session.end_time}` : ""}
                                                                        </span>
                                                                    )}
                                                                    {session.learner_count !== undefined && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Users className="h-3.5 w-3.5" />
                                                                            {session.learner_count} learners
                                                                        </span>
                                                                    )}
                                                                    {session.attendance_marked && (
                                                                        <span className="flex items-center gap-1 text-green-600">
                                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                                            Attendance marked
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {session.notes && (
                                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{session.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${sConf.bg} ${sConf.color}`}>
                                                            {sConf.label}
                                                        </span>
                                                        {session.status === "scheduled" && (
                                                            <Button size="sm"
                                                                onClick={() => handleStart(session.id)}
                                                                disabled={!!actionLoading}
                                                                style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}>
                                                                {isBusy("_start") ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                                                Start
                                                            </Button>
                                                        )}
                                                        {session.status === "in_progress" && (
                                                            <>
                                                                <Button size="sm" variant="outline"
                                                                    onClick={() => navigate(`/teacher/attendance/${session.id}`)}>
                                                                    <Users className="h-3 w-3 mr-1" /> Attendance
                                                                </Button>
                                                                <Button size="sm"
                                                                    onClick={() => handleComplete(session.id)}
                                                                    disabled={!!actionLoading}
                                                                    style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}>
                                                                    {isBusy("_complete") ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCheck className="h-3 w-3 mr-1" />}
                                                                    Complete
                                                                </Button>
                                                            </>
                                                        )}
                                                        {session.status === "completed" && !session.attendance_marked && (
                                                            <Button size="sm" variant="outline"
                                                                onClick={() => navigate(`/teacher/attendance/${session.id}`)}>
                                                                <Users className="h-3 w-3 mr-1" /> Mark Attendance
                                                            </Button>
                                                        )}
                                                        <button onClick={() => openEdit(session)}
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => setDeleteConfirmId(session.id)}
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                            {isBusy("_delete") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            {/* ── Create / Edit Dialog ────────────────────────────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                            {editingSession ? "Edit Session" : "New Session"}
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4 py-2">

                        {/* ── Step 1: Pathway ───────────────────────── */}
                        <div>
                            <Label className="flex items-center gap-1.5 mb-1">
                                <GraduationCap className="h-4 w-4" style={{ color: "var(--fundi-cyan)" }} />
                                Step 1 — Select Pathway
                                <span className="text-red-500">*</span>
                            </Label>

                            {pathwaysLoading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-400 h-10 px-3 rounded-md border border-input bg-background">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading pathways…
                                </div>
                            ) : pathways.length === 0 ? (
                                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                                    <AlertCircle className="h-4 w-4 inline mr-1" />
                                    No pathways available. You need active courses with modules assigned.
                                </div>
                            ) : (
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={form.pathway_id}
                                    onChange={e => setForm(f => ({ ...f, pathway_id: e.target.value, module: "" }))}
                                >
                                    <option value="">Choose a pathway…</option>
                                    {pathways.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* ── Step 2: Microcredential ────────────────── */}
                        <div>
                            <Label className="flex items-center gap-1.5 mb-1">
                                <BookOpen className="h-4 w-4" style={{ color: "var(--fundi-purple)" }} />
                                Step 2 — Select Microcredential (Module)
                                <span className="text-red-500">*</span>
                            </Label>

                            {!form.pathway_id ? (
                                <div className="flex h-10 items-center gap-2 text-sm text-gray-400 px-3 rounded-md border border-dashed border-gray-300 bg-gray-50">
                                    <ChevronRight className="h-4 w-4" />
                                    Select a pathway first
                                </div>
                            ) : availableModules.length === 0 ? (
                                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                                    <AlertCircle className="h-4 w-4 inline mr-1" />
                                    This pathway has no modules yet. Add modules to the course first.
                                </div>
                            ) : (
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={form.module}
                                    onChange={e => setForm(f => ({ ...f, module: e.target.value }))}
                                >
                                    <option value="">Choose a microcredential…</option>
                                    {availableModules.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* ── Date ──────────────────────────────────── */}
                        <div>
                            <Label>Date <span className="text-red-500">*</span></Label>
                            <Input type="date" value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                        </div>

                        {/* ── Time ─────────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Time</Label>
                                <Input type="time" value={form.start_time}
                                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                            </div>
                            <div>
                                <Label>End Time</Label>
                                <Input type="time" value={form.end_time}
                                    onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                            </div>
                        </div>

                        {/* ── Status (edit only) ────────────────────── */}
                        {editingSession && (
                            <div>
                                <Label>Status</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        )}

                        {/* ── Notes ────────────────────────────────── */}
                        <div>
                            <Label>Notes</Label>
                            <textarea rows={2}
                                placeholder="Any notes for this session…"
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving || pathwaysLoading}
                            style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingSession ? "Save Changes" : "Create Session"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
            <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Delete Session?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600 text-sm">
                        This will permanently delete the session and all its attendance records.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                        <Button
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                            disabled={!!actionLoading}
                            className="bg-red-500 hover:bg-red-600 text-white">
                            {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

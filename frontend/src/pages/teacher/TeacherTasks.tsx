import { useState, useEffect } from "react";
import { teacherApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, CheckCircle2, Circle, Clock, AlertCircle, Trash2, Edit3,
    Flag, Calendar, ChevronDown, X, Loader2, ListTodo, TrendingUp, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Task {
    id: string;
    title: string;
    description: string;
    due_date: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    status: "todo" | "in_progress" | "done";
    created_at: string;
    updated_at: string;
}

const PRIORITY_CONFIG = {
    low: { label: "Low", color: "text-blue-500", bg: "bg-blue-50   border-blue-200", dot: "bg-blue-400" },
    medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-50  border-amber-200", dot: "bg-amber-400" },
    high: { label: "High", color: "text-orange-500", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-400" },
    urgent: { label: "Urgent", color: "text-red-500", bg: "bg-red-50    border-red-200", dot: "bg-red-400" },
};

const STATUS_CONFIG = {
    todo: { label: "To Do", icon: Circle, color: "text-gray-400", bg: "bg-gray-100" },
    in_progress: { label: "In Progress", icon: Clock, color: "text-blue-500", bg: "bg-blue-100" },
    done: { label: "Done", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100" },
};

const emptyForm = {
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as Task["priority"],
    status: "todo" as Task["status"],
};

export default function TeacherTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [summary, setSummary] = useState({ todo: 0, in_progress: 0, done: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [toggling, setToggling] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [tasksRes, summaryRes] = await Promise.all([
                teacherApi.tasks.getAll(),
                teacherApi.tasks.getSummary(),
            ]);
            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            setSummary(summaryRes.data);
        } catch (e) {
            console.error("Failed to fetch tasks:", e);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingTask(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setForm({
            title: task.title,
            description: task.description,
            due_date: task.due_date || "",
            priority: task.priority,
            status: task.status,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return alert("Title is required.");
        setSaving(true);
        try {
            const payload = { ...form, due_date: form.due_date || null };
            if (editingTask) {
                await teacherApi.tasks.update(editingTask.id, payload);
            } else {
                await teacherApi.tasks.create(payload);
            }
            setDialogOpen(false);
            await fetchAll();
        } catch (e: any) {
            console.error("Save failed:", e);
            alert("Failed to save task.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string) => {
        setToggling(id);
        try {
            await teacherApi.tasks.toggle(id);
            await fetchAll();
        } catch (e) {
            console.error("Toggle failed:", e);
        } finally {
            setToggling(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this task?")) return;
        setDeleting(id);
        try {
            await teacherApi.tasks.delete(id);
            await fetchAll();
        } catch (e) {
            console.error("Delete failed:", e);
        } finally {
            setDeleting(null);
        }
    };

    const filtered = tasks.filter(t => {
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        if (filterPriority !== "all" && t.priority !== filterPriority) return false;
        return true;
    });

    const isOverdue = (task: Task) =>
        task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();

    return (
        <div className="min-h-screen p-3 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            My Tasks
                        </h1>
                        <p className="text-gray-500 mt-1">Manage your to-do list and track progress</p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="flex items-center gap-2 shadow-lg"
                        style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                    >
                        <Plus className="h-4 w-4" /> New Task
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: summary.total, color: "var(--fundi-cyan)", icon: ListTodo },
                        { label: "To Do", value: summary.todo, color: "var(--fundi-orange)", icon: Circle },
                        { label: "In Progress", value: summary.in_progress, color: "var(--fundi-purple)", icon: TrendingUp },
                        { label: "Done", value: summary.done, color: "var(--fundi-lime)", icon: Check },
                    ].map((stat, i) => (
                        <motion.div key={stat.label}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
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
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-sm font-medium text-gray-600">Filter:</span>
                    <div className="flex gap-2 flex-wrap">
                        {["all", "todo", "in_progress", "done"].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${filterStatus === s
                                        ? "border-[var(--fundi-cyan)] bg-[var(--fundi-cyan)] text-white"
                                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                                    }`}>
                                {s === "all" ? "All Status" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label || s}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 flex-wrap ml-2">
                        {["all", "low", "medium", "high", "urgent"].map(p => (
                            <button key={p} onClick={() => setFilterPriority(p)}
                                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${filterPriority === p
                                        ? "border-[var(--fundi-purple)] bg-[var(--fundi-purple)] text-white"
                                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                                    }`}>
                                {p === "all" ? "All Priority" : PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG]?.label || p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <ListTodo className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No tasks found</p>
                            <p className="text-gray-400 text-sm mt-1">Create a task to get started</p>
                            <Button onClick={openCreate} className="mt-4" style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}>
                                <Plus className="h-4 w-4 mr-2" /> Create Task
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <AnimatePresence>
                        <div className="space-y-3">
                            {filtered.map((task, idx) => {
                                const pConf = PRIORITY_CONFIG[task.priority];
                                const sConf = STATUS_CONFIG[task.status];
                                const StatusIcon = sConf.icon;
                                const overdue = isOverdue(task);
                                return (
                                    <motion.div key={task.id}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }} transition={{ delay: idx * 0.04 }}
                                    >
                                        <Card className={`border-l-4 hover:shadow-md transition-all ${task.status === "done" ? "opacity-70" : ""}`}
                                            style={{ borderLeftColor: pConf.dot.replace("bg-", "#").replace("400", "") }}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {/* Toggle Button */}
                                                    <button
                                                        onClick={() => handleToggle(task.id)}
                                                        disabled={toggling === task.id}
                                                        className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                                                        title="Change status"
                                                    >
                                                        {toggling === task.id
                                                            ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                                            : <StatusIcon className={`h-5 w-5 ${sConf.color}`} />
                                                        }
                                                    </button>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3 className={`font-semibold text-base leading-tight ${task.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>
                                                                {task.title}
                                                            </h3>
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${pConf.bg} ${pConf.color}`}>
                                                                    {pConf.label}
                                                                </span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sConf.bg} ${sConf.color}`}>
                                                                    {sConf.label}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                                                        )}

                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                            {task.due_date && (
                                                                <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                                                                    {overdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                                                                    {overdue ? "Overdue! " : "Due "}{new Date(task.due_date).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button onClick={() => openEdit(task)}
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                            title="Edit">
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(task.id)}
                                                            disabled={deleting === task.id}
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Delete">
                                                            {deleting === task.id
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <Trash2 className="h-4 w-4" />
                                                            }
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

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ListTodo className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                            {editingTask ? "Edit Task" : "New Task"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Title <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="e.g. Prepare lesson plan for Monday"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <textarea
                                rows={3}
                                placeholder="Any details or notes..."
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={form.due_date}
                                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={form.priority}
                                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task["priority"] }))}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {editingTask && (
                            <div>
                                <Label>Status</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Task["status"] }))}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                        >
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            {editingTask ? "Save Changes" : "Create Task"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

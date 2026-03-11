import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { teacherApi, courseApi } from "@/lib/api";
import {
    Upload,
    Users,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    X,
    Save,
    BookOpen,
    Lightbulb,
    Target,
    Sparkles,
    FileText,
    FileArchive,
    FileSpreadsheet,
    Presentation,
    Wrench,
    Link2,
    Image,
    Film,
    Plus,
    Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
interface Learner {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

interface Session {
    id: string;
    module_name: string;
    date: string;
    learner_count?: number;
    learners?: Learner[];
}

interface PathwaySummary {
    id: string;
    name: string;
}

interface Microcredential {
    id: string;
    name: string;
    badge_name?: string;
}

interface MetricPreset {
    id: string;
    name: string;
    description: string;
    category: string;
}

/* Attached item — file or URL */
interface AttachedItem {
    id: string;                // local uuid
    kind: "file" | "link";
    file?: File;
    url?: string;              // for links
    label?: string;            // user-given name for the link
}

/* ─────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────── */
const METRIC_PRESETS: MetricPreset[] = [
    { id: "problem_solving", name: "Problem Solving",  description: "Found creative solutions",         category: "skills"    },
    { id: "collaboration",   name: "Teamwork",          description: "Worked well with others",          category: "skills"    },
    { id: "persistence",     name: "Persistence",       description: "Didn't give up on challenges",     category: "skills"    },
    { id: "creativity",      name: "Creative Thinking", description: "Original or innovative approach",  category: "skills"    },
    { id: "technical",       name: "Technical Skill",   description: "Demonstrated hands-on ability",   category: "skills"    },
    { id: "communication",   name: "Communication",     description: "Explained ideas clearly",          category: "skills"    },
    { id: "first_success",   name: "First Success",     description: "Achieved something new",           category: "milestone" },
    { id: "breakthrough",    name: "Breakthrough",      description: "Overcame a major challenge",       category: "milestone" },
    { id: "helping_others",  name: "Helping Others",    description: "Supported a peer",                 category: "milestone" },
];

const REFLECTION_PROMPTS = [
    "What did the learner accomplish today?",
    "What new skill did they demonstrate?",
    "What challenge did they overcome?",
    "What should they focus on next?",
    "What surprised you about their work?",
];

/* Accepted MIME types / extensions for the file picker */
const ACCEPTED_FILE_TYPES = [
    "image/*",
    "video/*",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    // Common CAD
    "model/stl",
    "application/sla",
    "application/x-autocad",
    "application/acad",
    "image/vnd.dwg",
    "image/vnd.dxf",
    // Catch-all extensions
    ".stl", ".obj", ".dwg", ".dxf", ".f3d", ".step", ".stp",
    ".rar", ".7z", ".tar", ".gz",
].join(",");

/** Return a user-readable type label + icon for a file */
function fileIcon(file: File) {
    const t = file.type.toLowerCase();
    const n = file.name.toLowerCase();
    if (t.startsWith("image/"))                   return { icon: Image,       label: "Image"        };
    if (t.startsWith("video/"))                   return { icon: Film,        label: "Video"        };
    if (t === "application/pdf")                  return { icon: FileText,    label: "PDF"          };
    if (t.includes("word") || n.endsWith(".docx") || n.endsWith(".doc"))
                                                  return { icon: FileText,    label: "Word"         };
    if (t.includes("sheet") || t.includes("excel") || n.endsWith(".xlsx") || n.endsWith(".xls"))
                                                  return { icon: FileSpreadsheet, label: "Excel"   };
    if (t.includes("presentation") || t.includes("powerpoint") || n.endsWith(".pptx") || n.endsWith(".ppt"))
                                                  return { icon: Presentation, label: "PowerPoint" };
    if (t.includes("zip") || n.endsWith(".zip") || n.endsWith(".rar") || n.endsWith(".7z"))
                                                  return { icon: FileArchive, label: "Archive"      };
    if ([".stl",".obj",".dwg",".dxf",".f3d",".step",".stp"].some(e => n.endsWith(e)))
                                                  return { icon: Wrench,      label: "CAD"          };
    return                                               { icon: FileText,    label: "File"         };
}

function uid() {
    return Math.random().toString(36).slice(2);
}

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
export default function TeacherArtifactCapture() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedLearner = searchParams.get("learner");

    /* Data */
    const [sessions, setSessions]         = useState<Session[]>([]);
    const [allLearners, setAllLearners]   = useState<Learner[]>([]);
    const [sessionLearners, setSessionLearners] = useState<Record<string, Learner[]>>({});
    const [pathways, setPathways]         = useState<PathwaySummary[]>([]);
    const [microcredentials, setMicrocredentials] = useState<Microcredential[]>([]);

    /* Selections */
    const [selectedSession, setSelectedSession]           = useState<Session | null>(null);
    const [selectedLearner, setSelectedLearner]           = useState(preselectedLearner || "");
    const [selectedPathway, setSelectedPathway]           = useState("");
    const [selectedMicrocredential, setSelectedMicrocredential] = useState("");
    const [title, setTitle]             = useState("");
    const [reflection, setReflection]   = useState("");
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

    /* Attachments */
    const [attachments, setAttachments]   = useState<AttachedItem[]>([]);
    const [linkInput, setLinkInput]       = useState("");
    const [linkLabel, setLinkLabel]       = useState("");
    const [showLinkForm, setShowLinkForm] = useState(false);

    /* UI state */
    const [loading, setLoading]       = useState(true);
    const [pathwayLoading, setPathwayLoading] = useState(false);
    const [saving, setSaving]         = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [success, setSuccess]       = useState(false);
    const [showPrompts, setShowPrompts] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState(0);

    /* ── Initial load ──────────────────────────────────── */
    const normalizeLearner = (raw: any): Learner => ({
        id: String(raw?.id ?? ""),
        first_name: raw?.first_name || "",
        last_name:  raw?.last_name  || "",
        full_name:
            raw?.full_name ||
            `${raw?.first_name || ""} ${raw?.last_name || ""}`.trim() ||
            "Unnamed Learner",
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [sessionsRes, learnersRes, pathwaysRes] = await Promise.all([
                    teacherApi.getTodaySessions(),
                    teacherApi.students.getAll(),
                    courseApi.getAll().catch(() => ({ data: [] })),
                ]);

                const sessionsData = Array.isArray(sessionsRes.data)
                    ? sessionsRes.data
                    : sessionsRes.data?.sessions ?? [];
                setSessions(sessionsData);

                const rawLearners = Array.isArray(learnersRes.data)
                    ? learnersRes.data
                    : learnersRes.data?.students ?? [];
                setAllLearners(rawLearners.map(normalizeLearner));

                const rawPathways = Array.isArray(pathwaysRes.data)
                    ? pathwaysRes.data
                    : pathwaysRes.data?.results ?? [];
                setPathways(rawPathways.map((p: any) => ({ id: String(p.id), name: p.name ?? "Pathway" })));
            } catch {
                setSessions([]);
                setAllLearners([]);
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        load();
        loadDraft();
    }, []);

    /* ── Load microcredentials when pathway changes ──── */
    useEffect(() => {
        if (!selectedPathway) {
            setMicrocredentials([]);
            setSelectedMicrocredential("");
            return;
        }
        const fetch = async () => {
            try {
                setPathwayLoading(true);
                const res = await courseApi.getById(selectedPathway);
                const modules = Array.isArray(res.data?.modules) ? res.data.modules : [];
                setMicrocredentials(
                    modules.map((m: any) => ({ id: String(m.id), name: m.name ?? "Module", badge_name: m.badge_name }))
                );
            } catch {
                setMicrocredentials([]);
            } finally {
                setPathwayLoading(false);
            }
        };
        fetch();
        setSelectedMicrocredential("");
    }, [selectedPathway]);

    /* ── Session learners ────────────────────────────── */
    const loadSessionLearners = async (sessionId: string) => {
        if (sessionLearners[sessionId]) return;
        try {
            const res = await teacherApi.getSession(sessionId);
            const list = Array.isArray(res.data?.learners) ? res.data.learners.map(normalizeLearner) : [];
            setSessionLearners(p => ({ ...p, [sessionId]: list }));
        } catch { /* ignore */ }
    };

    /* ── Draft ───────────────────────────────────────── */
    const saveDraft = () => {
        const draft = {
            selectedLearner, title, reflection, selectedMetrics,
            selectedSession: selectedSession?.id,
            selectedPathway, selectedMicrocredential,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem("artifact_draft", JSON.stringify(draft));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
    };

    const loadDraft = () => {
        try {
            const saved = localStorage.getItem("artifact_draft");
            if (!saved) return;
            const d = JSON.parse(saved);
            if (d.selectedLearner) setSelectedLearner(d.selectedLearner);
            if (d.title)           setTitle(d.title);
            if (d.reflection)      setReflection(d.reflection);
            if (d.selectedMetrics) setSelectedMetrics(d.selectedMetrics);
            if (d.selectedPathway) setSelectedPathway(d.selectedPathway);
        } catch { /* ignore */ }
    };

    /* ── File handling ───────────────────────────────── */
    const addFiles = (files: File[]) => {
        const items: AttachedItem[] = files.map(f => ({ id: uid(), kind: "file", file: f }));
        setAttachments(p => [...p, ...items]);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        addFiles(Array.from(e.dataTransfer.files));
    };

    const addLink = () => {
        if (!linkInput.trim()) return;
        const item: AttachedItem = {
            id: uid(),
            kind: "link",
            url: linkInput.trim(),
            label: linkLabel.trim() || linkInput.trim(),
        };
        setAttachments(p => [...p, item]);
        setLinkInput("");
        setLinkLabel("");
        setShowLinkForm(false);
    };

    const removeAttachment = (id: string) => setAttachments(p => p.filter(a => a.id !== id));

    /* ── Metrics ─────────────────────────────────────── */
    const toggleMetric = (id: string) =>
        setSelectedMetrics(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    /* ── Submit ──────────────────────────────────────── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLearner)  { setError("Please select a learner"); return; }
        if (!title.trim())     { setError("Please enter a title");    return; }

        try {
            setSaving(true);
            setError(null);

            const files = attachments.filter(a => a.kind === "file" && a.file).map(a => a.file!);
            const links = attachments.filter(a => a.kind === "link" && a.url).map(a => ({
                url: a.url!,
                label: a.label
            }));

            await teacherApi.captureArtifact({
                learner:     selectedLearner,
                title:       title.trim(),
                reflection:  reflection.trim(),
                metrics:     selectedMetrics,
                session:     selectedSession?.id,
                module:      selectedMicrocredential || undefined,
                files:       files,
                links:       links,
            } as any);

            setSuccess(true);
            localStorage.removeItem("artifact_draft");
            setTimeout(() => {
                setSelectedLearner(""); setTitle(""); setReflection("");
                setAttachments([]); setSelectedMetrics([]);
                setSelectedSession(null); setSelectedPathway("");
                setSelectedMicrocredential(""); setSuccess(false);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to capture artifact");
        } finally {
            setSaving(false);
        }
    };

    const selectedSessionLearners = selectedSession ? sessionLearners[selectedSession.id] : undefined;
    const availableLearners = selectedSessionLearners ?? allLearners;

    /* ── Loading ─────────────────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    /* ───────────────────────────────────────────────────
       Render
    ─────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => navigate("/teacher")} variant="outline" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <div>
                            <h1 className="heading-font text-2xl md:text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                                Capture Artifact
                            </h1>
                            <p className="text-gray-600">Document learner work and progress</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={saveDraft} className="gap-2">
                        <Save className="h-4 w-4" />
                        {draftSaved ? "Saved!" : "Save Draft"}
                    </Button>
                </div>

                {/* Banners */}
                <AnimatePresence>
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-600 font-semibold">Artifact captured successfully!</span>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="text-red-600">{error}</span>
                            </div>
                            <button onClick={() => setError(null)}><X className="h-4 w-4 text-red-600" /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid lg:grid-cols-5 gap-6">

                    {/* ── Left column ───────────────────────────── */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Upload / Attach */}
                        <Card className="overflow-hidden">
                            <CardHeader className="py-4 px-5 border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Upload className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                                    Attach Media &amp; Files
                                </CardTitle>
                                <CardDescription>Upload files or add links to evidence</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">

                                {/* Drop zone */}
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => document.getElementById("file-upload")?.click()}
                                >
                                    <input
                                        type="file"
                                        accept={ACCEPTED_FILE_TYPES}
                                        multiple
                                        onChange={handleFileInput}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                    <p className="text-gray-600 mb-1 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Images · Videos · PDFs · Word · Excel · PowerPoint · ZIP · CAD files
                                    </p>
                                </div>

                                {/* Link form toggle */}
                                <div>
                                    {!showLinkForm ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowLinkForm(true)}
                                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors"
                                        >
                                            <Link2 className="h-4 w-4" />
                                            Add a link (YouTube, Google Drive, etc.)
                                        </button>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                            className="border rounded-xl p-4 space-y-3 bg-orange-50">
                                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <Link2 className="h-4 w-4" style={{ color: "var(--fundi-orange)" }} />
                                                Add Link
                                            </p>
                                            <Input
                                                placeholder="https://…"
                                                value={linkInput}
                                                onChange={e => setLinkInput(e.target.value)}
                                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                                                className="bg-white"
                                            />
                                            <Input
                                                placeholder="Label (optional, e.g. Robot demo video)"
                                                value={linkLabel}
                                                onChange={e => setLinkLabel(e.target.value)}
                                                className="bg-white"
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={addLink}
                                                    style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                                                    className="gap-1">
                                                    <Plus className="h-3.5 w-3.5" /> Add
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => { setShowLinkForm(false); setLinkInput(""); setLinkLabel(""); }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Attachment list */}
                                {attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Attached ({attachments.length})
                                        </p>
                                        {attachments.map(a => {
                                            if (a.kind === "link") {
                                                return (
                                                    <div key={a.id}
                                                        className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm group">
                                                        <Link2 className="h-4 w-4 text-blue-500 shrink-0" />
                                                        <span className="truncate flex-1 text-blue-600">{a.label}</span>
                                                        <button type="button" onClick={() => removeAttachment(a.id)}
                                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            }
                                            const { icon: Icon, label } = fileIcon(a.file!);
                                            const isImage = a.file!.type.startsWith("image/");
                                            return (
                                                <div key={a.id}
                                                    className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm group">
                                                    {isImage ? (
                                                        <img
                                                            src={URL.createObjectURL(a.file!)}
                                                            alt=""
                                                            className="h-8 w-8 rounded object-cover shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                                            <Icon className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="truncate font-medium">{a.file!.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {label} · {(a.file!.size / 1024).toFixed(0)} KB
                                                        </p>
                                                    </div>
                                                    <button type="button" onClick={() => removeAttachment(a.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Tags */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                                    Quick Tags
                                </CardTitle>
                                <CardDescription>What did the learner demonstrate?</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {METRIC_PRESETS.map(metric => (
                                        <button
                                            key={metric.id}
                                            type="button"
                                            onClick={() => toggleMetric(metric.id)}
                                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                                selectedMetrics.includes(metric.id)
                                                    ? "bg-cyan-500 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            {metric.name}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right column ──────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Pathway → Microcredential */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                                    Link to Pathway
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Pathway picker */}
                                <div>
                                    <Label className="mb-2 block">Pathway</Label>
                                    <select
                                        value={selectedPathway}
                                        onChange={e => setSelectedPathway(e.target.value)}
                                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                    >
                                        <option value="">— No pathway —</option>
                                        {pathways.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Microcredential picker */}
                                <AnimatePresence>
                                    {selectedPathway && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}>
                                            <Label className="mb-2 block">Microcredential</Label>
                                            {pathwayLoading ? (
                                                <p className="text-sm text-gray-400">Loading microcredentials…</p>
                                            ) : microcredentials.length === 0 ? (
                                                <p className="text-sm text-gray-400">No microcredentials found for this pathway.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                                    {microcredentials.map(m => (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => setSelectedMicrocredential(
                                                                selectedMicrocredential === m.id ? "" : m.id
                                                            )}
                                                            className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                                                                selectedMicrocredential === m.id
                                                                    ? "border-purple-500 bg-purple-50"
                                                                    : "border-gray-200 hover:border-gray-300"
                                                            }`}
                                                        >
                                                            <p className="font-medium">{m.name}</p>
                                                            {m.badge_name && (
                                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                                    <Sparkles className="h-3 w-3" /> {m.badge_name}
                                                                </p>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>

                        {/* Session & Learner */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                                    Link to Session
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Session */}
                                <div>
                                    <Label className="mb-2 block">Today's Sessions</Label>
                                    {sessions.length === 0 ? (
                                        <p className="text-sm text-gray-400">No sessions today.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {sessions.map(session => (
                                                <button
                                                    key={session.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSession(selectedSession?.id === session.id ? null : session);
                                                        loadSessionLearners(session.id);
                                                    }}
                                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                        selectedSession?.id === session.id
                                                            ? "border-purple-500 bg-purple-50"
                                                            : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                >
                                                    <p className="font-medium text-sm truncate">{session.module_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {session.learner_count ?? session.learners?.length ?? 0} learners
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Learner */}
                                <div>
                                    <Label className="mb-2 block">Select Learner *</Label>
                                    <select
                                        value={selectedLearner}
                                        onChange={(e) => setSelectedLearner(e.target.value)}
                                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                        required
                                    >
                                        <option value="">Choose a learner...</option>
                                        {availableLearners.map(learner => (
                                            <option key={learner.id} value={learner.id}>{learner.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Title and Reflection */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                                    Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="mb-2 block">Title *</Label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Robot Arm Assembly"
                                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Reflection / Observation</Label>
                                        <Button type="button" variant="ghost" size="sm"
                                            onClick={() => setShowPrompts(!showPrompts)} className="text-xs gap-1">
                                            <Lightbulb className="h-3 w-3" /> Prompts
                                        </Button>
                                    </div>

                                    <AnimatePresence>
                                        {showPrompts && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }} className="mb-3">
                                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <div className="flex items-center justify-between">
                                                        <Sparkles className="h-4 w-4 text-yellow-600" />
                                                        <div className="flex gap-1">
                                                            {REFLECTION_PROMPTS.map((_, i) => (
                                                                <button key={i} onClick={() => setCurrentPrompt(i)}
                                                                    className={`w-2 h-2 rounded-full ${i === currentPrompt ? "bg-yellow-600" : "bg-yellow-300"}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-yellow-800 mt-2 italic cursor-pointer"
                                                        onClick={() => setReflection(r => r ? r + " " + REFLECTION_PROMPTS[currentPrompt] : REFLECTION_PROMPTS[currentPrompt])}>
                                                        "{REFLECTION_PROMPTS[currentPrompt]}"
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <textarea
                                        value={reflection}
                                        onChange={(e) => setReflection(e.target.value)}
                                        placeholder="What did the learner accomplish? What skills did they demonstrate?"
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <Button
                            onClick={handleSubmit}
                            disabled={saving || !selectedLearner || !title.trim()}
                            style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                            className="w-full h-14 text-lg gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-5 w-5" />
                                    Capture Artifact
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

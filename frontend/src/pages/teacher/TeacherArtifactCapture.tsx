import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { teacherApi, courseApi } from "@/lib/api";
import { ArrowLeft, Save, CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArtifactAttachPanel } from "./ArtifactAttachPanel";
import { ArtifactContextPanel } from "./ArtifactContextPanel";
import { ArtifactDetailsCard } from "./ArtifactDetailsCard";
import {
    uid,
    REFLECTION_PROMPTS,
    type Learner,
    type Session,
    type PathwaySummary,
    type Microcredential,
    type AttachedItem,
    type RawLearner,
    type RawPathwaySummary,
    type RawModule,
    type ArtifactCapturePayload,
} from "./artifact-capture-types";

/* ─── helper ──────────────────────────────────────────── */
function normalizeLearner(raw: RawLearner): Learner {
    return {
        id: String(raw?.id ?? ""),
        first_name: raw?.first_name || "",
        last_name:  raw?.last_name  || "",
        full_name:
            raw?.full_name ||
            `${raw?.first_name || ""} ${raw?.last_name || ""}`.trim() ||
            "Unnamed Learner",
    };
}

/* ─── component ───────────────────────────────────────── */
export default function TeacherArtifactCapture() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedLearner = searchParams.get("learner");

    /* remote data */
    const [sessions,         setSessions]         = useState<Session[]>([]);
    const [allLearners,      setAllLearners]      = useState<Learner[]>([]);
    const [sessionLearners,  setSessionLearners]  = useState<Record<string, Learner[]>>({});
    const [pathways,         setPathways]         = useState<PathwaySummary[]>([]);
    const [microcredentials, setMicrocredentials] = useState<Microcredential[]>([]);

    /* selections */
    const [selectedSession,          setSelectedSession]          = useState<Session | null>(null);
    const [selectedLearner,          setSelectedLearner]          = useState(preselectedLearner || "");
    const [selectedPathway,          setSelectedPathway]          = useState("");
    const [selectedMicrocredential,  setSelectedMicrocredential]  = useState("");
    const [title,           setTitle]           = useState("");
    const [reflection,      setReflection]      = useState("");
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

    /* attachments */
    const [attachments,  setAttachments]  = useState<AttachedItem[]>([]);
    const [linkInput,    setLinkInput]    = useState("");
    const [linkLabel,    setLinkLabel]    = useState("");
    const [showLinkForm, setShowLinkForm] = useState(false);

    /* ui */
    const [loading,        setLoading]        = useState(true);
    const [pathwayLoading, setPathwayLoading] = useState(false);
    const [saving,         setSaving]         = useState(false);
    const [draftSaved,     setDraftSaved]     = useState(false);
    const [error,          setError]          = useState<string | null>(null);
    const [success,        setSuccess]        = useState(false);
    const [showPrompts,    setShowPrompts]    = useState(false);
    const [currentPrompt,  setCurrentPrompt]  = useState(0);

    /* ── initial load ── */
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
                setPathways(
                    rawPathways.map((p: RawPathwaySummary) => ({
                        id: String(p.id),
                        name: p.name ?? "Pathway",
                    }))
                );
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

    /* ── microcredentials when pathway changes ── */
    useEffect(() => {
        if (!selectedPathway) {
            setMicrocredentials([]);
            setSelectedMicrocredential("");
            return;
        }
        const fetchModules = async () => {
            try {
                setPathwayLoading(true);
                const res = await courseApi.getById(selectedPathway);
                const modules = Array.isArray(res.data?.modules) ? res.data.modules : [];
                setMicrocredentials(
                    modules.map((m: RawModule) => ({
                        id: String(m.id),
                        name: m.name ?? "Module",
                        badge_name: m.badge_name,
                    }))
                );
            } catch {
                setMicrocredentials([]);
            } finally {
                setPathwayLoading(false);
            }
        };
        fetchModules();
        setSelectedMicrocredential("");
    }, [selectedPathway]);

    /* ── session learners ── */
    const loadSessionLearners = async (sessionId: string) => {
        if (sessionLearners[sessionId]) return;
        try {
            const res = await teacherApi.getSession(sessionId);
            const list = Array.isArray(res.data?.learners)
                ? res.data.learners.map(normalizeLearner)
                : [];
            setSessionLearners((prev) => ({ ...prev, [sessionId]: list }));
        } catch { /* ignore */ }
    };

    /* ── draft ── */
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

    /* ── file / link handlers ── */
    const addFiles = (files: File[]) => {
        const items: AttachedItem[] = files.map((f) => ({ id: uid(), kind: "file", file: f }));
        setAttachments((prev) => [...prev, ...items]);
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
        setAttachments((prev) => [...prev, item]);
        setLinkInput("");
        setLinkLabel("");
        setShowLinkForm(false);
    };

    const removeAttachment = (id: string) =>
        setAttachments((prev) => prev.filter((a) => a.id !== id));

    /* ── metrics ── */
    const toggleMetric = (id: string) =>
        setSelectedMetrics((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    /* ── session toggle ── */
    const handleSessionToggle = (session: Session) => {
        const isSelected = selectedSession?.id === session.id;
        setSelectedSession(isSelected ? null : session);
        if (!isSelected) loadSessionLearners(session.id);
    };

    /* ── prompt append ── */
    const handleAppendPrompt = () =>
        setReflection((r) =>
            r ? `${r} ${REFLECTION_PROMPTS[currentPrompt]}` : REFLECTION_PROMPTS[currentPrompt]
        );

    /* ── submit ── */
    const handleSubmit = async () => {
        if (!selectedLearner) { setError("Please select a learner"); return; }
        if (!title.trim())    { setError("Please enter a title");    return; }

        try {
            setSaving(true);
            setError(null);

            const files = attachments
                .filter((a) => a.kind === "file" && a.file)
                .map((a) => a.file!);
            const links = attachments
                .filter((a) => a.kind === "link" && a.url)
                .map((a) => ({ url: a.url!, label: a.label }));

            const payload: ArtifactCapturePayload = {
                learner: selectedLearner,
                title: title.trim(),
                reflection: reflection.trim(),
                metrics: selectedMetrics,
                session: selectedSession?.id,
                module: selectedMicrocredential || undefined,
                files,
                links,
            };

            await teacherApi.captureArtifact(payload);
            setSuccess(true);
            localStorage.removeItem("artifact_draft");

            setTimeout(() => {
                setSelectedLearner("");
                setTitle("");
                setReflection("");
                setAttachments([]);
                setSelectedMetrics([]);
                setSelectedSession(null);
                setSelectedPathway("");
                setSelectedMicrocredential("");
                setSuccess(false);
            }, 2000);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })
                ?.response?.data?.detail;
            setError(detail || "Failed to capture artifact");
        } finally {
            setSaving(false);
        }
    };

    const availableLearners = selectedSession
        ? (sessionLearners[selectedSession.id] ?? allLearners)
        : allLearners;

    /* ── loading screen ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-fundi-orange border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    /* ── render ── */
    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => navigate("/teacher")}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <div>
                            <h1 className="heading-font text-2xl md:text-3xl font-bold text-fundi-black">
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
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-600 font-semibold">Artifact captured successfully!</span>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="text-red-600">{error}</span>
                            </div>
                            <button type="button" onClick={() => setError(null)}>
                                <X className="h-4 w-4 text-red-600" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid lg:grid-cols-5 gap-6">

                    {/* Left column — attachments + quick tags */}
                    <div className="lg:col-span-3 space-y-6">
                        <ArtifactAttachPanel
                            attachments={attachments}
                            selectedMetrics={selectedMetrics}
                            showLinkForm={showLinkForm}
                            linkInput={linkInput}
                            linkLabel={linkLabel}
                            onDrop={handleDrop}
                            onFileInput={handleFileInput}
                            onShowLinkForm={setShowLinkForm}
                            onLinkInputChange={setLinkInput}
                            onLinkLabelChange={setLinkLabel}
                            onAddLink={addLink}
                            onRemoveAttachment={removeAttachment}
                            onToggleMetric={toggleMetric}
                        />
                    </div>

                    {/* Right column — context + details + submit */}
                    <div className="lg:col-span-2 space-y-6">
                        <ArtifactContextPanel
                            pathways={pathways}
                            selectedPathway={selectedPathway}
                            onPathwayChange={setSelectedPathway}
                            microcredentials={microcredentials}
                            pathwayLoading={pathwayLoading}
                            selectedMicrocredential={selectedMicrocredential}
                            onMicrocredentialChange={setSelectedMicrocredential}
                            sessions={sessions}
                            selectedSession={selectedSession}
                            onSessionToggle={handleSessionToggle}
                            availableLearners={availableLearners}
                            selectedLearner={selectedLearner}
                            onLearnerChange={setSelectedLearner}
                        />
                        <ArtifactDetailsCard
                            title={title}
                            onTitleChange={setTitle}
                            reflection={reflection}
                            onReflectionChange={setReflection}
                            showPrompts={showPrompts}
                            onShowPrompts={setShowPrompts}
                            currentPrompt={currentPrompt}
                            onPromptChange={setCurrentPrompt}
                            onAppendPrompt={handleAppendPrompt}
                            saving={saving}
                            canSubmit={!!selectedLearner && !!title.trim()}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

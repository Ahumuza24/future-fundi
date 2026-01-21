import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { teacherApi } from "@/lib/api";
import {
    Camera,
    Upload,
    Users,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Video,
    X,
    Save,
    BookOpen,
    Lightbulb,
    Target,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    learners: Learner[];
}

interface MetricPreset {
    id: string;
    name: string;
    description: string;
    category: string;
}

const METRIC_PRESETS: MetricPreset[] = [
    { id: "problem_solving", name: "Problem Solving", description: "Found creative solutions", category: "skills" },
    { id: "collaboration", name: "Teamwork", description: "Worked well with others", category: "skills" },
    { id: "persistence", name: "Persistence", description: "Didn't give up despite challenges", category: "skills" },
    { id: "creativity", name: "Creative Thinking", description: "Original or innovative approach", category: "skills" },
    { id: "technical", name: "Technical Skill", description: "Demonstrated hands-on ability", category: "skills" },
    { id: "communication", name: "Communication", description: "Explained ideas clearly", category: "skills" },
    { id: "first_success", name: "First Success", description: "Achieved something new", category: "milestone" },
    { id: "breakthrough", name: "Breakthrough", description: "Overcame a major challenge", category: "milestone" },
    { id: "helping_others", name: "Helping Others", description: "Supported a peer", category: "milestone" },
];

const REFLECTION_PROMPTS = [
    "What did the learner accomplish today?",
    "What new skill did they demonstrate?",
    "What challenge did they overcome?",
    "What should they focus on next?",
    "What surprised you about their work?",
];

export default function TeacherArtifactCapture() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedLearner = searchParams.get("learner");

    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [selectedLearner, setSelectedLearner] = useState<string>(preselectedLearner || "");
    const [title, setTitle] = useState("");
    const [reflection, setReflection] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [captureMode, setCaptureMode] = useState<"camera" | "upload">("camera");
    const [showPrompts, setShowPrompts] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [streaming, setStreaming] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    // Demo learners for when no session is selected
    const [allLearners] = useState<Learner[]>([
        { id: "1", first_name: "Alex", last_name: "Kato", full_name: "Alex Kato" },
        { id: "2", first_name: "Bella", last_name: "Nakato", full_name: "Bella Nakato" },
        { id: "3", first_name: "Charles", last_name: "Mugisha", full_name: "Charles Mugisha" },
        { id: "4", first_name: "Diana", last_name: "Asiimwe", full_name: "Diana Asiimwe" },
        { id: "5", first_name: "Emmanuel", last_name: "Okello", full_name: "Emmanuel Okello" },
        { id: "6", first_name: "Faith", last_name: "Nambi", full_name: "Faith Nambi" },
    ]);

    useEffect(() => {
        fetchTodaySessions();
    }, []);

    const fetchTodaySessions = async () => {
        try {
            setLoading(true);
            const response = await teacherApi.getTodaySessions();
            setSessions(response.data.sessions || []);
        } catch (err: any) {
            console.error(err);
            // Use demo data
            setSessions([
                { id: "1", module_name: "Robotics Foundations", date: "Today", learners: allLearners.slice(0, 4) },
                { id: "2", module_name: "Coding Basics", date: "Today", learners: allLearners.slice(2, 6) },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStreaming(true);
                setCameraReady(true);
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setCaptureMode("upload");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setStreaming(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
                        setPhotos(prev => [...prev, file]);
                    }
                }, "image/jpeg", 0.9);
            }
        }
    };

    useEffect(() => {
        if (captureMode === "camera" && !streaming) {
            startCamera();
        }
        return () => {
            if (streaming) {
                stopCamera();
            }
        };
    }, [captureMode]);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newPhotos = Array.from(e.target.files);
            setPhotos((prev) => [...prev, ...newPhotos]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        setPhotos(prev => [...prev, ...files]);
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleMetric = (metricId: string) => {
        setSelectedMetrics(prev =>
            prev.includes(metricId)
                ? prev.filter(id => id !== metricId)
                : [...prev, metricId]
        );
    };

    const saveDraft = () => {
        const draft = {
            selectedLearner,
            title,
            reflection,
            selectedMetrics,
            selectedSession: selectedSession?.id,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem("artifact_draft", JSON.stringify(draft));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
    };

    const loadDraft = () => {
        const saved = localStorage.getItem("artifact_draft");
        if (saved) {
            const draft = JSON.parse(saved);
            setSelectedLearner(draft.selectedLearner || "");
            setTitle(draft.title || "");
            setReflection(draft.reflection || "");
            setSelectedMetrics(draft.selectedMetrics || []);
        }
    };

    useEffect(() => {
        loadDraft();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLearner) {
            setError("Please select a learner");
            return;
        }

        if (!title.trim()) {
            setError("Please enter a title");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const artifactData = {
                learner: selectedLearner,
                title: title.trim(),
                reflection: reflection.trim(),
                metrics: selectedMetrics,
                session: selectedSession?.id,
                media_refs: photos.map((photo, index) => ({
                    type: "photo",
                    filename: photo.name,
                    size: photo.size,
                    url: `placeholder_${index}.jpg`,
                })),
            };

            await teacherApi.captureArtifact(artifactData);
            setSuccess(true);
            localStorage.removeItem("artifact_draft");

            setTimeout(() => {
                setSelectedLearner("");
                setTitle("");
                setReflection("");
                setPhotos([]);
                setSelectedMetrics([]);
                setSuccess(false);
                setSelectedSession(null);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to capture artifact");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const availableLearners = selectedSession ? selectedSession.learners : allLearners;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

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
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="heading-font text-2xl md:text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                                Capture Artifact
                            </h1>
                            <p className="text-gray-600">Document learner work and progress</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={saveDraft}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {draftSaved ? "Saved!" : "Save Draft"}
                    </Button>
                </div>

                {/* Messages */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-600 font-semibold">Artifact captured successfully!</span>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="text-red-600">{error}</span>
                            </div>
                            <button onClick={() => setError(null)}>
                                <X className="h-4 w-4 text-red-600" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Left Column - Camera/Upload (Main Focus) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Camera First Interface */}
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Capture Media
                                </CardTitle>
                                <CardDescription className="text-white/90">
                                    Take photos or upload files
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {/* Mode Toggle */}
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        variant={captureMode === "camera" ? "default" : "outline"}
                                        onClick={() => setCaptureMode("camera")}
                                        className={`flex-1 gap-2 ${captureMode === "camera" ? "bg-orange-500 text-white" : ""}`}
                                    >
                                        <Camera className="h-4 w-4" />
                                        Camera
                                    </Button>
                                    <Button
                                        variant={captureMode === "upload" ? "default" : "outline"}
                                        onClick={() => { stopCamera(); setCaptureMode("upload"); }}
                                        className={`flex-1 gap-2 ${captureMode === "upload" ? "bg-orange-500 text-white" : ""}`}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Upload
                                    </Button>
                                </div>

                                {/* Camera View */}
                                {captureMode === "camera" && (
                                    <div className="relative">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full aspect-video bg-black rounded-lg"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />
                                        {cameraReady && (
                                            <Button
                                                onClick={capturePhoto}
                                                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full w-16 h-16 bg-white border-4 border-orange-500 hover:bg-orange-50"
                                            >
                                                <Camera className="h-8 w-8 text-orange-500" />
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Upload View */}
                                {captureMode === "upload" && (
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            onChange={handlePhotoSelect}
                                            className="hidden"
                                            id="photo-upload"
                                        />
                                        <label htmlFor="photo-upload" className="cursor-pointer">
                                            <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                            <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                                            <p className="text-sm text-gray-500">Photos and videos supported</p>
                                        </label>
                                    </div>
                                )}

                                {/* Photo Preview */}
                                {photos.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="relative group">
                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                                    <img
                                                        src={URL.createObjectURL(photo)}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Metric Presets (Quick Tags) */}
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
                                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${selectedMetrics.includes(metric.id)
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

                    {/* Right Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Session & Learner Selection */}
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
                                    <div className="grid grid-cols-2 gap-2">
                                        {sessions.map(session => (
                                            <button
                                                key={session.id}
                                                type="button"
                                                onClick={() => setSelectedSession(session)}
                                                className={`p-3 rounded-lg border-2 text-left transition-all ${selectedSession?.id === session.id
                                                        ? "border-purple-500 bg-purple-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <p className="font-medium text-sm">{session.module_name}</p>
                                                <p className="text-xs text-gray-500">{session.learners.length} learners</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Learner */}
                                <div>
                                    <Label className="mb-2 block">Select Learner *</Label>
                                    <select
                                        value={selectedLearner}
                                        onChange={(e) => setSelectedLearner(e.target.value)}
                                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    >
                                        <option value="">Choose a learner...</option>
                                        {availableLearners.map((learner) => (
                                            <option key={learner.id} value={learner.id}>
                                                {learner.full_name}
                                            </option>
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
                                        placeholder="e.g., Robot Arm Assembly"
                                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Reflection / Observation</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPrompts(!showPrompts)}
                                            className="text-xs gap-1"
                                        >
                                            <Lightbulb className="h-3 w-3" />
                                            Prompts
                                        </Button>
                                    </div>

                                    {/* Reflection Prompts */}
                                    <AnimatePresence>
                                        {showPrompts && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-3"
                                            >
                                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <div className="flex items-center justify-between">
                                                        <Sparkles className="h-4 w-4 text-yellow-600" />
                                                        <div className="flex gap-1">
                                                            {REFLECTION_PROMPTS.map((_, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setCurrentPrompt(i)}
                                                                    className={`w-2 h-2 rounded-full ${i === currentPrompt ? "bg-yellow-600" : "bg-yellow-300"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-yellow-800 mt-2 italic">
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

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={saving || !selectedLearner || !title.trim()}
                            style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                            className="w-full h-14 text-lg gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <Camera className="h-5 w-5" />
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { teacherApi } from "@/lib/api";
import {
    Camera,
    Upload,
    Users,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Image as ImageIcon,
    X,
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

export default function TeacherArtifactCapture() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [selectedLearner, setSelectedLearner] = useState<string>("");
    const [title, setTitle] = useState("");
    const [reflection, setReflection] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchTodaySessions();
    }, []);

    const fetchTodaySessions = async () => {
        try {
            setLoading(true);
            const response = await teacherApi.getTodaySessions();
            setSessions(response.data.sessions || []);
        } catch (err: any) {
            setError("Failed to load sessions");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newPhotos = Array.from(e.target.files);
            setPhotos((prev) => [...prev, ...newPhotos]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

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

            // For now, we'll just save the artifact without photos
            // In production, you'd upload photos to S3 or similar first
            const artifactData = {
                learner: selectedLearner,
                title: title.trim(),
                reflection: reflection.trim(),
                media_refs: photos.map((photo, index) => ({
                    type: "photo",
                    filename: photo.name,
                    size: photo.size,
                    // In production, this would be the S3 URL after upload
                    url: `placeholder_${index}.jpg`,
                })),
            };

            await teacherApi.captureArtifact(artifactData);
            setSuccess(true);

            // Reset form
            setTimeout(() => {
                setSelectedLearner("");
                setTitle("");
                setReflection("");
                setPhotos([]);
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
        <div className="min-h-screen p-3 md:p-4 lg:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
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
                            className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-600">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Session Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Select Session (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-3">
                                {sessions.length === 0 ? (
                                    <p className="text-gray-600 col-span-2">No sessions today. You can still capture artifacts!</p>
                                ) : (
                                    sessions.map((session) => (
                                        <Card
                                            key={session.id}
                                            className={`cursor-pointer border-2 transition-all ${selectedSession?.id === session.id
                                                    ? "border-[var(--fundi-orange)] bg-orange-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            onClick={() => setSelectedSession(session)}
                                        >
                                            <CardContent className="p-4">
                                                <h3 className="font-bold">{session.module_name}</h3>
                                                <p className="text-sm text-gray-600">{session.learners.length} learners</p>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Learner Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Select Learner *</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <select
                                value={selectedLearner}
                                onChange={(e) => setSelectedLearner(e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                required
                            >
                                <option value="">Choose a learner...</option>
                                {selectedSession ? (
                                    selectedSession.learners.map((learner) => (
                                        <option key={learner.id} value={learner.id}>
                                            {learner.full_name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>
                                        Select a session first or type learner name
                                    </option>
                                )}
                            </select>
                        </CardContent>
                    </Card>

                    {/* Photo Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                3. Add Photos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[var(--fundi-orange)] transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label htmlFor="photo-upload" className="cursor-pointer">
                                    <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-gray-600 mb-1">Click to upload photos</p>
                                    <p className="text-sm text-gray-500">or drag and drop</p>
                                </label>
                            </div>

                            {/* Photo Preview */}
                            {photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-3">
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
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Title and Reflection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>4. Add Details *</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Robot Arm Assembly"
                                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Reflection / Observation</label>
                                <textarea
                                    value={reflection}
                                    onChange={(e) => setReflection(e.target.value)}
                                    placeholder="What did the learner accomplish? What skills did they demonstrate?"
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Describe what the learner did, what they learned, and any notable observations
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => navigate("/teacher")}
                            variant="outline"
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || !selectedLearner || !title.trim()}
                            style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                            className="flex items-center gap-2 min-w-[180px]"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <Camera className="h-4 w-4" />
                                    Capture Artifact
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

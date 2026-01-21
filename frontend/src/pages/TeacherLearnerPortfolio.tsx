import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    User, ArrowLeft, Grid, List, Calendar, Star,
    TrendingUp, FileText, MessageSquare, Flag, Camera,
    ChevronRight, Award, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Artifact {
    id: string;
    title: string;
    type: string;
    date: string;
    thumbnail_color: string;
    module: string;
    reflection?: string;
}

interface Assessment {
    id: string;
    date: string;
    module: string;
    score: number;
    skills: { name: string; score: number }[];
}

interface TeacherNote {
    id: string;
    date: string;
    content: string;
    type: "observation" | "praise" | "concern";
}

interface LearnerProfile {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    age: number;
    current_level: string;
    current_course: string;
    attendance_rate: number;
    artifacts_count: number;
    achievements: { name: string; icon: string; earned_at: string }[];
    skill_progress: { name: string; current: number; previous: number }[];
}

export default function TeacherLearnerPortfolio() {
    const { learnerId } = useParams<{ learnerId: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
    const [activeTab, setActiveTab] = useState<"artifacts" | "assessments" | "notes">("artifacts");
    const [learner, setLearner] = useState<LearnerProfile | null>(null);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [notes, setNotes] = useState<TeacherNote[]>([]);
    const [newNote, setNewNote] = useState("");

    useEffect(() => {
        // Load demo data
        setLearner({
            id: learnerId || "1",
            first_name: "Alex",
            last_name: "Kato",
            full_name: "Alex Kato",
            age: 10,
            current_level: "Level 2: Explorer",
            current_course: "Robotics Foundations",
            attendance_rate: 95,
            artifacts_count: 12,
            achievements: [
                { name: "First Steps", icon: "⭐", earned_at: "Oct 5" },
                { name: "Problem Solver", icon: "🧩", earned_at: "Oct 12" },
                { name: "Team Player", icon: "👥", earned_at: "Oct 18" },
            ],
            skill_progress: [
                { name: "Problem Solving", current: 4, previous: 3 },
                { name: "Creativity", current: 5, previous: 4 },
                { name: "Technical Skills", current: 4, previous: 3 },
                { name: "Collaboration", current: 3, previous: 3 },
            ],
        });

        setArtifacts([
            { id: "1", title: "Robot Arm Project", type: "photo", date: "Oct 18", thumbnail_color: "var(--fundi-orange)", module: "Robotics", reflection: "I learned how to connect servo motors!" },
            { id: "2", title: "Coding Challenge", type: "code", date: "Oct 15", thumbnail_color: "var(--fundi-cyan)", module: "Coding", reflection: "Loops are fun once you understand them." },
            { id: "3", title: "Team Bridge Build", type: "photo", date: "Oct 12", thumbnail_color: "var(--fundi-purple)", module: "Engineering", reflection: "Working together made it stronger!" },
            { id: "4", title: "Circuit Design", type: "photo", date: "Oct 10", thumbnail_color: "var(--fundi-lime)", module: "Electronics", reflection: "LEDs need resistors or they burn out." },
            { id: "5", title: "3D Printed Gear", type: "photo", date: "Oct 8", thumbnail_color: "var(--fundi-pink)", module: "3D Printing", reflection: "My first 3D print took 2 hours!" },
            { id: "6", title: "Sensor Testing", type: "video", date: "Oct 5", thumbnail_color: "var(--fundi-orange)", module: "Robotics", reflection: "Ultrasonic sensors can detect objects far away." },
        ]);

        setAssessments([
            { id: "1", date: "Oct 18", module: "Robotics", score: 85, skills: [{ name: "Technical", score: 4 }, { name: "Problem Solving", score: 5 }] },
            { id: "2", date: "Oct 11", module: "Coding", score: 78, skills: [{ name: "Logic", score: 4 }, { name: "Debugging", score: 3 }] },
            { id: "3", date: "Oct 4", module: "Engineering", score: 90, skills: [{ name: "Design", score: 5 }, { name: "Teamwork", score: 4 }] },
        ]);

        setNotes([
            { id: "1", date: "Oct 18", content: "Alex showed excellent leadership during the group project today.", type: "praise" },
            { id: "2", date: "Oct 15", content: "Still struggling with debugging code. Consider pair programming next session.", type: "observation" },
            { id: "3", date: "Oct 10", content: "Has been less engaged this week. Check in about home situation.", type: "concern" },
        ]);
    }, [learnerId]);

    const addNote = () => {
        if (!newNote.trim()) return;
        setNotes(prev => [{
            id: Date.now().toString(),
            date: "Today",
            content: newNote,
            type: "observation"
        }, ...prev]);
        setNewNote("");
    };

    if (!learner) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Back Button */}
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Classes
                </Button>

                {/* Learner Header */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-6 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                                    {learner.first_name[0]}{learner.last_name[0]}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-1">{learner.full_name}</h1>
                                    <p className="opacity-90">{learner.age} years old • {learner.current_course}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                            {learner.current_level}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Star className="h-4 w-4" />
                                            {learner.attendance_rate}% attendance
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className="bg-white/20 hover:bg-white/30 text-white gap-2"
                                    onClick={() => navigate(`/teacher/capture-artifact?learner=${learner.id}`)}
                                >
                                    <Camera className="h-4 w-4" />
                                    Capture Artifact
                                </Button>
                                <Button className="bg-white/20 hover:bg-white/30 text-white gap-2">
                                    <Flag className="h-4 w-4" />
                                    Flag for Follow-up
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <CardContent className="p-0">
                        <div className="grid grid-cols-4 divide-x">
                            <div className="p-4 text-center">
                                <p className="text-2xl font-bold" style={{ color: "var(--fundi-orange)" }}>{learner.artifacts_count}</p>
                                <p className="text-sm text-gray-600">Artifacts</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-2xl font-bold" style={{ color: "var(--fundi-cyan)" }}>{assessments.length}</p>
                                <p className="text-sm text-gray-600">Assessments</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-2xl font-bold" style={{ color: "var(--fundi-purple)" }}>{learner.achievements.length}</p>
                                <p className="text-sm text-gray-600">Achievements</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-2xl font-bold" style={{ color: "var(--fundi-lime)" }}>{notes.length}</p>
                                <p className="text-sm text-gray-600">Notes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Skill Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                            Skill Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-4">
                            {learner.skill_progress.map(skill => (
                                <div key={skill.name} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{skill.name}</span>
                                        <span className="flex items-center gap-1 text-sm">
                                            {skill.current > skill.previous && <TrendingUp className="h-4 w-4 text-green-500" />}
                                            {skill.current === skill.previous && <span className="text-gray-400">—</span>}
                                            <span className="font-bold">{skill.current}/5</span>
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className={`h-2 flex-1 rounded ${i <= skill.current ? "bg-cyan-500" : "bg-gray-200"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="flex gap-2 border-b">
                    {[
                        { id: "artifacts", label: "Artifacts", icon: Camera },
                        { id: "assessments", label: "Assessments", icon: FileText },
                        { id: "notes", label: "Teacher Notes", icon: MessageSquare },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? "border-cyan-500 text-cyan-600 font-medium"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}

                    {activeTab === "artifacts" && (
                        <div className="ml-auto flex items-center gap-2 px-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className={viewMode === "grid" ? "bg-gray-100" : ""}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("timeline")}
                                className={viewMode === "timeline" ? "bg-gray-100" : ""}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Artifacts Tab */}
                {activeTab === "artifacts" && (
                    <div className={viewMode === "grid" ? "grid md:grid-cols-3 gap-4" : "space-y-4"}>
                        {artifacts.map((artifact, index) => (
                            <motion.div
                                key={artifact.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                {viewMode === "grid" ? (
                                    <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                                        <div
                                            className="h-32 relative"
                                            style={{ backgroundColor: artifact.thumbnail_color }}
                                        >
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                            <div className="absolute bottom-2 left-2">
                                                <span className="px-2 py-1 bg-black/30 text-white text-xs rounded">
                                                    {artifact.type}
                                                </span>
                                            </div>
                                        </div>
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-base">{artifact.title}</CardTitle>
                                            <CardDescription className="flex items-center justify-between">
                                                <span>{artifact.module}</span>
                                                <span>{artifact.date}</span>
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ) : (
                                    <Card className="hover:shadow-md transition-all">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div
                                                className="w-16 h-16 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: artifact.thumbnail_color }}
                                            >
                                                <Camera className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold">{artifact.title}</h4>
                                                <p className="text-sm text-gray-600">{artifact.module} • {artifact.date}</p>
                                                {artifact.reflection && (
                                                    <p className="text-sm text-gray-500 mt-1 italic">"{artifact.reflection}"</p>
                                                )}
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </CardContent>
                                    </Card>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Assessments Tab */}
                {activeTab === "assessments" && (
                    <div className="space-y-4">
                        {assessments.map((assessment, index) => (
                            <motion.div
                                key={assessment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="font-bold">{assessment.module}</h4>
                                                <p className="text-sm text-gray-500">{assessment.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-cyan)" }}>
                                                    {assessment.score}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            {assessment.skills.map(skill => (
                                                <div key={skill.name} className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">{skill.name}:</span>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div
                                                                key={i}
                                                                className={`w-3 h-3 rounded-full ${i <= skill.score ? "bg-cyan-500" : "bg-gray-200"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Notes Tab */}
                {activeTab === "notes" && (
                    <div className="space-y-4">
                        {/* Add Note */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a note about this learner..."
                                        className="flex-1 p-3 border rounded-lg resize-none h-20"
                                    />
                                    <Button
                                        onClick={addNote}
                                        style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                                        className="self-end"
                                    >
                                        Add Note
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes List */}
                        {notes.map((note, index) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={`border-l-4 ${note.type === "praise" ? "border-l-green-500" :
                                        note.type === "concern" ? "border-l-red-500" :
                                            "border-l-blue-500"
                                    }`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-gray-800">{note.content}</p>
                                                <p className="text-sm text-gray-500 mt-2">{note.date}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${note.type === "praise" ? "bg-green-100 text-green-700" :
                                                    note.type === "concern" ? "bg-red-100 text-red-700" :
                                                        "bg-blue-100 text-blue-700"
                                                }`}>
                                                {note.type}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Achievements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                            Achievements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 flex-wrap">
                            {learner.achievements.map(achievement => (
                                <div
                                    key={achievement.name}
                                    className="flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-lg border border-orange-100"
                                >
                                    <span className="text-2xl">{achievement.icon}</span>
                                    <div>
                                        <p className="font-medium">{achievement.name}</p>
                                        <p className="text-xs text-gray-500">{achievement.earned_at}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

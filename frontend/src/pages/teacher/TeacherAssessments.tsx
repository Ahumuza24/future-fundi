import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ClipboardCheck, User, Save, ChevronDown, ChevronUp,
    TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SkillRubric {
    id: string;
    name: string;
    description: string;
    max_score: number;
}

interface LearnerAssessment {
    id: string;
    learner_id: string;
    learner_name: string;
    skills: { [skillId: string]: number };
    notes: string;
    trend: "up" | "down" | "stable";
    last_assessment?: string;
}

const SKILL_RUBRICS: SkillRubric[] = [
    { id: "problem_solving", name: "Problem Solving", description: "Ability to analyze and solve challenges", max_score: 5 },
    { id: "creativity", name: "Creativity", description: "Original thinking and innovation", max_score: 5 },
    { id: "collaboration", name: "Collaboration", description: "Working effectively with peers", max_score: 5 },
    { id: "technical_skills", name: "Technical Skills", description: "Hands-on ability with tools and equipment", max_score: 5 },
    { id: "communication", name: "Communication", description: "Expressing ideas clearly", max_score: 5 },
    { id: "persistence", name: "Persistence", description: "Continuing despite challenges", max_score: 5 },
];

export default function TeacherAssessments() {
    const [learners, setLearners] = useState<LearnerAssessment[]>([]);
    const [expandedLearner, setExpandedLearner] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    useEffect(() => {
        // Load demo learners with assessments
        const demoLearners: LearnerAssessment[] = [
            {
                id: "1", learner_id: "1", learner_name: "Alex Kato",
                skills: { problem_solving: 4, creativity: 5, collaboration: 3, technical_skills: 4, communication: 4, persistence: 5 },
                notes: "Shows excellent problem-solving abilities. Needs encouragement in group work.",
                trend: "up",
                last_assessment: "2 weeks ago"
            },
            {
                id: "2", learner_id: "2", learner_name: "Bella Nakato",
                skills: { problem_solving: 3, creativity: 4, collaboration: 5, technical_skills: 3, communication: 5, persistence: 4 },
                notes: "Great team player. Building technical confidence.",
                trend: "stable",
                last_assessment: "1 week ago"
            },
            {
                id: "3", learner_id: "3", learner_name: "Charles Mugisha",
                skills: { problem_solving: 5, creativity: 3, collaboration: 4, technical_skills: 5, communication: 3, persistence: 4 },
                notes: "Strong technical skills. Working on creative thinking.",
                trend: "up",
                last_assessment: "3 days ago"
            },
            {
                id: "4", learner_id: "4", learner_name: "Diana Asiimwe",
                skills: { problem_solving: 2, creativity: 4, collaboration: 4, technical_skills: 2, communication: 4, persistence: 3 },
                notes: "Showing improvement. Needs extra support with technical tasks.",
                trend: "down",
                last_assessment: "1 week ago"
            },
        ];
        setLearners(demoLearners);
    }, []);

    const updateSkillScore = (learnerId: string, skillId: string, score: number) => {
        setLearners(prev => prev.map(l => {
            if (l.id === learnerId) {
                return { ...l, skills: { ...l.skills, [skillId]: score } };
            }
            return l;
        }));
    };

    const updateNotes = (learnerId: string, notes: string) => {
        setLearners(prev => prev.map(l => {
            if (l.id === learnerId) {
                return { ...l, notes };
            }
            return l;
        }));
    };

    const saveAssessment = async (learnerId: string) => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaving(false);
        setSavedMessage(`Assessment saved for ${learners.find(l => l.id === learnerId)?.learner_name}`);
        setTimeout(() => setSavedMessage(null), 3000);
    };

    const getAverageScore = (skills: { [key: string]: number }) => {
        const scores = Object.values(skills);
        return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    };

    const getScoreColor = (score: number, max: number) => {
        const percentage = (score / max) * 100;
        if (percentage >= 80) return "var(--fundi-lime)";
        if (percentage >= 60) return "var(--fundi-cyan)";
        if (percentage >= 40) return "var(--fundi-orange)";
        return "var(--fundi-pink)";
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "up": return <TrendingUp className="h-5 w-5 text-green-500" />;
            case "down": return <TrendingDown className="h-5 w-5 text-red-500" />;
            default: return <Minus className="h-5 w-5 text-gray-400" />;
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            Assessment Tools
                        </h1>
                        <p className="text-gray-600">Track learner skills and progress</p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-100">
                        <ClipboardCheck className="h-8 w-8 text-cyan-600" />
                    </div>
                </div>

                {/* Success Message */}
                <AnimatePresence>
                    {savedMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2"
                        >
                            <CheckCircle className="h-5 w-5" />
                            {savedMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Skill Legend */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Skill Rubric Guide</CardTitle>
                        <CardDescription>Rate each skill from 1-5</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map(score => (
                                <div key={score} className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                                    <span className="font-bold">{score}</span>
                                    <span className="text-sm text-gray-600">
                                        {score === 1 && "Beginning"}
                                        {score === 2 && "Developing"}
                                        {score === 3 && "Proficient"}
                                        {score === 4 && "Advanced"}
                                        {score === 5 && "Expert"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Learner Assessments */}
                <div className="space-y-4">
                    {learners.map((learner, index) => (
                        <motion.div
                            key={learner.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="overflow-hidden">
                                {/* Learner Header */}
                                <CardHeader
                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedLearner(expandedLearner === learner.id ? null : learner.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: "var(--fundi-purple)" }}
                                            >
                                                {learner.learner_name.split(" ").map(n => n[0]).join("")}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{learner.learner_name}</CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <span>Avg: {getAverageScore(learner.skills)}/5</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        {getTrendIcon(learner.trend)}
                                                        {learner.trend === "up" && "Improving"}
                                                        {learner.trend === "down" && "Needs attention"}
                                                        {learner.trend === "stable" && "Stable"}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">Last: {learner.last_assessment}</span>
                                            {expandedLearner === learner.id ? (
                                                <ChevronUp className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Skills Assessment */}
                                <AnimatePresence>
                                    {expandedLearner === learner.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <CardContent className="border-t bg-gray-50 space-y-6">
                                                {/* Skills Grid */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {SKILL_RUBRICS.map(skill => (
                                                        <div key={skill.id} className="bg-white p-4 rounded-lg border">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div>
                                                                    <h4 className="font-medium">{skill.name}</h4>
                                                                    <p className="text-xs text-gray-500">{skill.description}</p>
                                                                </div>
                                                                <span
                                                                    className="text-2xl font-bold"
                                                                    style={{ color: getScoreColor(learner.skills[skill.id] || 0, skill.max_score) }}
                                                                >
                                                                    {learner.skills[skill.id] || 0}
                                                                </span>
                                                            </div>
                                                            {/* Slider */}
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map(score => (
                                                                    <button
                                                                        key={score}
                                                                        onClick={() => updateSkillScore(learner.id, skill.id, score)}
                                                                        className={`flex-1 h-8 rounded transition-all ${learner.skills[skill.id] >= score
                                                                                ? "bg-cyan-500 hover:bg-cyan-600"
                                                                                : "bg-gray-200 hover:bg-gray-300"
                                                                            }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Teacher Notes */}
                                                <div>
                                                    <Label className="mb-2 block">Teacher Notes</Label>
                                                    <textarea
                                                        value={learner.notes}
                                                        onChange={(e) => updateNotes(learner.id, e.target.value)}
                                                        className="w-full p-3 border rounded-lg resize-none h-24"
                                                        placeholder="Add observations, areas for improvement, or praise..."
                                                    />
                                                </div>

                                                {/* Summary & Save */}
                                                <div className="flex items-center justify-between pt-4 border-t">
                                                    <div className="flex items-center gap-4">
                                                        {learner.trend === "down" && (
                                                            <div className="flex items-center gap-2 text-orange-600">
                                                                <AlertTriangle className="h-5 w-5" />
                                                                <span className="text-sm font-medium">Consider flagging for follow-up</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        onClick={() => saveAssessment(learner.id)}
                                                        disabled={saving}
                                                        style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                                                        className="gap-2"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        {saving ? "Saving..." : "Save Assessment"}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Progress Aggregation Summary */}
                <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                    <CardHeader>
                        <CardTitle>Class Progress Overview</CardTitle>
                        <CardDescription>Aggregated skill levels across all learners</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {SKILL_RUBRICS.map(skill => {
                                const avgScore = learners.reduce((sum, l) => sum + (l.skills[skill.id] || 0), 0) / learners.length;
                                return (
                                    <div key={skill.id} className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">{skill.name}</p>
                                        <p
                                            className="text-2xl font-bold"
                                            style={{ color: getScoreColor(avgScore, 5) }}
                                        >
                                            {avgScore.toFixed(1)}
                                        </p>
                                        <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${(avgScore / 5) * 100}%`,
                                                    backgroundColor: getScoreColor(avgScore, 5)
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

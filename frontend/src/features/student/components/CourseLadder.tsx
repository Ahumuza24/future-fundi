import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Lock, Star, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enrollmentApi, courseApi } from "@/lib/api";

interface Level {
    id: string;
    level_number: number;
    name: string;
    description: string;
    learning_outcomes: string[];
    required_modules_count: number;
    required_artifacts_count: number;
    required_assessment_score: number;
}

interface LevelProgress {
    level_number: number;
    modules_completed: number;
    artifacts_submitted: number;
    assessment_score: number;
    completed: boolean;
    completion_percentage: number;
}

interface Enrollment {
    id: string;
    course_name: string;
    course_domain: string;
    current_level_number: number;
    current_level_name: string;
    total_levels: number;
    completed_levels_count: number;
    current_progress: LevelProgress | null;
    course?: {
        levels: Level[];
    };
}

interface CourseLadderProps {
    enrollmentId?: string;
    learnerId?: string;
}

export default function CourseLadder({ enrollmentId, learnerId }: CourseLadderProps) {
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                if (enrollmentId) {
                    // Fetch specific enrollment
                    const response = await enrollmentApi.getById(enrollmentId);
                    setEnrollment(response.data);
                    if (response.data.course?.levels) {
                        setLevels(response.data.course.levels);
                    }
                } else {
                    // Fetch first enrollment for demo
                    const response = await enrollmentApi.getAll();
                    const enrollments = response.data.results || response.data;
                    if (enrollments.length > 0) {
                        const firstEnrollment = enrollments[0];
                        setEnrollment(firstEnrollment);

                        // Fetch course details with levels
                        if (firstEnrollment.course) {
                            const courseResponse = await courseApi.getById(firstEnrollment.course);
                            setLevels(courseResponse.data.levels || []);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch course data:", error);
                // Fall back to static data
                setLevels([
                    { id: '1', level_number: 1, name: "Curiosity", description: "Discovering new ideas", learning_outcomes: [], required_modules_count: 4, required_artifacts_count: 6, required_assessment_score: 70 },
                    { id: '2', level_number: 2, name: "Explorer", description: "Asking questions", learning_outcomes: [], required_modules_count: 4, required_artifacts_count: 6, required_assessment_score: 70 },
                    { id: '3', level_number: 3, name: "Builder", description: "Creating solutions", learning_outcomes: [], required_modules_count: 4, required_artifacts_count: 6, required_assessment_score: 70 },
                    { id: '4', level_number: 4, name: "Creator", description: "Design your own", learning_outcomes: [], required_modules_count: 4, required_artifacts_count: 6, required_assessment_score: 70 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [enrollmentId, learnerId]);

    const getLevelStatus = (levelNumber: number) => {
        if (!enrollment) return 'locked';
        if (enrollment.completed_levels_count >= levelNumber) return 'completed';
        if (enrollment.current_level_number === levelNumber) return 'current';
        return 'locked';
    };

    const getLevelColor = (index: number) => {
        const colors = [
            'var(--fundi-orange)',
            'var(--fundi-cyan)',
            'var(--fundi-purple)',
            'var(--fundi-lime)',
            'var(--fundi-pink)',
        ];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <BookOpen className="h-6 w-6 text-purple-600" />
                        </div>
                        Loading Course...
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <CardTitle>{enrollment?.course_name || "Course Progress"}</CardTitle>
                        <p className="text-sm text-gray-500">
                            {enrollment ? `Level ${enrollment.current_level_number} of ${enrollment.total_levels}` : "Your learning journey"}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-1 bg-gray-200" />

                    <div className="space-y-6">
                        {levels.map((level, index) => {
                            const status = getLevelStatus(level.level_number);
                            const isCompleted = status === 'completed';
                            const isCurrent = status === 'current';
                            const isLocked = status === 'locked';
                            const color = getLevelColor(index);

                            return (
                                <motion.div
                                    key={level.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative flex items-start gap-4"
                                >
                                    {/* Icon Node */}
                                    <div
                                        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 transition-all flex-shrink-0 ${isCompleted ? "bg-white shadow-sm" :
                                                isCurrent ? "bg-white scale-110 shadow-lg" :
                                                    "bg-gray-100 border-gray-300"
                                            }`}
                                        style={{
                                            borderColor: isLocked ? undefined : color,
                                            color: isLocked ? '#9ca3af' : color
                                        }}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : isCurrent ? (
                                            <Star className="h-5 w-5 fill-current" />
                                        ) : (
                                            <Lock className="h-4 w-4" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${isCurrent ? "bg-purple-50 border-purple-200 shadow-md" :
                                            isLocked ? "bg-gray-50 border-transparent opacity-60" :
                                                "bg-white border-gray-100 hover:border-gray-200"
                                        }`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`font-bold ${isCurrent ? "text-lg" : "text-base"}`} style={{ color: isLocked ? '#6b7280' : color }}>
                                                    Level {level.level_number}: {level.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                                            </div>
                                            {isCurrent && (
                                                <span className="text-xs font-bold px-2 py-1 bg-purple-200 text-purple-800 rounded-full flex-shrink-0">
                                                    Current
                                                </span>
                                            )}
                                            {isCompleted && (
                                                <span className="text-xs font-bold px-2 py-1 bg-green-200 text-green-800 rounded-full flex-shrink-0">
                                                    ✓ Done
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress info for current level */}
                                        {isCurrent && enrollment?.current_progress && (
                                            <div className="mt-3 pt-3 border-t border-purple-200">
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div className="text-center">
                                                        <div className="font-bold text-purple-600">
                                                            {enrollment.current_progress.modules_completed}/{level.required_modules_count}
                                                        </div>
                                                        <div className="text-gray-500">Modules</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-purple-600">
                                                            {enrollment.current_progress.artifacts_submitted}/{level.required_artifacts_count}
                                                        </div>
                                                        <div className="text-gray-500">Artifacts</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-purple-600">
                                                            {enrollment.current_progress.assessment_score}%
                                                        </div>
                                                        <div className="text-gray-500">Score</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all"
                                                        style={{ width: `${enrollment.current_progress.completion_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

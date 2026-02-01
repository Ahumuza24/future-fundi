import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentApi } from "@/lib/api";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Lock,
    Play,
    FileText,
    Award,
    BookOpen,
    Target,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface Module {
    id: string;
    name: string;
    description: string;
    content: string;
    suggestedActivities: any[];
    materials: any[];
    competences: any[];
    mediaFiles: any[];
    badgeName: string;
}

interface Level {
    id: string;
    levelNumber: number;
    name: string;
    description: string;
    learningOutcomes: string[];
    requiredModulesCount: number;
    requiredArtifactsCount: number;
    requiredAssessmentScore: number;
    requiresTeacherConfirmation: boolean;
    modules: Module[];
    progress: {
        completionPercentage: number;
        completed: boolean;
        completedAt: string | null;
    };
    isLocked: boolean;
    isCurrent: boolean;
}

interface PathwayData {
    enrollment: {
        id: string;
        enrolledAt: string | null;
    };
    course: {
        id: string;
        name: string;
        description: string;
    };
    currentLevel: {
        id: string | null;
        name: string | null;
        levelNumber: number;
    };
    progress: {
        overallPercentage: number;
        completedLevels: number;
        totalLevels: number;
    };
    levels: Level[];
}

const PathwayLearning = () => {
    const { enrollmentId } = useParams<{ enrollmentId: string }>();
    const navigate = useNavigate();

    const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPathwayData = async () => {
            if (!enrollmentId) return;

            try {
                setLoading(true);
                const response = await studentApi.getPathwayLearning(enrollmentId);
                setPathwayData(response.data);

                // Auto-select current level or first unlocked level
                const currentLevel = response.data.levels.find((l: Level) => l.isCurrent);
                const firstUnlockedLevel = response.data.levels.find((l: Level) => !l.isLocked);
                setSelectedLevel(currentLevel || firstUnlockedLevel || response.data.levels[0]);

                setError(null);
            } catch (err) {
                console.error('Failed to fetch pathway data:', err);
                setError('Failed to load pathway content');
            } finally {
                setLoading(false);
            }
        };

        fetchPathwayData();
    }, [enrollmentId]);

    // Auto-select first module when level changes
    useEffect(() => {
        if (selectedLevel && selectedLevel.modules.length > 0) {
            setSelectedModule(selectedLevel.modules[0]);
        } else {
            setSelectedModule(null);
        }
    }, [selectedLevel]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading pathway...</p>
                </div>
            </div>
        );
    }

    if (error || !pathwayData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'No data available'}</p>
                    <Button onClick={() => navigate('/student/dashboard')}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const currentModuleIndex = selectedLevel?.modules.findIndex(m => m.id === selectedModule?.id) ?? -1;
    const canGoNext = currentModuleIndex < (selectedLevel?.modules.length ?? 0) - 1;
    const canGoPrevious = currentModuleIndex > 0;

    const handleNextModule = () => {
        if (canGoNext && selectedLevel) {
            setSelectedModule(selectedLevel.modules[currentModuleIndex + 1]);
        }
    };

    const handlePreviousModule = () => {
        if (canGoPrevious && selectedLevel) {
            setSelectedModule(selectedLevel.modules[currentModuleIndex - 1]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/student/dashboard')}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Dashboard
                            </Button>
                            <div className="h-6 w-px bg-gray-300" />
                            <div>
                                <h1 className="font-bold text-lg text-gray-900">{pathwayData.course.name}</h1>
                                <p className="text-sm text-gray-500">
                                    Level {pathwayData.currentLevel.levelNumber} • {pathwayData.progress.completedLevels}/{pathwayData.progress.totalLevels} Levels Completed
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">Overall Progress</p>
                                <p className="text-2xl font-bold text-[var(--fundi-orange)]">{pathwayData.progress.overallPercentage}%</p>
                            </div>
                            <div className="w-24">
                                <Progress value={pathwayData.progress.overallPercentage} className="h-2" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar - Levels & Modules */}
                    <div className="col-span-3 space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-gray-700">Course Content</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                                {pathwayData.levels.map((level) => (
                                    <div key={level.id} className="space-y-1">
                                        {/* Level Header */}
                                        <button
                                            onClick={() => !level.isLocked && setSelectedLevel(level)}
                                            disabled={level.isLocked}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${level.isLocked
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : selectedLevel?.id === level.id
                                                        ? 'bg-[var(--fundi-orange)] text-white'
                                                        : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {level.isLocked ? (
                                                        <Lock className="h-4 w-4" />
                                                    ) : level.progress.completed ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <BookOpen className="h-4 w-4" />
                                                    )}
                                                    <span className="font-medium text-sm">{level.name}</span>
                                                </div>
                                                {!level.isLocked && (
                                                    <span className="text-xs">{Math.round(level.progress.completionPercentage)}%</span>
                                                )}
                                            </div>
                                        </button>

                                        {/* Modules List */}
                                        {selectedLevel?.id === level.id && !level.isLocked && (
                                            <div className="ml-4 space-y-1">
                                                {level.modules.map((module, idx) => (
                                                    <button
                                                        key={module.id}
                                                        onClick={() => setSelectedModule(module)}
                                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedModule?.id === module.id
                                                                ? 'bg-orange-50 text-[var(--fundi-orange)] font-medium'
                                                                : 'hover:bg-gray-50 text-gray-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-gray-400">{idx + 1}</span>
                                                            <span className="truncate">{module.name}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-9">
                        <AnimatePresence mode="wait">
                            {selectedModule ? (
                                <motion.div
                                    key={selectedModule.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                            Module {currentModuleIndex + 1} of {selectedLevel?.modules.length}
                                                        </span>
                                                        {selectedModule.badgeName && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded flex items-center gap-1">
                                                                <Award className="h-3 w-3" />
                                                                {selectedModule.badgeName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-2xl mb-2">{selectedModule.name}</CardTitle>
                                                    <p className="text-gray-600">{selectedModule.description}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Module Content */}
                                            {selectedModule.content && (
                                                <div className="prose max-w-none">
                                                    <div className="bg-white rounded-lg p-6 border">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <FileText className="h-5 w-5 text-gray-500" />
                                                            <h3 className="text-lg font-semibold">Learning Content</h3>
                                                        </div>
                                                        <div
                                                            className="text-gray-700 leading-relaxed"
                                                            dangerouslySetInnerHTML={{ __html: selectedModule.content }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Media Files */}
                                            {selectedModule.mediaFiles && selectedModule.mediaFiles.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Play className="h-5 w-5 text-gray-500" />
                                                        <h3 className="text-lg font-semibold">Media Resources</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {selectedModule.mediaFiles.map((media: any, idx: number) => (
                                                            <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                                <p className="font-medium text-sm">{media.name || `Resource ${idx + 1}`}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{media.type || 'Media file'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Learning Outcomes */}
                                            {selectedModule.competences && selectedModule.competences.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Target className="h-5 w-5 text-gray-500" />
                                                        <h3 className="text-lg font-semibold">Competencies</h3>
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {selectedModule.competences.map((competence: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-gray-700">{competence}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Suggested Activities */}
                                            {selectedModule.suggestedActivities && selectedModule.suggestedActivities.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Clock className="h-5 w-5 text-gray-500" />
                                                        <h3 className="text-lg font-semibold">Suggested Activities</h3>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {selectedModule.suggestedActivities.map((activity: any, idx: number) => (
                                                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                <p className="font-medium text-blue-900">{activity.title || activity}</p>
                                                                {activity.description && (
                                                                    <p className="text-sm text-blue-700 mt-1">{activity.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Materials */}
                                            {selectedModule.materials && selectedModule.materials.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Required Materials</h3>
                                                    <ul className="grid grid-cols-2 gap-2">
                                                        {selectedModule.materials.map((material: string, idx: number) => (
                                                            <li key={idx} className="flex items-center gap-2 text-gray-700">
                                                                <div className="h-2 w-2 rounded-full bg-[var(--fundi-orange)]" />
                                                                {material}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Navigation Buttons */}
                                            <div className="flex items-center justify-between pt-6 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={handlePreviousModule}
                                                    disabled={!canGoPrevious}
                                                >
                                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                                    Previous Module
                                                </Button>
                                                <Button
                                                    onClick={handleNextModule}
                                                    disabled={!canGoNext}
                                                    className="bg-[var(--fundi-orange)] hover:bg-orange-600"
                                                >
                                                    Next Module
                                                    <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Select a module to start learning</p>
                                    </CardContent>
                                </Card>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PathwayLearning;

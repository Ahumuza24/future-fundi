import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentApi, MEDIA_BASE_URL } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
    ChevronRight,
    CheckCircle,
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
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string; name: string } | null>(null);

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
                const levelToSelect = currentLevel || firstUnlockedLevel || response.data.levels[0];
                setSelectedLevel(levelToSelect);

                // Auto-select first module
                if (levelToSelect && levelToSelect.modules.length > 0) {
                    setSelectedModule(levelToSelect.modules[0]);
                }

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

    // ESC key to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedMedia(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

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
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // Get all unique modules (avoid duplicates)
    const allModules = pathwayData.levels.flatMap(level =>
        level.modules.map(module => ({ ...module, levelName: level.name }))
    );

    // Remove duplicates based on module ID
    const uniqueModules = allModules.filter((module, index, self) =>
        index === self.findIndex((m) => m.id === module.id)
    );

    // Calculate total and completed using unique modules
    const totalModules = uniqueModules.length;
    const completedModules = pathwayData.levels.reduce((sum, level) => {
        return sum + (level.progress.completed ? level.modules.length : 0);
    }, 0);

    const currentModuleIndex = uniqueModules.findIndex(m => m.id === selectedModule?.id);
    const canGoNext = currentModuleIndex < uniqueModules.length - 1;
    const canGoPrevious = currentModuleIndex > 0;

    const handleNextModule = () => {
        if (canGoNext) {
            const nextModule = uniqueModules[currentModuleIndex + 1];
            setSelectedModule(nextModule);
            // Update selected level
            const nextLevel = pathwayData.levels.find(l =>
                l.modules.some(m => m.id === nextModule.id)
            );
            if (nextLevel) setSelectedLevel(nextLevel);
        }
    };

    const handlePreviousModule = () => {
        if (canGoPrevious) {
            const prevModule = uniqueModules[currentModuleIndex - 1];
            setSelectedModule(prevModule);
            // Update selected level
            const prevLevel = pathwayData.levels.find(l =>
                l.modules.some(m => m.id === prevModule.id)
            );
            if (prevLevel) setSelectedLevel(prevLevel);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-px bg-gray-300" />
                            <div>
                                <h1 className="font-bold text-lg text-gray-900">{pathwayData.course.name}</h1>
                                <p className="text-sm text-gray-500">
                                    {selectedModule ? selectedModule.name : 'Select a microcredential'} • {completedModules}/{totalModules} Microcredentials Completed
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
                    {/* Sidebar - Microcredentials */}
                    <div className="col-span-3 space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-gray-700">Microcredentials</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto">
                                {uniqueModules.map((module, globalIndex) => (
                                    <button
                                        key={module.id}
                                        onClick={() => {
                                            setSelectedModule(module);
                                            const moduleLevel = pathwayData.levels.find(l =>
                                                l.modules.some(m => m.id === module.id)
                                            );
                                            if (moduleLevel) setSelectedLevel(moduleLevel);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedModule?.id === module.id
                                            ? 'bg-[var(--fundi-orange)] text-white font-medium'
                                            : 'hover:bg-orange-50 text-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold opacity-70">{globalIndex + 1}</span>
                                            <span className="truncate flex-1">{module.name}</span>
                                        </div>
                                        {module.badgeName && (
                                            <div className={`flex items-center gap-1 mt-1 text-xs ${selectedModule?.id === module.id ? 'opacity-90' : 'opacity-70'
                                                }`}>
                                                <Award className="h-3 w-3" />
                                                <span>{module.badgeName}</span>
                                            </div>
                                        )}
                                    </button>
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
                                                            Microcredential {currentModuleIndex + 1} of {uniqueModules.length}
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
                                                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                            {selectedModule.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Media Files */}
                                            {selectedModule.mediaFiles && selectedModule.mediaFiles.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Play className="h-5 w-5 text-gray-500" />
                                                        <h3 className="text-lg font-semibold">Media Resources</h3>
                                                        <span className="text-xs text-gray-500">({selectedModule.mediaFiles.length} files)</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {selectedModule.mediaFiles.map((media: any, idx: number) => {
                                                            // Support multiple property names for URL
                                                            const relativeUrl = media.url || media.file || media.path || media.src || media.link;

                                                            // Convert relative URL to absolute URL
                                                            const mediaUrl = relativeUrl?.startsWith('http')
                                                                ? relativeUrl
                                                                : relativeUrl?.startsWith('/')
                                                                    ? `${MEDIA_BASE_URL}${relativeUrl}`
                                                                    : relativeUrl;

                                                            const isImage = media.type?.toLowerCase().includes('image') ||
                                                                media.content_type?.toLowerCase().includes('image') ||
                                                                mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                                                            const isVideo = media.type?.toLowerCase().includes('video') ||
                                                                media.content_type?.toLowerCase().includes('video') ||
                                                                mediaUrl?.match(/\.(mp4|webm|ogg|mov)$/i);

                                                            return (
                                                                <div
                                                                    key={`media-${selectedModule.id}-${idx}`}
                                                                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white group"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        if (mediaUrl) {
                                                                            setSelectedMedia({
                                                                                url: mediaUrl,
                                                                                type: media.content_type || media.type || (isImage ? 'image' : isVideo ? 'video' : 'file'),
                                                                                name: media.name || media.title || `Resource ${idx + 1}`
                                                                            });
                                                                        } else {
                                                                            console.error('No URL found in media object:', media);
                                                                            toast.error("This media file has no URL.", "Unavailable Media");
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="relative h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                        {isImage && mediaUrl ? (
                                                                            <>
                                                                                <img
                                                                                    src={mediaUrl}
                                                                                    alt={media.name || `Resource ${idx + 1}`}
                                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                                    onError={(e) => {
                                                                                        console.error('Image failed to load:', mediaUrl);
                                                                                        const target = e.currentTarget;
                                                                                        target.style.display = 'none';
                                                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                                                        if (fallback) fallback.classList.remove('hidden');
                                                                                    }}
                                                                                />
                                                                                <div className="hidden flex-col items-center justify-center text-gray-400">
                                                                                    <FileText className="h-8 w-8 mb-1" />
                                                                                    <span className="text-xs">Image unavailable</span>
                                                                                </div>
                                                                            </>
                                                                        ) : isVideo && mediaUrl ? (
                                                                            <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                                                                                <Play className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                                                                    Video
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                                                <FileText className="h-8 w-8 mb-1" />
                                                                                <span className="text-xs">{media.type?.split('/')[0] || 'No URL'}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="p-2">
                                                                        <p className="font-medium text-xs truncate" title={media.name || `Resource ${idx + 1}`}>
                                                                            {media.name || media.title || `Resource ${idx + 1}`}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 truncate">
                                                                            {isImage ? 'Image' : isVideo ? 'Video' : media.type || 'File'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Competencies */}
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
                                                    Previous
                                                </Button>
                                                <Button
                                                    onClick={handleNextModule}
                                                    disabled={!canGoNext}
                                                    className="bg-[var(--fundi-orange)] hover:bg-orange-600"
                                                >
                                                    Next Microcredential
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
                                        <p className="text-gray-600">Select a microcredential to start learning</p>
                                    </CardContent>
                                </Card>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Media Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <div className="relative max-w-6xl max-h-[90vh] w-full">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedMedia(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-sm">
                                <span>Press ESC or click outside to close</span>
                                <span className="text-2xl">×</span>
                            </div>
                        </button>

                        {/* Media Content */}
                        <div
                            className="bg-white rounded-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {selectedMedia.type?.toLowerCase().includes('image') ? (
                                <div className="flex flex-col">
                                    <img
                                        src={selectedMedia.url}
                                        alt={selectedMedia.name}
                                        className="w-full max-h-[70vh] object-contain bg-gray-100"
                                    />
                                    <div className="p-4 border-t">
                                        <p className="font-medium text-gray-900">{selectedMedia.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">Image</p>
                                    </div>
                                </div>
                            ) : selectedMedia.type?.toLowerCase().includes('video') ? (
                                <div className="flex flex-col">
                                    <video
                                        controls
                                        autoPlay
                                        className="w-full max-h-[70vh] bg-black"
                                    >
                                        <source src={selectedMedia.url} type={selectedMedia.type} />
                                        Your browser does not support the video tag.
                                    </video>
                                    <div className="p-4 border-t">
                                        <p className="font-medium text-gray-900">{selectedMedia.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">Video</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="font-medium text-gray-900 mb-2">{selectedMedia.name}</p>
                                    <p className="text-sm text-gray-500 mb-4">{selectedMedia.type}</p>
                                    <Button
                                        onClick={() => window.open(selectedMedia.url, '_blank')}
                                        className="bg-[var(--fundi-orange)] hover:bg-orange-600"
                                    >
                                        Download File
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PathwayLearning;

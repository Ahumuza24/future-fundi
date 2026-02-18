import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseApi, moduleApi, careerApi, MEDIA_BASE_URL } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
    Plus, Edit, Trash2, ChevronDown, ChevronUp,
    Briefcase, BookOpen, Save, X, Image, Video,
    Sparkles, GraduationCap, Lightbulb, Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Career {
    id: string;
    title: string;
    description: string;
    course: string;
}

interface MediaFile {
    id: string;
    type: 'image' | 'video';
    name: string;
    url: string;
    content_type: string;
}

interface Module {
    id: string;
    name: string;
    description: string;
    content: string;
    suggested_activities: string[];
    materials: string[];
    competences: string[];
    media_files: MediaFile[];
    course: string;
    badge_name?: string;
}

interface Course {
    id: string;
    name: string;
    description: string;
    careers?: Career[];
    modules?: Module[];
}

// Fundi brand color palette for pathways
const pathwayColors = [
    { bg: 'from-[#FF6B35] to-[#E85A24]', light: 'bg-white', text: 'text-[#FF6B35]', border: 'border-[#FF6B35]/30' },  // Fundi Orange
    { bg: 'from-[#00C4B4] to-[#00A89C]', light: 'bg-white', text: 'text-[#00C4B4]', border: 'border-[#00C4B4]/30' },   // Fundi Cyan
    { bg: 'from-[#C7F464] to-[#A8D94A]', light: 'bg-white', text: 'text-[#7CB518]', border: 'border-[#C7F464]/50' },   // Fundi Lime
    { bg: 'from-[#1A1A2E] to-[#2D2D44]', light: 'bg-white', text: 'text-[#1A1A2E]', border: 'border-gray-300' },       // Fundi Dark
    { bg: 'from-[#FF6B35] to-[#00C4B4]', light: 'bg-white', text: 'text-[#FF6B35]', border: 'border-[#FF6B35]/30' },   // Orange-Cyan gradient
    { bg: 'from-[#00C4B4] to-[#C7F464]', light: 'bg-white', text: 'text-[#00C4B4]', border: 'border-[#00C4B4]/30' },   // Cyan-Lime gradient
];

export default function CurriculumDataEntry() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedPathway, setExpandedPathway] = useState<string | null>(null);
    const [editingModule, setEditingModule] = useState<string | null>(null);
    const [editingCareer, setEditingCareer] = useState<string | null>(null);
    const [isCreatingPathway, setIsCreatingPathway] = useState(false);
    const [isCreatingModule, setIsCreatingModule] = useState<string | null>(null);
    const [isCreatingCareer, setIsCreatingCareer] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await courseApi.getAll();
            // Handle both paginated and non-paginated responses
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setCourses(data);
        } catch (err) {
            console.error(err);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const getColorScheme = (index: number) => pathwayColors[index % pathwayColors.length];

    const togglePathway = async (courseId: string) => {
        if (expandedPathway === courseId) {
            setExpandedPathway(null);
        } else {
            try {
                const res = await courseApi.getById(courseId);
                setCourses(prev => prev.map(c => c.id === courseId ? res.data : c));
                setExpandedPathway(courseId);
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--fundi-bg-light)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading curriculum...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--fundi-bg-light)]">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--fundi-black)]">
                                Curriculum Editor
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {courses.length} pathways • Build and manage learning content
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsCreatingPathway(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" /> New Pathway
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Create Pathway Modal */}
                <AnimatePresence>
                    {isCreatingPathway && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-8"
                        >
                            <PathwayForm
                                onClose={() => setIsCreatingPathway(false)}
                                onSuccess={() => { setIsCreatingPathway(false); fetchCourses(); }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pathways Grid - 3 per row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course, index) => {
                        const colors = getColorScheme(index);
                        const isSelected = expandedPathway === course.id;
                        const moduleCount = course.modules?.length || 0;
                        const careerCount = course.careers?.length || 0;

                        return (
                            <motion.div
                                key={course.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => togglePathway(course.id)}
                                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 ${isSelected
                                    ? `${colors.border} bg-white shadow-lg ring-2 ring-offset-2 ring-[#FF6B35]`
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                    }`}
                            >
                                {/* Pathway Icon & Name */}
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                        <BookOpen className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{course.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                            {course.description || 'No description'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                                            <Sparkles className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">{moduleCount}</p>
                                            <p className="text-xs text-gray-500">Micro-credentials</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-emerald-100' : 'bg-gray-100'} flex items-center justify-center`}>
                                            <Briefcase className={`h-4 w-4 ${isSelected ? 'text-emerald-600' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">{careerCount}</p>
                                            <p className="text-xs text-gray-500">Career Paths</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="mt-4 pt-3 border-t border-[#FF6B35]/20">
                                        <span className="text-xs font-medium text-[#FF6B35] flex items-center gap-1">
                                            <ChevronDown className="h-3 w-3" /> Viewing details below
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {courses.length === 0 && !isCreatingPathway && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#00C4B4] flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pathways Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first learning pathway to get started</p>
                        <Button
                            onClick={() => setIsCreatingPathway(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" /> Create First Pathway
                        </Button>
                    </div>
                )}

                {/* Expanded Detail View - Full Width Below Grid */}
                <AnimatePresence>
                    {expandedPathway && (() => {
                        const selectedCourse = courses.find(c => c.id === expandedPathway);
                        if (!selectedCourse) return null;
                        const colors = getColorScheme(courses.indexOf(selectedCourse));

                        return (
                            <motion.div
                                key="detail-panel"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={`mt-6 bg-white rounded-2xl border-2 ${colors.border} shadow-lg overflow-hidden`}
                            >
                                {/* Detail Header */}
                                <div className={`p-5 bg-gradient-to-r ${colors.bg} flex items-center justify-between`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">{selectedCourse.name}</h2>
                                            <p className="text-white/80 text-sm">{selectedCourse.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setExpandedPathway(null)}
                                        className="text-white hover:bg-white/20"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Detail Content */}
                                <div className="p-6 space-y-6">
                                    {/* Micro-credentials Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <Sparkles className={`h-5 w-5 ${colors.text}`} />
                                                Micro-credentials
                                            </h3>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => { e.stopPropagation(); setIsCreatingModule(selectedCourse.id); }}
                                                className="gap-1"
                                            >
                                                <Plus className="h-4 w-4" /> Add
                                            </Button>
                                        </div>

                                        {/* New Module Form */}
                                        <AnimatePresence>
                                            {isCreatingModule === selectedCourse.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mb-4"
                                                >
                                                    <ModuleForm
                                                        courseId={selectedCourse.id}
                                                        onClose={() => setIsCreatingModule(null)}
                                                        onSuccess={() => { setIsCreatingModule(null); togglePathway(selectedCourse.id); }}
                                                        colors={colors}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Modules List */}
                                        <div className="space-y-3">
                                            {selectedCourse.modules?.length === 0 && !isCreatingModule && (
                                                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
                                                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>No micro-credentials yet</p>
                                                </div>
                                            )}
                                            {selectedCourse.modules?.map((module) => (
                                                <ModuleCard
                                                    key={module.id}
                                                    module={module}
                                                    courseId={selectedCourse.id}
                                                    colors={colors}
                                                    isEditing={editingModule === module.id}
                                                    onEdit={() => setEditingModule(module.id)}
                                                    onClose={() => setEditingModule(null)}
                                                    onUpdate={() => togglePathway(selectedCourse.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Careers Section */}
                                    <div className="pt-6 border-t">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <Briefcase className={`h-5 w-5 ${colors.text}`} />
                                                Career Paths
                                            </h3>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => { e.stopPropagation(); setIsCreatingCareer(selectedCourse.id); }}
                                                className="gap-1"
                                            >
                                                <Plus className="h-4 w-4" /> Add
                                            </Button>
                                        </div>

                                        {/* New Career Form */}
                                        <AnimatePresence>
                                            {isCreatingCareer === selectedCourse.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mb-4"
                                                >
                                                    <CareerForm
                                                        courseId={selectedCourse.id}
                                                        onClose={() => setIsCreatingCareer(null)}
                                                        onSuccess={() => { setIsCreatingCareer(null); togglePathway(selectedCourse.id); }}
                                                        colors={colors}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Careers Grid */}
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {selectedCourse.careers?.length === 0 && !isCreatingCareer && (
                                                <div className="col-span-full text-center py-6 text-gray-400 border-2 border-dashed rounded-xl">
                                                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>No career paths defined</p>
                                                </div>
                                            )}
                                            {selectedCourse.careers?.map((career) => (
                                                <CareerCard
                                                    key={career.id}
                                                    career={career}
                                                    colors={colors}
                                                    isEditing={editingCareer === career.id}
                                                    onEdit={() => setEditingCareer(career.id)}
                                                    onClose={() => setEditingCareer(null)}
                                                    onUpdate={() => togglePathway(selectedCourse.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pathway Actions */}
                                    <div className="pt-4 border-t flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={async () => {
                                                if (confirm(`Delete "${selectedCourse.name}"? This cannot be undone.`)) {
                                                    await courseApi.delete(selectedCourse.id);
                                                    setExpandedPathway(null);
                                                    fetchCourses();
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" /> Delete Pathway
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ============ PATHWAY FORM ============
function PathwayForm({ onClose, onSuccess, initialData }: {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Course
}) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            if (initialData) {
                await courseApi.update(initialData.id, formData);
            } else {
                await courseApi.create(formData);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border-2 border-[#FF6B35]/30 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#FF6B35]" />
                    {initialData ? 'Edit Pathway' : 'Create New Pathway'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div>
                    <Label className="text-sm font-medium">Pathway Name *</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Robotics & Automation"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of this learning pathway..."
                        className="mt-1 w-full p-3 rounded-lg border text-sm min-h-[80px] focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !formData.name.trim()}
                    >
                        {saving ? 'Saving...' : initialData ? 'Update' : 'Create Pathway'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ============ MODULE CARD ============
function ModuleCard({ module, courseId, colors, isEditing, onEdit, onClose, onUpdate }: {
    module: Module;
    courseId: string;
    colors: typeof pathwayColors[0];
    isEditing: boolean;
    onEdit: () => void;
    onClose: () => void;
    onUpdate: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [fullModule, setFullModule] = useState<Module | null>(null);

    const loadFullModule = async () => {
        if (!fullModule) {
            try {
                const res = await moduleApi.getById(module.id);
                setFullModule(res.data);
            } catch (err) {
                console.error(err);
            }
        }
        setExpanded(!expanded);
    };

    const handleEditClick = async () => {
        if (!fullModule) {
            const res = await moduleApi.getById(module.id);
            setFullModule(res.data);
        }
        onEdit();
    };

    const handleDelete = async () => {
        if (confirm(`Delete "${module.name}"?`)) {
            await moduleApi.delete(module.id);
            onUpdate();
        }
    };

    const data = fullModule || module;
    const activities = Array.isArray(data.suggested_activities) ? data.suggested_activities : [];
    const materials = Array.isArray(data.materials) ? data.materials : [];
    const competences = Array.isArray(data.competences) ? data.competences : [];
    const mediaFiles = Array.isArray(data.media_files) ? data.media_files : [];

    if (isEditing && fullModule) {
        return (
            <ModuleForm
                courseId={courseId}
                module={fullModule}
                onClose={onClose}
                onSuccess={() => { onClose(); onUpdate(); }}
                colors={colors}
            />
        );
    }

    return (
        <div className={`rounded-xl border-2 ${expanded ? colors.border + ' ' + colors.light : 'border-gray-100'} transition-all`}>
            {/* Header */}
            <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0" onClick={loadFullModule}>
                    <div className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{module.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {activities.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        <Lightbulb className="h-3 w-3" /> {activities.length}
                                    </span>
                                )}
                                {competences.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        <GraduationCap className="h-3 w-3" /> {competences.length}
                                    </span>
                                )}
                                {materials.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                        <Wrench className="h-3 w-3" /> {materials.length}
                                    </span>
                                )}
                                {mediaFiles.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                        <Image className="h-3 w-3" /> {mediaFiles.length}
                                    </span>
                                )}
                                {module.badge_name && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full" title={`Badge: ${module.badge_name}`}>
                                        <GraduationCap className="h-3 w-3" /> Badge
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={handleEditClick} className="h-8 w-8">
                        <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleDelete} className="h-8 w-8 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={loadFullModule} className="h-8 w-8">
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && fullModule && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t"
                    >
                        <div className="p-4 space-y-4">
                            {fullModule.badge_name && (
                                <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200 w-fit">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shadow-sm">
                                        <GraduationCap className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-yellow-800 font-medium uppercase">Completion Badge</p>
                                        <p className="text-sm font-bold text-gray-900">{fullModule.badge_name}</p>
                                    </div>
                                </div>
                            )}
                            {/* Content */}
                            {fullModule.content && (
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Content</Label>
                                    <p className="mt-1 text-sm text-gray-700 bg-white p-3 rounded-lg border">{fullModule.content}</p>
                                </div>
                            )}

                            {/* Activities, Competences & Materials - Prominent Display */}
                            <div className="grid sm:grid-cols-3 gap-4">
                                {/* Activities Card */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <Lightbulb className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-blue-900">Activities</h4>
                                            <p className="text-xs text-blue-600">{activities.length} defined</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {activities.length === 0 && (
                                            <p className="text-sm text-blue-400 italic">No activities added</p>
                                        )}
                                        {activities.map((a, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-white/80 rounded-lg px-3 py-2 border border-blue-100">
                                                <span className="text-blue-500 mt-0.5">•</span>
                                                <span className="text-sm text-gray-700">{a}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Competences Card */}
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                                            <GraduationCap className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-emerald-900">Competences</h4>
                                            <p className="text-xs text-emerald-600">{competences.length} skills</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {competences.length === 0 && (
                                            <p className="text-sm text-emerald-400 italic">No competences added</p>
                                        )}
                                        {competences.map((c, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-white/80 rounded-lg px-3 py-2 border border-emerald-100">
                                                <span className="text-emerald-500 mt-0.5">✓</span>
                                                <span className="text-sm text-gray-700">{c}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Materials Card */}
                                <div className="bg-gradient-to-br from-orange-50 to-amber-100/50 rounded-xl p-4 border border-orange-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center">
                                            <Wrench className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-orange-900">Materials</h4>
                                            <p className="text-xs text-orange-600">{materials.length} items</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {materials.length === 0 && (
                                            <p className="text-sm text-orange-400 italic">No materials listed</p>
                                        )}
                                        {materials.map((m, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-white/80 rounded-lg px-3 py-2 border border-orange-100">
                                                <span className="text-[#FF6B35] mt-0.5">▸</span>
                                                <span className="text-sm text-gray-700">{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Media Preview */}
                            {mediaFiles.length > 0 && (
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Media Files</Label>
                                    <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {mediaFiles.map((media) => {
                                            const url = media.url.startsWith('http') ? media.url : `${MEDIA_BASE_URL}${media.url}`;
                                            return (
                                                <div key={media.id} className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                                    {media.type === 'image' ? (
                                                        <img src={url} alt={media.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                            <Video className="h-6 w-6 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============ MODULE FORM ============
function ModuleForm({ courseId, module, onClose, onSuccess, colors }: {
    courseId: string;
    module?: Module;
    onClose: () => void;
    onSuccess: () => void;
    colors: typeof pathwayColors[0];
}) {
    const [formData, setFormData] = useState({
        name: module?.name || '',
        description: module?.description || '',
        content: module?.content || '',
        suggested_activities: Array.isArray(module?.suggested_activities) ? module.suggested_activities : [],
        materials: Array.isArray(module?.materials) ? module.materials : [],
        competences: Array.isArray(module?.competences) ? module.competences : [],
        badge_name: module?.badge_name || '',
    });
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(module?.media_files || []);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.badge_name.trim()) return;
        setSaving(true);
        try {
            if (module) {
                await moduleApi.update(module.id, formData);
            } else {
                await moduleApi.create({ ...formData, course: courseId });
            }
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!module?.id) {
            toast.info('Please save the module first before uploading media.', 'Save Module First');
            return;
        }
        const files = e.target.files;
        if (!files) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const res = await moduleApi.uploadMedia(module.id, file);
                setMediaFiles(res.data.media_files || []);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Upload failed', 'Upload Failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteMedia = async (mediaId: string) => {
        if (!module?.id) return;
        try {
            const res = await moduleApi.deleteMedia(module.id, mediaId);
            setMediaFiles(res.data.media_files || []);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Card className={`border-2 ${colors.border}`}>
            <CardHeader className={colors.light}>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Sparkles className={`h-5 w-5 ${colors.text}`} />
                        {module ? 'Edit Micro-credential' : 'New Micro-credential'}
                    </span>
                    <Button size="icon" variant="ghost" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
                {/* Name */}
                <div>
                    <Label className="text-sm font-medium">Title *</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Introduction to Sensors"
                        className="mt-1"
                    />
                </div>

                {/* Badge Name */}
                <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className={`h-4 w-4 ${colors.text}`} />
                        Completion Badge Name *
                    </Label>
                    <Input
                        value={formData.badge_name}
                        onChange={e => setFormData({ ...formData, badge_name: e.target.value })}
                        placeholder="e.g., Sensor Specialist Badge"
                        className="mt-1"
                    />
                </div>

                {/* Content */}
                <div>
                    <Label className="text-sm font-medium">Content</Label>
                    <textarea
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Main content for this module..."
                        className="mt-1 w-full p-3 rounded-lg border text-sm min-h-[100px]"
                    />
                </div>

                {/* Tags Section */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <TagInput
                        label="Activities"
                        icon={<Lightbulb className="h-4 w-4 text-blue-500" />}
                        items={formData.suggested_activities}
                        onChange={items => setFormData({ ...formData, suggested_activities: items })}
                        placeholder="Add activity..."
                        color="blue"
                    />
                    <TagInput
                        label="Competences"
                        icon={<GraduationCap className="h-4 w-4 text-green-500" />}
                        items={formData.competences}
                        onChange={items => setFormData({ ...formData, competences: items })}
                        placeholder="Add skill..."
                        color="green"
                    />
                    <TagInput
                        label="Materials"
                        icon={<Wrench className="h-4 w-4 text-orange-500" />}
                        items={formData.materials}
                        onChange={items => setFormData({ ...formData, materials: items })}
                        placeholder="Add material..."
                        color="orange"
                    />
                </div>

                {/* Media Upload */}
                {module && (
                    <div>
                        <Label className="text-sm font-medium">Media Files</Label>
                        <div className="mt-2 grid grid-cols-4 gap-2">
                            {mediaFiles.map((media) => {
                                const url = media.url.startsWith('http') ? media.url : `${MEDIA_BASE_URL}${media.url}`;
                                return (
                                    <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border group">
                                        {media.type === 'image' ? (
                                            <img src={url} alt={media.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={url} className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            onClick={() => handleDeleteMedia(media.id)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })}
                            <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-gray-400 transition">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <span className="text-xs text-gray-400">Uploading...</span>
                                ) : (
                                    <Plus className="h-6 w-6 text-gray-400" />
                                )}
                            </label>
                        </div>
                    </div>
                )}
                {!module && (
                    <p className="text-xs text-gray-500 italic">💡 Save first to upload media files</p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !formData.name.trim()}
                        className={`bg-gradient-to-r ${colors.bg}`}
                    >
                        {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-1" /> Save</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ============ TAG INPUT ============
function TagInput({ label, icon, items, onChange, placeholder, color }: {
    label: string;
    icon: React.ReactNode;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder: string;
    color: 'blue' | 'green' | 'orange';
}) {
    const [value, setValue] = useState('');

    const colorConfig = {
        blue: {
            bg: 'from-blue-50 to-blue-100/50',
            border: 'border-blue-200',
            iconBg: 'bg-blue-500',
            header: 'text-blue-900',
            subtext: 'text-blue-600',
            itemBg: 'bg-white/80 border-blue-100',
            bullet: 'text-blue-500',
        },
        green: {
            bg: 'from-emerald-50 to-emerald-100/50',
            border: 'border-emerald-200',
            iconBg: 'bg-emerald-500',
            header: 'text-emerald-900',
            subtext: 'text-emerald-600',
            itemBg: 'bg-white/80 border-emerald-100',
            bullet: 'text-emerald-500',
        },
        orange: {
            bg: 'from-orange-50 to-amber-100/50',
            border: 'border-orange-200',
            iconBg: 'bg-[#FF6B35]',
            header: 'text-orange-900',
            subtext: 'text-orange-600',
            itemBg: 'bg-white/80 border-orange-100',
            bullet: 'text-[#FF6B35]',
        },
    };

    const config = colorConfig[color];

    const handleAdd = () => {
        if (value.trim()) {
            onChange([...items, value.trim()]);
            setValue('');
        }
    };

    return (
        <div className={`bg-gradient-to-br ${config.bg} rounded-xl p-4 border ${config.border}`}>
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center text-white`}>
                    {icon}
                </div>
                <div>
                    <h4 className={`font-semibold ${config.header}`}>{label}</h4>
                    <p className={`text-xs ${config.subtext}`}>{items.length} added</p>
                </div>
            </div>

            {/* Add Input */}
            <div className="flex gap-1 mb-3">
                <Input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                    placeholder={placeholder}
                    className="text-sm bg-white/90"
                />
                <Button size="sm" variant="secondary" onClick={handleAdd} className="px-3">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Items List */}
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                {items.length === 0 && (
                    <p className={`text-sm ${config.subtext} italic`}>None added yet</p>
                )}
                {items.map((item, i) => (
                    <div key={i} className={`flex items-center justify-between ${config.itemBg} rounded-lg px-3 py-2 border`}>
                        <div className="flex items-center gap-2">
                            <span className={config.bullet}>
                                {color === 'blue' ? '•' : color === 'green' ? '✓' : '▸'}
                            </span>
                            <span className="text-sm text-gray-700">{item}</span>
                        </div>
                        <button
                            onClick={() => onChange(items.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============ CAREER CARD ============
function CareerCard({ career, colors, isEditing, onEdit, onClose, onUpdate }: {
    career: Career;
    colors: typeof pathwayColors[0];
    isEditing: boolean;
    onEdit: () => void;
    onClose: () => void;
    onUpdate: () => void;
}) {
    if (isEditing) {
        return (
            <CareerForm
                courseId={career.course}
                career={career}
                onClose={onClose}
                onSuccess={() => { onClose(); onUpdate(); }}
                colors={colors}
            />
        );
    }

    return (
        <div className={`p-4 rounded-xl border-2 ${colors.border} ${colors.light} group`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
                        <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">{career.title}</h4>
                        {career.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">{career.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button size="icon" variant="ghost" onClick={onEdit} className="h-7 w-7">
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:text-red-600"
                        onClick={async () => {
                            if (confirm(`Delete "${career.title}"?`)) {
                                await careerApi.delete(career.id);
                                onUpdate();
                            }
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============ CAREER FORM ============
function CareerForm({ courseId, career, onClose, onSuccess, colors }: {
    courseId: string;
    career?: Career;
    onClose: () => void;
    onSuccess: () => void;
    colors: typeof pathwayColors[0];
}) {
    const [formData, setFormData] = useState({
        title: career?.title || '',
        description: career?.description || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!formData.title.trim()) return;
        setSaving(true);
        try {
            if (career) {
                await careerApi.update(career.id, formData);
            } else {
                await careerApi.create({ ...formData, course: courseId });
            }
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`p-4 rounded-xl border-2 ${colors.border} bg-white`}>
            <div className="space-y-3">
                <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Career title..."
                    className="font-medium"
                />
                <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description..."
                    className="w-full p-2 rounded-lg border text-sm min-h-[60px]"
                />
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !formData.title.trim()}
                        className={`bg-gradient-to-r ${colors.bg}`}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { courseApi, moduleApi, careerApi } from "@/lib/api";
import {
    Plus, Edit, Trash2, Bot, Globe, ChevronRight,
    Briefcase, BookOpen, Layers, Save, X, Layout, FileText,
    Hammer, Lightbulb, GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types matching backend
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
}

interface Course {
    id: string;
    name: string;
    description: string;
    careers?: Career[];
    modules?: Module[];
}

export default function CurriculumDataEntry() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'careers'>('modules');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await courseApi.getAll();
            const data = res.data.results || res.data || [];
            setCourses(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateSuccess = (newId: string) => {
        setIsCreating(false);
        fetchCourses();
        loadCourseDetails(newId);
    };

    const handleUpdate = () => {
        if (selectedCourse) loadCourseDetails(selectedCourse.id);
        fetchCourses(); // to update sidebar name if changed
    };

    const handleDelete = async () => {
        if (!selectedCourse || !confirm(`Delete pathway "${selectedCourse.name}"? This cannot be undone.`)) return;
        try {
            await courseApi.delete(selectedCourse.id);
            setSelectedCourse(null);
            fetchCourses();
        } catch (err) { console.error(err); }
    };

    const loadCourseDetails = async (courseId: string) => {
        try {
            // Fetch full details including modules and careers (if backend supports nested)
            // If not, fetch separately. My CourseSerializer DOES include them.
            const res = await courseApi.getById(courseId);
            setSelectedCourse(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50/50">
            {/* Sidebar: Pathways */}
            <div className="w-80 border-r bg-white overflow-y-auto flex flex-col">
                <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Layout className="h-5 w-5 text-indigo-600" />
                        Pathways
                    </h2>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setIsCreating(true); setSelectedCourse(null); }}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-2 space-y-1">
                    {courses.map(course => (
                        <button
                            key={course.id}
                            onClick={() => loadCourseDetails(course.id)}
                            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedCourse?.id === course.id
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            <div className={`p-2 rounded-md ${selectedCourse?.id === course.id ? 'bg-indigo-100' : 'bg-gray-100'
                                }`}>
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="flex-1 truncate">
                                <div className="truncate">{course.name}</div>
                                <div className="text-xs text-gray-400 font-normal">
                                    <div className="text-xs text-gray-400 font-normal">
                                        Pathway
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 opacity-50 ${selectedCourse?.id === course.id ? 'opacity-100' : ''
                                }`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {selectedCourse ? (
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{selectedCourse.name}</h1>
                                <p className="text-gray-500 mt-1">{selectedCourse.description || 'No description provided.'}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b flex gap-6">
                            <TabButton
                                active={activeTab === 'overview'}
                                onClick={() => setActiveTab('overview')}
                                icon={<Layout className="h-4 w-4" />}
                                label="Overview"
                            />
                            <TabButton
                                active={activeTab === 'modules'}
                                onClick={() => setActiveTab('modules')}
                                icon={<BookOpen className="h-4 w-4" />}
                                label="Micro-credentials"
                            />
                            <TabButton
                                active={activeTab === 'careers'}
                                onClick={() => setActiveTab('careers')}
                                icon={<Briefcase className="h-4 w-4" />}
                                label="Potential Careers"
                            />
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[500px]">
                            <AnimatePresence mode="wait">
                                {activeTab === 'modules' && (
                                    <ModulesManager
                                        key="modules"
                                        courseId={selectedCourse.id}
                                        initialModules={selectedCourse.modules || []}
                                        onUpdate={() => loadCourseDetails(selectedCourse.id)}
                                    />
                                )}
                                {activeTab === 'careers' && (
                                    <CareersManager
                                        key="careers"
                                        courseId={selectedCourse.id}
                                        initialCareers={selectedCourse.careers || []}
                                        onUpdate={() => loadCourseDetails(selectedCourse.id)}
                                    />
                                )}
                                {activeTab === 'overview' && (
                                    <OverviewEditor course={selectedCourse} onUpdate={handleUpdate} onDelete={handleDelete} />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        {isCreating ? (
                            <div className="w-full max-w-lg">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Create New Pathway</CardTitle>
                                        <CardDescription>Start a new learning track</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <PathwayForm onClose={() => setIsCreating(false)} onSuccess={handleCreateSuccess} />
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <>
                                <Layout className="h-16 w-16 mb-4 opacity-20" />
                                <p>Select a pathway to start editing</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function OverviewEditor({ course, onUpdate, onDelete }: { course: Course, onUpdate: () => void, onDelete: () => void }) {
    const [editing, setEditing] = useState(false);

    const totalModules = course.modules?.length || 0;
    const totalCareers = course.careers?.length || 0;
    const totalActivities = course.modules?.reduce((sum, m) => sum + (Array.isArray(m.suggested_activities) ? m.suggested_activities.length : 0), 0) || 0;
    const totalMaterials = course.modules?.reduce((sum, m) => sum + (Array.isArray(m.materials) ? m.materials.length : 0), 0) || 0;
    const totalCompetences = course.modules?.reduce((sum, m) => sum + (Array.isArray(m.competences) ? m.competences.length : 0), 0) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {editing ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Pathway Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PathwayForm
                            initialData={course}
                            onClose={() => setEditing(false)}
                            onSuccess={() => { setEditing(false); onUpdate(); }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{totalModules}</p>
                                        <p className="text-xs text-gray-500">Micro-credentials</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <Briefcase className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{totalCareers}</p>
                                        <p className="text-xs text-gray-500">Career Paths</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <Lightbulb className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{totalActivities}</p>
                                        <p className="text-xs text-gray-500">Activities</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <GraduationCap className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{totalCompetences}</p>
                                        <p className="text-xs text-gray-500">Competences</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pathway Details */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Pathway Information</CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={onDelete}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-500">Name</Label>
                                <p className="text-lg font-semibold">{course.name}</p>
                            </div>
                            <div>
                                <Label className="text-gray-500">Description</Label>
                                <p className="text-gray-700">{course.description || 'No description provided.'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Micro-credentials</h3>
                                        <p className="text-sm text-gray-500">Manage learning modules and content</p>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Career Paths</h3>
                                        <p className="text-sm text-gray-500">Define potential career outcomes</p>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </motion.div>
    );
}

function PathwayForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: (id: string) => void, initialData?: Course }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            let res;
            if (initialData) {
                res = await courseApi.update(initialData.id, formData);
            } else {
                res = await courseApi.create(formData);
            }
            onSuccess(res.data.id);
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Pathway Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Advanced Robotics" />
            </div>
            <div className="grid gap-2">
                <Label>Description</Label>
                <textarea className="w-full min-h-[80px] p-3 rounded-md border text-sm" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Pathway'}</Button>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${active
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}

// --- Modules Manager ---

function ModulesManager({ courseId, initialModules, onUpdate }: { courseId: string, initialModules: Module[], onUpdate: () => void }) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingModule, setEditingModule] = useState<Module | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const handleEdit = async (moduleId: string) => {
        setLoading(true);
        try {
            // Fetch full module data from API
            const res = await moduleApi.getById(moduleId);
            console.log('Fetched module for editing:', res.data);
            setEditingModule(res.data);
            setEditingId(moduleId);
        } catch (err) {
            console.error('Error fetching module:', err);
            // Fallback to using the module from initialModules
            const module = initialModules.find(m => m.id === moduleId);
            setEditingModule(module);
            setEditingId(moduleId);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseEdit = () => {
        setEditingId(null);
        setEditingModule(undefined);
    };

    const handleDelete = async (moduleId: string, moduleName: string) => {
        if (!confirm(`Delete micro-credential "${moduleName}"?`)) return;
        try {
            await moduleApi.delete(moduleId);
            onUpdate();
        } catch (err) {
            console.error('Error deleting module:', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Micro-credentials</h3>
                <Button onClick={() => setEditingId('new')} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Micro-credential
                </Button>
            </div>

            {editingId === 'new' && (
                <ModuleEditor courseId={courseId} onClose={handleCloseEdit} onSuccess={() => { handleCloseEdit(); onUpdate(); }} />
            )}

            <div className="grid gap-4">
                {initialModules.length === 0 && editingId !== 'new' && (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-400">
                        No micro-credentials added yet.
                    </div>
                )}
                {initialModules.map(module => (
                    <Card key={module.id} className="group hover:border-indigo-200 transition-colors">
                        {editingId === module.id ? (
                            <CardContent className="p-6">
                                {loading ? (
                                    <div className="text-center py-8">Loading...</div>
                                ) : (
                                    <ModuleEditor
                                        courseId={courseId}
                                        module={editingModule}
                                        onClose={handleCloseEdit}
                                        onSuccess={() => { handleCloseEdit(); onUpdate(); }}
                                    />
                                )}
                            </CardContent>
                        ) : (
                            <CardContent className="p-4 flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                    <div className="font-semibold text-lg flex items-center gap-2">
                                        {module.name}
                                    </div>
                                    {module.description && (
                                        <p className="text-gray-500 text-sm line-clamp-2">{module.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {Array.isArray(module.suggested_activities) && module.suggested_activities.length > 0 && (
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Lightbulb className="h-3 w-3" /> {module.suggested_activities.length} Activities
                                            </span>
                                        )}
                                        {Array.isArray(module.materials) && module.materials.length > 0 && (
                                            <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Hammer className="h-3 w-3" /> {module.materials.length} Materials
                                            </span>
                                        )}
                                        {Array.isArray(module.competences) && module.competences.length > 0 && (
                                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <GraduationCap className="h-3 w-3" /> {module.competences.length} Competences
                                            </span>
                                        )}
                                        {Array.isArray(module.media_files) && module.media_files.length > 0 && (
                                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                📁 {module.media_files.length} Media Files
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(module.id)}>
                                        <Edit className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="hover:text-red-600" onClick={() => handleDelete(module.id, module.name)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </motion.div>
    );
}

function ListInput({ label, items, onChange, placeholder }: { label: string, items: string[], onChange: (items: string[]) => void, placeholder?: string }) {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (!newItem.trim()) return;
        const updatedItems = [...items, newItem.trim()];
        console.log(`Adding item to ${label}:`, newItem.trim(), 'Updated array:', updatedItems);
        onChange(updatedItems);
        setNewItem('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const remove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Input
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Add item..."}
                />
                <Button type="button" onClick={handleAdd} variant="secondary">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
                {items.map((item, i) => (
                    <div key={i} className="bg-white border rounded-md px-3 py-1 text-sm flex items-center gap-2 shadow-sm">
                        <span>{item}</span>
                        <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ModuleEditor({ courseId, module, onClose, onSuccess }: { courseId: string, module?: Module, onClose: () => void, onSuccess: () => void }) {
    // Helper to ensure we always get an array
    const ensureArray = (value: any): string[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value.trim()) {
            // Handle legacy text data by splitting on newlines
            return value.split('\n').map(s => s.trim()).filter(s => s);
        }
        return [];
    };

    const [formData, setFormData] = useState({
        name: module?.name || '',
        description: module?.description || '',
        content: module?.content || '',
        suggested_activities: ensureArray(module?.suggested_activities),
        materials: ensureArray(module?.materials),
        competences: ensureArray(module?.competences),
    });
    const [saving, setSaving] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(module?.media_files || []);
    const [uploading, setUploading] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Ensure arrays are properly formatted
            const dataToSave = {
                ...formData,
                suggested_activities: Array.isArray(formData.suggested_activities) ? formData.suggested_activities : [],
                materials: Array.isArray(formData.materials) ? formData.materials : [],
                competences: Array.isArray(formData.competences) ? formData.competences : [],
            };

            console.log('=== SAVE DEBUG ===');
            console.log('Current formData:', JSON.stringify(formData, null, 2));
            console.log('Data to save:', JSON.stringify(dataToSave, null, 2));
            console.log('==================');

            if (module) {
                const response = await moduleApi.update(module.id, dataToSave);
                console.log('Update response:', response.data);
            } else {
                const response = await moduleApi.create({ ...dataToSave, course: courseId });
                console.log('Create response:', response.data);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!module?.id) {
            alert('Please save the module first before uploading media.');
            return;
        }
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                console.log('Uploading file:', file.name, 'to module:', module.id);
                const res = await moduleApi.uploadMedia(module.id, file);
                console.log('Upload response:', res.data);
                setMediaFiles(res.data.media_files || []);
            }
            // Don't call onSuccess() here - let user continue editing
        } catch (err: any) {
            console.error('Upload error:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);

            if (err.response?.status === 401) {
                alert('Session expired. Please log in again.');
                window.location.href = '/login';
            } else {
                alert(err.response?.data?.error || `Upload failed: ${err.message}`);
            }
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDeleteMedia = async (mediaId: string) => {
        if (!module?.id || !confirm('Delete this media file?')) return;
        try {
            const res = await moduleApi.deleteMedia(module.id, mediaId);
            setMediaFiles(res.data.media_files || []);
            onSuccess();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-indigo-600">{module ? 'Edit Micro-credential' : 'New Micro-credential'}</h4>
                <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label htmlFor="name">Title</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Intro to Sensors"
                    />
                </div>
                {/*  <div className="col-span-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input
                        id="desc"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief summary..."
                    />
                </div> */}

                {/* Detailed Fields */}
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="content">Content (Text)</Label>
                    <textarea
                        className="w-full min-h-[120px] p-3 rounded-md border text-sm"
                        placeholder="Text content here..."
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                    />
                </div>

                {/* Media Upload Section */}
                <div className="col-span-2 space-y-3">
                    <Label>Media Files (Images & Videos)</Label>

                    {/* Existing Media */}
                    {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {mediaFiles.map((media) => {
                                // Handle relative URLs by prepending API base URL
                                const mediaUrl = media.url.startsWith('http')
                                    ? media.url
                                    : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${media.url}`;

                                return (
                                    <div key={media.id} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                                        {media.type === 'image' ? (
                                            <img
                                                src={mediaUrl}
                                                alt={media.name}
                                                className="w-full h-32 object-cover"
                                            />
                                        ) : (
                                            <video
                                                src={mediaUrl}
                                                className="w-full h-32 object-cover"
                                                controls
                                            />
                                        )}
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white border-0"
                                                onClick={() => handleDeleteMedia(media.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="p-1.5 text-xs truncate text-gray-600 bg-white/90">
                                            {media.type === 'video' ? '🎥' : '🖼️'} {media.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Upload Area */}
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="media-upload"
                            disabled={!module?.id || uploading}
                        />
                        <label
                            htmlFor="media-upload"
                            className={`cursor-pointer ${!module?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {uploading ? (
                                <span className="text-indigo-600">Uploading...</span>
                            ) : (
                                <>
                                    <Plus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">
                                        {module?.id ? 'Click to upload images or videos' : 'Save module first to upload media'}
                                    </span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="col-span-2 space-y-4 pt-2 border-t">
                    <ListInput
                        label="Suggested Activities"
                        items={formData.suggested_activities}
                        onChange={items => setFormData({ ...formData, suggested_activities: items })}
                        placeholder="Add activity (e.g. Build a paper prototype)"
                    />

                    <ListInput
                        label="Competences / Skills"
                        items={formData.competences}
                        onChange={items => setFormData({ ...formData, competences: items })}
                        placeholder="Add competence (e.g. Critical Thinking)"
                    />

                    <ListInput
                        label="Materials Needed"
                        items={formData.materials}
                        onChange={items => setFormData({ ...formData, materials: items })}
                        placeholder="Add material (e.g. Cardboard, Glue)"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}

// --- Careers Manager ---

function CareersManager({ courseId, initialCareers, onUpdate }: { courseId: string, initialCareers: Career[], onUpdate: () => void }) {
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const handleCreate = async () => {
        try {
            await careerApi.create({ title: newTitle, description: newDesc, course: courseId });
            setNewTitle('');
            setNewDesc('');
            onUpdate();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete career?")) return;
        try {
            await careerApi.delete(id);
            onUpdate();
        } catch (err) { console.error(err); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 max-w-2xl"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Potential Careers</h3>
            </div>

            {/* Simple Add Form */}
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="p-4 space-y-3">
                    <Input
                        placeholder="Add new career title (e.g. Robotics Engineer)"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                    />
                    {newTitle && (
                        <div className="space-y-3">
                            <textarea
                                className="w-full min-h-[60px] p-2 rounded-md border text-sm"
                                placeholder="Description (optional)"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                            />
                            <Button size="sm" onClick={handleCreate}>Add Career</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-2">
                {initialCareers.map(career => (
                    <div key={career.id} className="bg-white p-3 rounded-lg border flex items-center justify-between group">
                        <div>
                            <div className="font-medium">{career.title}</div>
                            {career.description && <div className="text-sm text-gray-500">{career.description}</div>}
                        </div>
                        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 hover:text-red-600" onClick={() => handleDelete(career.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

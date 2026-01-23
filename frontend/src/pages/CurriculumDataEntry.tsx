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
                <ModuleEditor courseId={courseId} onClose={() => setEditingId(null)} onSuccess={onUpdate} />
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
                                <ModuleEditor
                                    courseId={courseId}
                                    module={module}
                                    onClose={() => setEditingId(null)}
                                    onSuccess={onUpdate}
                                />
                            </CardContent>
                        ) : (
                            <CardContent className="p-4 flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="font-semibold text-lg flex items-center gap-2">
                                        {module.name}
                                    </div>
                                    <p className="text-gray-500 text-sm line-clamp-2">{module.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {module.suggested_activities && (
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Lightbulb className="h-3 w-3" /> Activities
                                            </span>
                                        )}
                                        {module.materials && (
                                            <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Hammer className="h-3 w-3" /> Materials
                                            </span>
                                        )}
                                        {module.competences && (
                                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <GraduationCap className="h-3 w-3" /> Competences
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" onClick={() => setEditingId(module.id)}>
                                        <Edit className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="hover:text-red-600">
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
        onChange([...items, newItem.trim()]);
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
                <Button type="button" onClick={handleAdd} variant="outline">Add</Button>
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
    const [formData, setFormData] = useState({
        name: module?.name || '',
        description: module?.description || '',
        content: module?.content || '',
        suggested_activities: (module?.suggested_activities || []) as string[],
        materials: (module?.materials || []) as string[],
        competences: (module?.competences || []) as string[],
    });
    const [saving, setSaving] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(module?.media_files || []);
    const [uploading, setUploading] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            console.log('Saving module payload:', formData);
            if (module) {
                await moduleApi.update(module.id, formData);
            } else {
                await moduleApi.create({ ...formData, course: courseId });
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
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
                const res = await moduleApi.uploadMedia(module.id, file);
                setMediaFiles(res.data.media_files || []);
            }
            onSuccess(); // Refresh parent
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Upload failed');
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
                            {mediaFiles.map((media) => (
                                <div key={media.id} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                                    {media.type === 'image' ? (
                                        <img
                                            src={media.url}
                                            alt={media.name}
                                            className="w-full h-24 object-cover"
                                        />
                                    ) : (
                                        <video
                                            src={media.url}
                                            className="w-full h-24 object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white border-0"
                                            onClick={() => handleDeleteMedia(media.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="p-1.5 text-xs truncate text-gray-600">
                                        {media.type === 'video' ? '🎥' : '🖼️'} {media.name}
                                    </div>
                                </div>
                            ))}
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

function OverviewEditor({ course, onUpdate, onDelete }: { course: Course, onUpdate: () => void, onDelete: () => void }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <Card>
                <CardContent className="p-6">
                    <PathwayForm
                        initialData={course}
                        onClose={() => setIsEditing(false)}
                        onSuccess={() => { setIsEditing(false); onUpdate(); }}
                    />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="max-w-xl space-y-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Details
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
            </div>

            <div className="grid gap-2">
                <Label>Pathway Name</Label>
                <div className="p-3 bg-gray-50 rounded border font-medium">{course.name}</div>
            </div>

            <div className="grid gap-2">
                <Label>Description</Label>
                <div className="p-3 bg-gray-50 rounded border min-h-[100px]">{course.description}</div>
            </div>
        </div>
    )
}

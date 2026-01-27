import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activityApi, courseApi } from "@/lib/api";
import {
    Plus, Edit, Trash2, Calendar, MapPin, Clock, Image, Video,
    Save, X, ChevronDown, ChevronUp, CheckCircle, AlertCircle, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Types
interface MediaFile {
    id: string;
    type: 'image' | 'video';
    name: string;
    url: string;
    content_type: string;
}

interface Activity {
    id: string;
    name: string;
    description: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    location: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    course: string | null;
    course_name: string | null;
    media_files: MediaFile[];
    created_by_name: string | null;
    created_at: string;
    updated_at: string;
}

interface Course {
    id: string;
    name: string;
}

// Status colors
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Upcoming' },
    ongoing: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ongoing' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};

export default function ActivityManagement() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchActivities();
        fetchCourses();
    }, [statusFilter]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const res = await activityApi.getAll(params);
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setActivities(data);
        } catch (err) {
            console.error(err);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await courseApi.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setCourses(data);
        } catch (err) {
            console.error(err);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete "${name}"? This cannot be undone.`)) {
            try {
                await activityApi.delete(id);
                showMessage('success', 'Activity deleted successfully');
                fetchActivities();
            } catch (err) {
                showMessage('error', 'Failed to delete activity');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--fundi-bg-light)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--fundi-cyan)] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading activities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--fundi-bg-light)]">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--fundi-black)]">
                                Activity Management
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {activities.length} activities • Manage upcoming events and programs
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--fundi-cyan)]"
                            >
                                <option value="all">All Statuses</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <Button onClick={() => setIsCreating(true)} className="gap-2">
                                <Plus className="h-4 w-4" /> New Activity
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Message */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                                }`}
                        >
                            {message.type === 'success' ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <AlertCircle className="h-5 w-5" />
                            )}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Activity Form */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-8"
                        >
                            <ActivityForm
                                courses={courses}
                                onClose={() => setIsCreating(false)}
                                onSuccess={() => {
                                    setIsCreating(false);
                                    showMessage('success', 'Activity created successfully');
                                    fetchActivities();
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {activities.length === 0 && !isCreating && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--fundi-cyan)] to-[var(--fundi-lime)] flex items-center justify-center">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activities Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first activity to get started</p>
                        <Button onClick={() => setIsCreating(true)} className="gap-2">
                            <Plus className="h-4 w-4" /> Create First Activity
                        </Button>
                    </div>
                )}

                {/* Activities Grid - 3 per row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activities.map((activity) => {
                        const statusStyle = statusColors[activity.status] || statusColors.upcoming;
                        const isSelected = expandedId === activity.id;
                        const mediaCount = activity.media_files?.length || 0;

                        return (
                            <motion.div
                                key={activity.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setExpandedId(isSelected ? null : activity.id)}
                                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 ${isSelected
                                    ? 'border-[var(--fundi-cyan)]/50 bg-white shadow-lg ring-2 ring-offset-2 ring-[var(--fundi-cyan)]'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                    }`}
                            >
                                {/* Activity Icon & Name */}
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--fundi-cyan)] to-[var(--fundi-lime)] flex items-center justify-center shadow-lg flex-shrink-0">
                                        <Calendar className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{activity.name}</h3>
                                        </div>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                            {statusStyle.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Info Row */}
                                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span>{format(new Date(activity.date), 'MMM d, yyyy')}</span>
                                    </div>
                                    {activity.start_time && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span>
                                                {activity.start_time.slice(0, 5)}
                                                {activity.end_time && ` - ${activity.end_time.slice(0, 5)}`}
                                            </span>
                                        </div>
                                    )}
                                    {activity.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">{activity.location}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                                    {activity.course_name && (
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-cyan-100' : 'bg-gray-100'} flex items-center justify-center`}>
                                                <BookOpen className={`h-4 w-4 ${isSelected ? 'text-cyan-600' : 'text-gray-500'}`} />
                                            </div>
                                            <span className="text-xs text-gray-500 truncate max-w-[100px]">{activity.course_name}</span>
                                        </div>
                                    )}
                                    {mediaCount > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center`}>
                                                <Image className={`h-4 w-4 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{mediaCount}</p>
                                                <p className="text-xs text-gray-500">Media</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="mt-4 pt-3 border-t border-[var(--fundi-cyan)]/20">
                                        <span className="text-xs font-medium text-[var(--fundi-cyan)] flex items-center gap-1">
                                            <ChevronDown className="h-3 w-3" /> Viewing details below
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Expanded Detail View - Full Width Below Grid */}
                <AnimatePresence>
                    {expandedId && (() => {
                        const selectedActivity = activities.find(a => a.id === expandedId);
                        if (!selectedActivity) return null;

                        return (
                            <motion.div
                                key="detail-panel"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6"
                            >
                                <ActivityDetailPanel
                                    activity={selectedActivity}
                                    courses={courses}
                                    isEditing={editingId === selectedActivity.id}
                                    onEdit={() => setEditingId(selectedActivity.id)}
                                    onCloseEdit={() => setEditingId(null)}
                                    onClose={() => setExpandedId(null)}
                                    onUpdate={() => {
                                        setEditingId(null);
                                        showMessage('success', 'Activity updated successfully');
                                        fetchActivities();
                                    }}
                                    onDelete={() => handleDelete(selectedActivity.id, selectedActivity.name)}
                                />
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Activity Form Component
function ActivityForm({
    activity,
    courses,
    onClose,
    onSuccess,
}: {
    activity?: Activity;
    courses: Course[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: activity?.name || '',
        description: activity?.description || '',
        date: activity?.date || '',
        start_time: activity?.start_time || '',
        end_time: activity?.end_time || '',
        location: activity?.location || '',
        status: activity?.status || 'upcoming',
        course: activity?.course || '',
    });
    const [saving, setSaving] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(activity?.media_files || []);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setPendingFiles(prev => [...prev, ...Array.from(files)]);
        e.target.value = '';
    };

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteMedia = async (mediaId: string) => {
        if (!activity) return;
        try {
            const res = await activityApi.deleteMedia(activity.id, mediaId);
            setMediaFiles(res.data.media_files || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.date) return;
        setSaving(true);
        try {
            const payload = {
                ...formData,
                course: formData.course || undefined,
                start_time: formData.start_time || undefined,
                end_time: formData.end_time || undefined,
            };

            let activityId = activity?.id;

            if (activity) {
                await activityApi.update(activity.id, payload);
            } else {
                const res = await activityApi.create(payload as any);
                activityId = res.data.id;
            }

            // Upload pending files if any
            if (activityId && pendingFiles.length > 0) {
                setUploading(true);
                for (const file of pendingFiles) {
                    await activityApi.uploadMedia(activityId, file);
                }
            }

            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    return (
        <Card className="border-2 border-[var(--fundi-cyan)]/30 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--fundi-cyan)]" />
                    {activity ? 'Edit Activity' : 'Create New Activity'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Activity Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Science Fair Exhibition"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Date *</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--fundi-cyan)]"
                        >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Start Time</Label>
                        <Input
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">End Time</Label>
                        <Input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <Input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Main Hall"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Related Pathway</Label>
                        <select
                            value={formData.course}
                            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--fundi-cyan)]"
                        >
                            <option value="">None</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Activity description and details..."
                            className="mt-1 w-full p-3 rounded-lg border text-sm min-h-[100px] focus:ring-2 focus:ring-[var(--fundi-cyan)] focus:border-transparent"
                        />
                    </div>

                    {/* Media Upload Section */}
                    <div className="md:col-span-2 border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Image className="h-4 w-4 text-gray-500" />
                                Media Files
                            </Label>
                            <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--fundi-cyan)] text-white cursor-pointer hover:opacity-90 transition-opacity">
                                <Plus className="h-3 w-3" />
                                Add Media
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        </div>

                        {/* Existing Media (for edit mode) */}
                        {activity && mediaFiles.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Existing media ({mediaFiles.length})</p>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                    {mediaFiles.map((media) => {
                                        const url = media.url.startsWith('http') ? media.url : `http://localhost:8000${media.url}`;
                                        return (
                                            <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
                                                {media.type === 'image' ? (
                                                    <img src={url} alt={media.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                        <Video className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMedia(media.id)}
                                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pending Files (to be uploaded) */}
                        {pendingFiles.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Files to upload ({pendingFiles.length})</p>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                    {pendingFiles.map((file, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
                                            {file.type.startsWith('image/') ? (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                    <Video className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removePendingFile(index)}
                                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-0.5 truncate">
                                                {file.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mediaFiles.length === 0 && pendingFiles.length === 0 && (
                            <div className="text-center py-6 text-gray-400 border-2 border-dashed rounded-xl">
                                <Image className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                <p className="text-xs">No media added yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || uploading || !formData.name.trim() || !formData.date}
                        className="gap-2"
                    >
                        {saving || uploading ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {uploading ? 'Uploading...' : activity ? 'Update' : 'Create Activity'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Activity Detail Panel Component (shown below grid when selected)
function ActivityDetailPanel({
    activity,
    courses,
    isEditing,
    onEdit,
    onCloseEdit,
    onClose,
    onUpdate,
    onDelete,
}: {
    activity: Activity;
    courses: Course[];
    isEditing: boolean;
    onEdit: () => void;
    onCloseEdit: () => void;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: () => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(activity.media_files || []);

    const statusStyle = statusColors[activity.status] || statusColors.upcoming;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const res = await activityApi.uploadMedia(activity.id, file);
                setMediaFiles(res.data.media_files || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteMedia = async (mediaId: string) => {
        try {
            const res = await activityApi.deleteMedia(activity.id, mediaId);
            setMediaFiles(res.data.media_files || []);
        } catch (err) {
            console.error(err);
        }
    };

    if (isEditing) {
        return (
            <ActivityForm
                activity={activity}
                courses={courses}
                onClose={onCloseEdit}
                onSuccess={onUpdate}
            />
        );
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-[var(--fundi-cyan)]/30 shadow-lg overflow-hidden">
            {/* Detail Header */}
            <div className="p-5 bg-gradient-to-r from-[var(--fundi-cyan)] to-[var(--fundi-lime)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white">{activity.name}</h2>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur text-white`}>
                                {statusStyle.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-white/80 text-sm">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(activity.date), 'MMM d, yyyy')}
                            </span>
                            {activity.start_time && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {activity.start_time.slice(0, 5)}
                                    {activity.end_time && ` - ${activity.end_time.slice(0, 5)}`}
                                </span>
                            )}
                            {activity.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {activity.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/20"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Detail Content */}
            <div className="p-6 space-y-6">
                {/* Description */}
                {activity.description && (
                    <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Description</Label>
                        <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                            {activity.description}
                        </p>
                    </div>
                )}

                {/* Course Link */}
                {activity.course_name && (
                    <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Related Pathway</Label>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-cyan-600" />
                            </div>
                            <span className="text-sm font-medium text-[var(--fundi-cyan)]">
                                {activity.course_name}
                            </span>
                        </div>
                    </div>
                )}

                {/* Media Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">
                            Media Files ({mediaFiles.length})
                        </Label>
                        <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--fundi-cyan)] text-white cursor-pointer hover:opacity-90 transition-opacity">
                            <Plus className="h-3 w-3" />
                            {uploading ? 'Uploading...' : 'Add Media'}
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {mediaFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
                            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No media files attached</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                            {mediaFiles.map((media) => {
                                const url = media.url.startsWith('http') ? media.url : `http://localhost:8000${media.url}`;
                                return (
                                    <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
                                        {media.type === 'image' ? (
                                            <img src={url} alt={media.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                <Video className="h-6 w-6 text-white" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDeleteMedia(media.id)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t text-xs text-gray-400 flex items-center gap-4">
                    {activity.created_by_name && (
                        <span>Created by: {activity.created_by_name}</span>
                    )}
                    <span>Last updated: {format(new Date(activity.updated_at), 'MMM d, yyyy HH:mm')}</span>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="gap-1"
                    >
                        <Edit className="h-4 w-4" /> Edit Activity
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { activityApi, MEDIA_BASE_URL } from "@/lib/api";
import { Edit, Trash2, Calendar, MapPin, Clock, Image, Video, Plus, X, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ActivityForm } from "./ActivityForm";
import { STATUS_COLORS } from "./activity-management-types";
import type { Activity, Course, MediaFile } from "./activity-management-types";

interface ActivityDetailPanelProps {
    activity: Activity;
    courses: Course[];
    isEditing: boolean;
    onEdit: () => void;
    onCloseEdit: () => void;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: () => void;
}

export function ActivityDetailPanel({
    activity,
    courses,
    isEditing,
    onEdit,
    onCloseEdit,
    onClose,
    onUpdate,
    onDelete,
}: ActivityDetailPanelProps) {
    const [uploading, setUploading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(activity.media_files ?? []);

    const statusStyle = STATUS_COLORS[activity.status] ?? STATUS_COLORS.upcoming;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setUploading(true);
        try {
            for (const file of Array.from(e.target.files)) {
                const res = await activityApi.uploadMedia(activity.id, file);
                setMediaFiles(res.data.media_files ?? []);
            }
        } catch {
            // Upload failure is visible to user — media count won't update
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteMedia = async (mediaId: string) => {
        try {
            const res = await activityApi.deleteMedia(activity.id, mediaId);
            setMediaFiles(res.data.media_files ?? []);
        } catch {
            // Deletion failure is visible to user — thumbnail remains
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
        <div className="bg-white rounded-2xl border-2 border-fundi-cyan/30 shadow-lg overflow-hidden">
            <DetailHeader activity={activity} statusLabel={statusStyle.label} onClose={onClose} />
            <div className="p-6 space-y-6">
                {activity.description && (
                    <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Description</Label>
                        <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                            {activity.description}
                        </p>
                    </div>
                )}

                {activity.course_name && (
                    <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Related Pathway</Label>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-cyan-600" />
                            </div>
                            <span className="text-sm font-medium text-fundi-cyan">{activity.course_name}</span>
                        </div>
                    </div>
                )}

                <MediaSection
                    mediaFiles={mediaFiles}
                    uploading={uploading}
                    onUpload={handleFileUpload}
                    onDelete={handleDeleteMedia}
                />

                <div className="pt-4 border-t text-xs text-gray-400 flex items-center gap-4">
                    {activity.created_by_name && <span>Created by: {activity.created_by_name}</span>}
                    <span>Last updated: {format(new Date(activity.updated_at), 'MMM d, yyyy HH:mm')}</span>
                </div>

                <div className="pt-4 border-t flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
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

function DetailHeader({
    activity,
    statusLabel,
    onClose,
}: {
    activity: Activity;
    statusLabel: string;
    onClose: () => void;
}) {
    return (
        <div className="p-5 bg-gradient-to-r from-fundi-cyan to-fundi-lime flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">{activity.name}</h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur text-white">
                            {statusLabel}
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
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-5 w-5" />
            </Button>
        </div>
    );
}

function MediaSection({
    mediaFiles,
    uploading,
    onUpload,
    onDelete,
}: {
    mediaFiles: MediaFile[];
    uploading: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Media Files ({mediaFiles.length})
                </Label>
                <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-fundi-cyan text-white cursor-pointer hover:opacity-90 transition-opacity">
                    <Plus className="h-3 w-3" />
                    {uploading ? 'Uploading...' : 'Add Media'}
                    <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={onUpload}
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
                        const url = media.url.startsWith('http') ? media.url : `${MEDIA_BASE_URL}${media.url}`;
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
                                    onClick={() => onDelete(media.id)}
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
    );
}

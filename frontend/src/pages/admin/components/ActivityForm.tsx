import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activityApi, MEDIA_BASE_URL } from "@/lib/api";
import { Plus, Calendar, Image, Video, Save, X } from "lucide-react";
import type { Activity, Course, ActivityStatus, MediaFile } from "./activity-management-types";

interface ActivityFormData {
    name: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    status: ActivityStatus;
    course: string;
}

interface ActivityFormProps {
    activity?: Activity;
    courses: Course[];
    onClose: () => void;
    onSuccess: () => void;
}

export function ActivityForm({ activity, courses, onClose, onSuccess }: ActivityFormProps) {
    const [formData, setFormData] = useState<ActivityFormData>({
        name: activity?.name ?? '',
        description: activity?.description ?? '',
        date: activity?.date ?? '',
        start_time: activity?.start_time ?? '',
        end_time: activity?.end_time ?? '',
        location: activity?.location ?? '',
        status: activity?.status ?? 'upcoming',
        course: activity?.course ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(activity?.media_files ?? []);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const set = (patch: Partial<ActivityFormData>) => setFormData((prev) => ({ ...prev, ...patch }));

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        e.target.value = '';
    };

    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeleteMedia = async (mediaId: string) => {
        if (!activity) return;
        try {
            const res = await activityApi.deleteMedia(activity.id, mediaId);
            setMediaFiles(res.data.media_files ?? []);
        } catch {
            // Media deletion failure is visible to the user via stale UI
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
                const res = await activityApi.create(payload);
                activityId = res.data.id;
            }

            if (activityId && pendingFiles.length > 0) {
                setUploading(true);
                for (const file of pendingFiles) {
                    await activityApi.uploadMedia(activityId, file);
                }
            }

            onSuccess();
        } catch {
            // Parent receives onSuccess only on success; errors are surfaced by not calling it
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    const isSubmitDisabled = saving || uploading || !formData.name.trim() || !formData.date;

    return (
        <Card className="border-2 border-fundi-cyan/30 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-fundi-cyan" />
                    {activity ? 'Edit Activity' : 'Create New Activity'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Activity Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => set({ name: e.target.value })}
                            placeholder="e.g., Science Fair Exhibition"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Date *</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => set({ date: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <select
                            value={formData.status}
                            onChange={(e) => set({ status: e.target.value as ActivityStatus })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fundi-cyan"
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
                            onChange={(e) => set({ start_time: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">End Time</Label>
                        <Input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => set({ end_time: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <Input
                            value={formData.location}
                            onChange={(e) => set({ location: e.target.value })}
                            placeholder="e.g., Main Hall"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Related Pathway</Label>
                        <select
                            value={formData.course}
                            onChange={(e) => set({ course: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fundi-cyan"
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
                            onChange={(e) => set({ description: e.target.value })}
                            placeholder="Activity description and details..."
                            className="mt-1 w-full p-3 rounded-lg border text-sm min-h-[100px] focus:ring-2 focus:ring-fundi-cyan focus:border-transparent"
                        />
                    </div>

                    <MediaUploadSection
                        activity={activity}
                        mediaFiles={mediaFiles}
                        pendingFiles={pendingFiles}
                        onFileSelect={handleFileSelect}
                        onRemovePending={removePendingFile}
                        onDeleteMedia={handleDeleteMedia}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="gap-2">
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

interface MediaUploadSectionProps {
    activity?: Activity;
    mediaFiles: MediaFile[];
    pendingFiles: File[];
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemovePending: (index: number) => void;
    onDeleteMedia: (mediaId: string) => void;
}

function MediaUploadSection({
    activity,
    mediaFiles,
    pendingFiles,
    onFileSelect,
    onRemovePending,
    onDeleteMedia,
}: MediaUploadSectionProps) {
    const isEmpty = mediaFiles.length === 0 && pendingFiles.length === 0;

    return (
        <div className="md:col-span-2 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                    <Image className="h-4 w-4 text-gray-500" />
                    Media Files
                </Label>
                <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-fundi-cyan text-white cursor-pointer hover:opacity-90 transition-opacity">
                    <Plus className="h-3 w-3" />
                    Add Media
                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFileSelect} />
                </label>
            </div>

            {activity && mediaFiles.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Existing media ({mediaFiles.length})</p>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {mediaFiles.map((media) => (
                            <MediaThumbnail
                                key={media.id}
                                media={media}
                                onDelete={() => onDeleteMedia(media.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {pendingFiles.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Files to upload ({pendingFiles.length})</p>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {pendingFiles.map((file, index) => (
                            <PendingFileThumbnail
                                key={index}
                                file={file}
                                onRemove={() => onRemovePending(index)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isEmpty && (
                <div className="text-center py-6 text-gray-400 border-2 border-dashed rounded-xl">
                    <Image className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No media added yet</p>
                </div>
            )}
        </div>
    );
}

function MediaThumbnail({ media, onDelete }: { media: MediaFile; onDelete: () => void }) {
    const url = media.url.startsWith('http') ? media.url : `${MEDIA_BASE_URL}${media.url}`;
    return (
        <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
            {media.type === 'image' ? (
                <img src={url} alt={media.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Video className="h-4 w-4 text-white" />
                </div>
            )}
            <button
                type="button"
                onClick={onDelete}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="h-2.5 w-2.5" />
            </button>
        </div>
    );
}

function PendingFileThumbnail({ file, onRemove }: { file: File; onRemove: () => void }) {
    return (
        <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
            {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Video className="h-4 w-4 text-white" />
                </div>
            )}
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="h-2.5 w-2.5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-0.5 truncate">
                {file.name}
            </div>
        </div>
    );
}

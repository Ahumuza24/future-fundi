export interface MediaFile {
    id: string;
    type: 'image' | 'video';
    name: string;
    url: string;
    content_type: string;
}

export interface Activity {
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

export interface Course {
    id: string;
    name: string;
}

export type ActivityStatus = Activity['status'];

export const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Upcoming' },
    ongoing: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ongoing' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};

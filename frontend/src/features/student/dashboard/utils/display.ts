import {
  Award,
  Beaker,
  Bot,
  Briefcase,
  Circle,
  Code,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Film,
  GraduationCap,
  Image,
  Link2,
  MapPin,
  Music,
  Paintbrush,
  Palette,
  Presentation,
  School,
  Star,
  TrendingUp,
  Video,
  Wrench,
} from 'lucide-react';
import { MEDIA_BASE_URL } from '@/lib/api';
import type { StudentArtifactMediaRef } from '../types';

export const CARD_ACCENTS = [
  'var(--fundi-orange)',
  'var(--fundi-purple)',
  'var(--fundi-cyan)',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
];

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Beaker,
  Bot,
  Briefcase,
  Circle,
  Code,
  MapPin,
  Music,
  Palette,
  Paintbrush,
  Presentation,
  School,
  Star,
  TrendingUp,
  Video,
  Wrench,
};

export const getIconComponent = (iconName: string): React.ElementType =>
  ICON_MAP[iconName] || GraduationCap;

export const resolveUrl = (raw: string): string => {
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${MEDIA_BASE_URL}${raw}`;
  return `${MEDIA_BASE_URL}/${raw.replace(/^\.?\//, '')}`;
};

export const mediaIcon = (ref: StudentArtifactMediaRef) => {
  const type = (ref.type || '').toLowerCase();
  const name = (ref.filename || ref.name || ref.label || '').toLowerCase();

  if (type === 'link') {
    return { icon: Link2, label: 'Link', color: 'text-blue-500' };
  }
  if (type.startsWith('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) {
    return { icon: Image, label: 'Image', color: 'text-emerald-500' };
  }
  if (type.startsWith('video') || /\.(mp4|webm|mov|mkv)$/.test(name)) {
    return { icon: Film, label: 'Video', color: 'text-purple-500' };
  }
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return { icon: FileText, label: 'PDF', color: 'text-red-500' };
  }
  if (type.includes('word') || /\.docx?$/.test(name)) {
    return { icon: FileText, label: 'Word', color: 'text-blue-600' };
  }
  if (type.includes('sheet') || /\.xlsx?$/.test(name)) {
    return { icon: FileSpreadsheet, label: 'Excel', color: 'text-green-600' };
  }
  if (type.includes('presentation') || /\.pptx?$/.test(name)) {
    return { icon: Presentation, label: 'Slides', color: 'text-orange-500' };
  }
  if (type.includes('zip') || /\.(zip|rar|7z)$/.test(name)) {
    return { icon: FileArchive, label: 'Archive', color: 'text-gray-500' };
  }
  if (/\.(stl|obj|dwg|dxf|f3d|step|stp)$/.test(name)) {
    return { icon: Wrench, label: 'CAD', color: 'text-cyan-500' };
  }
  return { icon: FileText, label: 'File', color: 'text-gray-500' };
};

export const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

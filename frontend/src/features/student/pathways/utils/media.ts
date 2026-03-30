import { MEDIA_BASE_URL } from '@/lib/api';
import type {
  NormalizedMediaResource,
  PathwayModuleMedia,
} from '../types';

const inferUrl = (media: PathwayModuleMedia): string | undefined => {
  const candidate = media.url || media.file || media.path || media.src || media.link;
  if (!candidate) {
    return undefined;
  }
  if (candidate.startsWith('http')) {
    return candidate;
  }
  if (candidate.startsWith('/')) {
    return `${MEDIA_BASE_URL}${candidate}`;
  }
  return candidate;
};

const inferFlags = (url: string | undefined, media: PathwayModuleMedia) => {
  const type = media.type || media.content_type || '';
  const lower = type.toLowerCase();
  const urlLower = url?.toLowerCase() ?? '';
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];

  const isImage =
    lower.includes('image') || imageExtensions.some((ext) => urlLower.endsWith(ext));
  const isVideo =
    lower.includes('video') || videoExtensions.some((ext) => urlLower.endsWith(ext));

  return { isImage, isVideo };
};

export const normalizeMediaResources = (
  moduleId: string,
  mediaFiles: PathwayModuleMedia[]
): NormalizedMediaResource[] =>
  mediaFiles.map((media, index) => {
    const url = inferUrl(media);
    const flags = inferFlags(url, media);
    return {
      key: `${moduleId}-${media.id ?? index}`,
      url,
      displayName: media.name || media.title || `Resource ${index + 1}`,
      typeLabel: flags.isImage ? 'Image' : flags.isVideo ? 'Video' : media.type || 'File',
      rawType: media.type || media.content_type,
      isImage: flags.isImage,
      isVideo: flags.isVideo,
    };
  });

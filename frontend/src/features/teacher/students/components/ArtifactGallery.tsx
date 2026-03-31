import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import type { TeacherArtifactItem } from '../types';

const formatDateTime = (value?: string) => {
  if (!value) return 'Unknown date';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    console.warn('Failed to format date', error);
    return value;
  }
};

const EMPTY_FILENAME = 'View file';

const truncate = (value?: string, maxLength: number = 20) => {
  if (!value) return EMPTY_FILENAME;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
};

const EmptyState = () => (
  <Card className="border-dashed border-gray-200 bg-gray-50">
    <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-gray-500">
      <Archive className="h-8 w-8 text-gray-400" />
      <p>No artifacts submitted yet.</p>
    </CardContent>
  </Card>
);

const renderPreview = (artifact: TeacherArtifactItem) => {
  const media = artifact.media_refs?.[0];
  const previewUrl = media?.thumbnail_url || media?.url;
  const isImage = media?.type?.startsWith('image');

  if (previewUrl && isImage) {
    return (
      <img
        src={previewUrl}
        alt={media?.filename ?? `${artifact.title} preview`}
        className="h-32 w-full rounded-md object-cover"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-gray-500">
      <ImageIcon className="h-10 w-10" />
      <span className="text-xs">Preview unavailable</span>
    </div>
  );
};

interface ArtifactGalleryProps {
  artifacts: TeacherArtifactItem[];
}

export const ArtifactGallery = ({ artifacts }: ArtifactGalleryProps) => {
  if (!artifacts?.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {artifacts.map((artifact) => (
        <Card key={artifact.id} className="border-gray-200 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--fundi-black)' }}>
                  {artifact.title}
                </p>
                <p className="text-[11px] text-gray-500">
                  {artifact.module_name ?? 'General module'} · {formatDateTime(artifact.submitted_at)}
                </p>
              </div>
              <Badge
                variant={artifact.uploaded_by_student ? 'secondary' : 'outline'}
                className="capitalize"
              >
                {artifact.status}
              </Badge>
            </div>

            {artifact.media_refs && artifact.media_refs.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                {renderPreview(artifact)}
              </div>
            ) : null}

            {artifact.reflection && (
              <p className="text-xs text-gray-700">
                {artifact.reflection.length > 120
                  ? `${artifact.reflection.slice(0, 120)}…`
                  : artifact.reflection}
              </p>
            )}

            {artifact.rejection_reason && (
              <p className="text-[11px] text-red-500">Reason: {artifact.rejection_reason}</p>
            )}

            {artifact.media_refs && artifact.media_refs.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-1">
                  {artifact.media_refs.map((media) => (
                    <a
                      key={`${artifact.id}-${media.filename ?? media.url}`}
                      href={media.url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs text-[var(--fundi-black)] transition-colors hover:border-[var(--fundi-cyan)] hover:text-[var(--fundi-cyan)]"
                    >
                      <FileText className="h-3 w-3" />
                      <span>{truncate(media.filename)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

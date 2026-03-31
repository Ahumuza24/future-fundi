import { Button } from '@/components/ui/button';
import type { NormalizedMediaResource } from '../types';

interface MediaModalProps {
  media: NormalizedMediaResource | null;
  onClose: () => void;
}

export const MediaModal = ({ media, onClose }: MediaModalProps) => {
  if (!media) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm">
            <span>Press ESC or click outside to close</span>
            <span className="text-2xl">×</span>
          </div>
        </button>

        <div className="bg-white rounded-lg overflow-hidden">
          {media.isImage && media.url ? (
            <div className="flex flex-col">
              <img src={media.url} alt={media.displayName} className="w-full max-h-[70vh] object-contain bg-gray-100" />
              <MediaDetails title={media.displayName} subtitle="Image" />
            </div>
          ) : media.isVideo && media.url ? (
            <div className="flex flex-col">
              <video controls autoPlay className="w-full max-h-[70vh] bg-black">
                <source src={media.url} type={media.rawType}
              />
              </video>
              <MediaDetails title={media.displayName} subtitle="Video" />
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="font-medium text-gray-900 mb-2">{media.displayName}</p>
              <p className="text-sm text-gray-500 mb-4">{media.typeLabel}</p>
              {media.url && (
                <Button
                  type="button"
                  onClick={() => window.open(media.url, '_blank')}
                  className="bg-[var(--fundi-orange)] hover:bg-orange-600"
                >
                  Download File
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MediaDetailsProps {
  title: string;
  subtitle: string;
}

const MediaDetails = ({ title, subtitle }: MediaDetailsProps) => (
  <div className="p-4 border-t">
    <p className="font-medium text-gray-900">{title}</p>
    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
  </div>
);

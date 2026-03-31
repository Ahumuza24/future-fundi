import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import type { StudentArtifact } from '../types';
import { formatDate, mediaIcon, resolveUrl } from '../utils/display';

interface ArtifactModalProps {
  artifact: StudentArtifact;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const ArtifactModal = ({
  artifact,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ArtifactModalProps) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const mediaItems = artifact.media_refs || [];
  const images = mediaItems.filter(
    (media) =>
      (media.type || '').startsWith('image') ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(media.filename || media.name || media.url || '')
  );
  const otherFiles = mediaItems.filter((media) => !images.includes(media));

  return (
    <AnimatePresence>
      <motion.div
        key="artifact-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          onClick={(event) => event.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl text-gray-900 leading-snug">{artifact.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {artifact.submitted_at && <span>{formatDate(artifact.submitted_at)}</span>}
                {artifact.teacher_name && <span>· Captured by {artifact.teacher_name}</span>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {images.length > 0 && (
              <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {images.map((image, index) => {
                  const url = image.url ? resolveUrl(image.url) : null;
                  if (!url) return null;
                  return (
                    <a
                      key={`artifact-image-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={`block overflow-hidden rounded-xl ${images.length === 1 ? 'h-64' : 'h-40'}`}
                    >
                      <img
                        src={url}
                        alt={image.name || image.filename || `Artifact image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  );
                })}
              </div>
            )}

            {artifact.status === 'rejected' && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600">Teacher's Feedback</p>
                </div>
                {artifact.rejection_reason ? (
                  <p className="text-sm text-red-800 leading-relaxed">"{artifact.rejection_reason}"</p>
                ) : (
                  <p className="text-sm text-red-600 italic">
                    This artifact was returned for revision. Please resubmit an improved version.
                  </p>
                )}
              </div>
            )}

            {artifact.reflection && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Teacher's Observation</p>
                <p className="text-gray-700 leading-relaxed text-sm bg-orange-50 rounded-xl p-4 border border-orange-100">
                  "{artifact.reflection}"
                </p>
              </div>
            )}

            {otherFiles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attached Files</p>
                <div className="space-y-2">
                  {otherFiles.map((file, index) => {
                    const { icon: Icon, label, color } = mediaIcon(file);
                    const name = file.label || file.name || file.filename || label;
                    const url = file.url ? resolveUrl(file.url) : null;
                    return (
                      <div
                        key={`artifact-file-${index}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className={`p-2 rounded-lg bg-white border border-gray-100 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                          <p className="text-xs text-gray-400">{label}</p>
                        </div>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-[var(--fundi-orange)] hover:underline shrink-0"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mediaItems.length === 0 && !artifact.reflection && (
              <p className="text-sm text-gray-400 text-center py-6">No additional details for this artifact.</p>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

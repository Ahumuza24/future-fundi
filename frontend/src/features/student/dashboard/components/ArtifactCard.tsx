import { motion } from 'framer-motion';
import { Camera, FileText } from 'lucide-react';
import type { StudentArtifact } from '../types';
import { CARD_ACCENTS, formatDate, mediaIcon, resolveUrl } from '../utils/display';

interface ArtifactCardProps {
  artifact: StudentArtifact;
  index: number;
  onClick: () => void;
}

export const ArtifactCard = ({ artifact, index, onClick }: ArtifactCardProps) => {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const mediaItems = artifact.media_refs || [];
  const mediaCount = mediaItems.filter((item) => item.url || item.filename || item.type === 'link').length;
  const firstImage = mediaItems.find(
    (item) =>
      (item.type || '').startsWith('image') ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(item.filename || item.name || item.url || '')
  );
  const firstMedia = mediaItems.find((item) => item.url || item.filename || item.type === 'link');
  const previewUrl = firstImage?.url ? resolveUrl(firstImage.url) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative">
        {artifact.status && artifact.status !== 'approved' && (
          <div
            className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] uppercase font-bold z-20 shadow-sm backdrop-blur-md bg-white/90"
            style={{ color: artifact.status === 'rejected' ? '#ef4444' : '#f59e0b' }}
          >
            {artifact.status}
          </div>
        )}
        {previewUrl ? (
          <div className="h-36 overflow-hidden">
            <img src={previewUrl} alt={artifact.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="h-36 w-full flex items-center justify-center overflow-hidden relative"
            style={{ backgroundColor: `${accent}15` }}
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: accent }} />
            {firstMedia ? (
              (() => {
                const { icon: Icon } = mediaIcon(firstMedia);
                return <Icon className="h-14 w-14 z-10" style={{ color: accent }} />;
              })()
            ) : (
              <FileText className="h-14 w-14 z-10" style={{ color: accent }} />
            )}
          </div>
        )}
      </div>

      {artifact.status === 'rejected' && artifact.rejection_reason && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0" aria-hidden>
            ⚠
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-0.5">Teacher's Feedback</p>
            <p className="text-xs text-red-700 line-clamp-2 leading-relaxed">{artifact.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">{artifact.title}</h3>
          <Camera className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accent }} />
        </div>

        {artifact.reflection && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{artifact.reflection}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatDate(artifact.submitted_at)}</span>
          {mediaCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {mediaCount} file{mediaCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {artifact.teacher_name && (
          <p className="text-xs text-gray-400 mt-1 truncate">By {artifact.teacher_name}</p>
        )}
      </div>
    </motion.div>
  );
};

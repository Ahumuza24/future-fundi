import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEDIA_BASE_URL } from "@/lib/api";
import type { ArtifactMediaRef, EvidenceArtifact } from "../learner-dashboard-types";
import { ARTIFACT_STATUS_LABELS } from "../learner-dashboard-types";

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-fundi-yellow/20 text-[#d4b800]",
  approved: "bg-fundi-lime/15 text-[#496400]",
  rejected: "bg-fundi-red/15 text-fundi-red",
  verified: "bg-fundi-lime/15 text-[#496400]",
  corrected: "bg-fundi-purple/15 text-fundi-purple",
};

function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${MEDIA_BASE_URL}${url}`;
  return `${MEDIA_BASE_URL}/${url.replace(/^\.?\//, "")}`;
}

function isImageRef(ref: ArtifactMediaRef): boolean {
  return (
    ref.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(ref.filename)
  );
}

interface EvidenceDetailModalProps {
  artifact: EvidenceArtifact;
  onClose: () => void;
}

export default function EvidenceDetailModal({ artifact, onClose }: EvidenceDetailModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const images = artifact.media_refs.filter(isImageRef);
  const otherFiles = artifact.media_refs.filter((r) => !isImageRef(r));

  return (
    <AnimatePresence>
      <motion.div
        key="evidence-detail-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl text-[#2f2f2f] leading-snug">{artifact.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    STATUS_CHIP[artifact.status] ?? "bg-[#e8e8e8] text-[#5b5b5b]"
                  )}
                >
                  {ARTIFACT_STATUS_LABELS[artifact.status] ?? artifact.status}
                </span>
                {artifact.evidence_status && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      STATUS_CHIP[artifact.evidence_status] ?? "bg-[#e8e8e8] text-[#5b5b5b]"
                    )}
                  >
                    Evidence: {artifact.evidence_status}
                  </span>
                )}
                {artifact.module && (
                  <span className="text-[10px] text-[#5b5b5b] bg-[#f1f1f1] px-2 py-0.5 rounded-full">
                    {artifact.module}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Images — click opens full size in new tab */}
            {images.length > 0 && (
              <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {images.map((img, idx) => {
                  const url = resolveMediaUrl(img.url);
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl group relative bg-[#f6f6f6] overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={img.filename || `Image ${idx + 1}`}
                        className="w-full max-h-72 object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-end p-2">
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-black/50 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-3 w-3" /> Open full size
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Non-image files — download link */}
            {otherFiles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#5b5b5b] uppercase tracking-wider mb-2">
                  Files
                </p>
                <div className="space-y-2">
                  {otherFiles.map((file, idx) => {
                    const url = file.url ? resolveMediaUrl(file.url) : null;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-[#f6f6f6] rounded-xl border border-gray-100"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2f2f2f] truncate">
                            {file.filename}
                          </p>
                          <p className="text-xs text-[#5b5b5b]">{file.type}</p>
                        </div>
                        {url && (
                          <a
                            href={url}
                            download={file.filename}
                            className="flex items-center gap-1.5 text-xs text-fundi-orange hover:underline shrink-0 font-semibold"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {artifact.reflection && (
              <div>
                <p className="text-xs font-semibold text-[#5b5b5b] uppercase tracking-wider mb-2">
                  Reflection
                </p>
                <p className="text-sm text-[#2f2f2f] bg-orange-50 rounded-xl p-4 border border-orange-100 leading-relaxed italic">
                  "{artifact.reflection}"
                </p>
              </div>
            )}

            {artifact.media_refs.length === 0 && !artifact.reflection && (
              <p className="text-sm text-[#5b5b5b] text-center py-8">
                No files or notes attached to this artifact.
              </p>
            )}
          </div>

          {artifact.submitted_at && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-[#5b5b5b]">Submitted {artifact.submitted_at}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from "react";
import { FolderOpen, FileText, Upload, File, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { EvidenceArtifact, ArtifactMediaRef } from "../learner-dashboard-types";
import { ARTIFACT_STATUS_LABELS } from "../learner-dashboard-types";
import EvidenceDetailModal from "./EvidenceDetailModal";
import { StudentArtifactUploadModal } from "@/features/student/dashboard/components/StudentArtifactUploadModal";

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-fundi-yellow/20 text-[#d4b800]",
  approved: "bg-fundi-lime/15 text-[#496400]",
  rejected: "bg-fundi-red/15 text-fundi-red",
  verified: "bg-fundi-lime/15 text-[#496400]",
  corrected: "bg-fundi-purple/15 text-fundi-purple",
};

const ACCENT_COLORS = [
  "bg-fundi-orange",
  "bg-fundi-cyan",
  "bg-fundi-lime",
  "bg-fundi-purple",
];

function isImage(ref: ArtifactMediaRef): boolean {
  return ref.type.startsWith("image/");
}

function ArtifactThumbnail({ mediaRefs }: { mediaRefs: ArtifactMediaRef[] }) {
  const first = mediaRefs[0];

  if (first && isImage(first)) {
    return (
      <img
        src={first.url}
        alt={first.filename}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    );
  }

  if (first) {
    return (
      <div className="flex flex-col items-center ga   p-1">
        <File className="h-7 w-7 text-[#5b5b5b]/40" />
        <span className="text-[9px] text-[#5b5b5b]/60 truncate max-w-[80%]">{first.filename}</span>
      </div>
    );
  }

  return <FileText className="h-7 w-7 text-[#5b5b5b]/30" />;
}

function ArtifactCard({
  artifact,
  index,
  onClick,
}: {
  artifact: EvidenceArtifact;
  index: number;
  onClick: () => void;
}) {
  const chipStyle = STATUS_CHIP[artifact.status] ?? "bg-[#e8e8e8] text-[#5b5b5b]";
  const evidenceStatus = artifact.evidence_status ?? artifact.status;
  const evidenceChipStyle = STATUS_CHIP[evidenceStatus] ?? "bg-[#e8e8e8] text-[#5b5b5b]";
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const hasImage = artifact.media_refs[0] && isImage(artifact.media_refs[0]);

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(240,87,34,0.06)] hover:shadow-[0_4px_20px_rgba(240,87,34,0.14)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-fundi-orange/40"
    >
      {/* Thumbnail */}
      <div className="relative h-24 bg-[#f6f6f6] flex items-center justify-center overflow-hidden">
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", accentColor)} />
        <ArtifactThumbnail mediaRefs={artifact.media_refs} />
        {!hasImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#f6f6f6] to-[#ebebeb]" style={{ zIndex: -1 }} />
        )}
        <span className={cn("absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full", chipStyle)}>
          {ARTIFACT_STATUS_LABELS[artifact.status] ?? artifact.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-2.5">
        <p className="text-[11px] font-bold text-[#2f2f2f] line-clamp-2 leading-snug">{artifact.title}</p>
        {artifact.module && (
          <p className="text-[10px] text-[#5b5b5b] truncate mt-0.5">{artifact.module}</p>
        )}
        {artifact.task && (
          <p className="text-[10px] text-[#5b5b5b] truncate mt-0.5">{artifact.task}</p>
        )}
        <span className={cn("inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full", evidenceChipStyle)}>
          Evidence {evidenceStatus}
        </span>
        {artifact.submitted_at && (
          <p className="text-[10px] text-[#5b5b5b] mt-0.5">{artifact.submitted_at}</p>
        )}
      </div>
    </button>
  );
}

export default function EvidencePortfolioPanel({ artifacts }: { artifacts: EvidenceArtifact[] }) {
  const queryClient = useQueryClient();
  const [selectedArtifact, setSelectedArtifact] = useState<EvidenceArtifact | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    queryClient.invalidateQueries({ queryKey: ["learner-evidence"] });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 bg-fundi-orange rounded-full shrink-0" />
          <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-fundi-orange" />
            Evidence Portfolio
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-fundi-orange/10 text-fundi-orange px-2.5 py-1 rounded-full">
            {artifacts.length} items
          </span>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-fundi-orange text-white px-3 py-1.5 rounded-full hover:bg-fundi-orange/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload Evidence
          </button>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <Upload className="h-8 w-8 text-[#e8e8e8] mx-auto" />
          <p className="text-xs text-[#5b5b5b]">
            No artifacts yet — submit your work to build your portfolio.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="text-xs font-semibold text-fundi-orange hover:underline"
          >
            Upload your first artifact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {artifacts.map((artifact, i) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              index={i}
              onClick={() => setSelectedArtifact(artifact)}
            />
          ))}
        </div>
      )}

      {selectedArtifact && (
        <EvidenceDetailModal
          artifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}

      <StudentArtifactUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

import { FolderOpen, FileText, Upload, File } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceArtifact, ArtifactMediaRef } from "../learner-dashboard-types";
import { ARTIFACT_STATUS_LABELS } from "../learner-dashboard-types";

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-fundi-yellow/20 text-[#d4b800]",
  approved: "bg-fundi-lime/15 text-[#496400]",
  rejected: "bg-fundi-red/15 text-fundi-red",
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
      <div className="flex flex-col items-center gap-1">
        <File className="h-7 w-7 text-[#5b5b5b]/40" />
        <span className="text-[9px] text-[#5b5b5b]/60 truncate max-w-[80%]">{first.filename}</span>
      </div>
    );
  }

  return <FileText className="h-7 w-7 text-[#5b5b5b]/30" />;
}

function ArtifactCard({ artifact, index }: { artifact: EvidenceArtifact; index: number }) {
  const chipStyle = STATUS_CHIP[artifact.status] ?? "bg-[#e8e8e8] text-[#5b5b5b]";
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const hasImage = artifact.media_refs[0] && isImage(artifact.media_refs[0]);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(240,87,34,0.06)] hover:shadow-[0_4px_20px_rgba(240,87,34,0.10)] transition-shadow">
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
        {artifact.submitted_at && (
          <p className="text-[10px] text-[#5b5b5b] mt-0.5">{artifact.submitted_at}</p>
        )}
      </div>
    </div>
  );
}

export default function EvidencePortfolioPanel({ artifacts }: { artifacts: EvidenceArtifact[] }) {
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
        <span className="text-[10px] font-bold bg-fundi-orange/10 text-fundi-orange px-2.5 py-1 rounded-full">
          {artifacts.length} items
        </span>
      </div>

      {artifacts.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Upload className="h-8 w-8 text-[#e8e8e8] mx-auto" />
          <p className="text-xs text-[#5b5b5b]">
            No artifacts yet — submit your work to build your portfolio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {artifacts.map((artifact, i) => (
            <ArtifactCard key={artifact.id} artifact={artifact} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

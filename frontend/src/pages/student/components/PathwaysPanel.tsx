import { BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pathway } from "../learner-dashboard-types";
import { PATHWAY_STATUS_STYLE, PATHWAY_STATUS_LABEL } from "../learner-dashboard-types";

function PathwayCard({ pathway }: { pathway: Pathway }) {
  const statusStyle = PATHWAY_STATUS_STYLE[pathway.status] ?? "bg-[#e8e8e8] text-[#5b5b5b]";
  const statusLabel = PATHWAY_STATUS_LABEL[pathway.status] ?? pathway.status;
  const mcPct = pathway.totalMicroCredentials > 0
    ? (pathway.microCredentialsEarned / pathway.totalMicroCredentials) * 100
    : 0;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(240,87,34,0.06)] hover:shadow-[0_4px_20px_rgba(240,87,34,0.12)] transition-shadow">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-fundi-orange group-hover:w-1.5 transition-all rounded-l-xl" />
      <div className="pl-5 pr-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#2f2f2f] text-sm truncate">{pathway.title}</h4>
            <p className="text-[11px] text-[#5b5b5b] mt-0.5 truncate">{pathway.currentLevel}</p>
          </div>
          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0", statusStyle)}>
            {statusLabel}
          </span>
        </div>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-[#5b5b5b]">
              Level {pathway.currentLevelNumber} of {pathway.totalLevels}
            </span>
            <span className="text-[11px] font-extrabold text-fundi-orange">{pathway.progress}%</span>
          </div>
          <div className="h-1.5 bg-[#f1f1f1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fundi-orange to-fundi-orange/70 rounded-full transition-all"
              style={{ width: `${pathway.progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#5b5b5b] min-w-0">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="truncate">{pathway.currentModule}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-fundi-orange shrink-0 ml-2">
            Continue
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {pathway.microCredentialsEarned > 0 && (
          <div className="mt-2 pt-2 border-t border-[#f1f1f1] flex items-center gap-1.5">
            <span className="text-[10px] text-[#5b5b5b] shrink-0">
              {pathway.microCredentialsEarned}/{pathway.totalMicroCredentials} microcreds
            </span>
            <div className="flex-1 h-1 bg-[#f1f1f1] rounded-full overflow-hidden">
              <div
                className="h-full bg-fundi-cyan rounded-full"
                style={{ width: `${mcPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PathwaysPanel({ pathways }: { pathways: Pathway[] }) {
  if (pathways.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-6 bg-fundi-orange rounded-full shrink-0" />
          <h3 className="font-bold text-[#2f2f2f] text-lg">My Pathways</h3>
        </div>
        <p className="text-xs text-[#5b5b5b] text-center py-6">
          No pathways enrolled yet. Ask your teacher to enroll you.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-6 bg-fundi-orange rounded-full shrink-0" />
        <h3 className="font-bold text-[#2f2f2f] text-lg">My Pathways</h3>
        <span className="ml-auto text-[10px] font-bold bg-fundi-orange/10 text-fundi-orange px-2.5 py-1 rounded-full">
          {pathways.length} enrolled
        </span>
      </div>
      <div className="space-y-3">
        {pathways.map((pathway) => (
          <PathwayCard key={pathway.id} pathway={pathway} />
        ))}
      </div>
    </div>
  );
}

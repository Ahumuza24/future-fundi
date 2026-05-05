import { GraduationCap } from "lucide-react";
import type { CohortPosition } from "../learner-dashboard-types";
import { LEVEL_LABELS } from "../learner-dashboard-types";

export default function CohortPositionPanel({ data }: { data: CohortPosition }) {
  const total = data.total_peers;
  const rank = total > 0 ? data.peers_above + 1 : null;
  const percentile = total > 0 ? Math.round((data.peers_below / total) * 100) : null;

  return (
    <div className="bg-[#2f2f2f] rounded-xl p-6 h-full flex flex-col justify-between min-h-[200px] shadow-[0_4px_24px_rgba(240,87,34,0.12)]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1 h-5 bg-fundi-lime rounded-full" />
            <h3 className="font-bold text-white text-lg">Cohort Rank</h3>
          </div>
          {percentile !== null && (
            <p className="text-xs text-[#9d9d9d]">Top {100 - percentile}% of your class</p>
          )}
        </div>
        {rank !== null && (
          <div className="bg-fundi-lime text-[#344900] px-3 py-1 rounded-full font-black text-lg leading-none">
            #{rank}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-fundi-orange" />
        </div>
        <div>
          <p className="text-xl font-black text-white leading-none">
            {LEVEL_LABELS[data.level] ?? data.level}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9d9d9d]">
            Current Level
          </p>
        </div>
      </div>

      {total > 0 ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#9d9d9d]">Peers ahead</span>
            <span className="text-white font-bold">{data.peers_above}</span>
          </div>
          <div className="flex justify-between text-xs bg-fundi-lime/10 rounded px-2 py-1">
            <span className="text-fundi-lime font-medium">At your level</span>
            <span className="text-fundi-lime font-bold">{data.peers_same}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9d9d9d]">Peers behind</span>
            <span className="text-white font-bold">{data.peers_below}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#9d9d9d]">No peers to compare yet.</p>
      )}
    </div>
  );
}

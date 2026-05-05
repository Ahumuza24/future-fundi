import { Leaf, Apple, TreePine } from "lucide-react";
import type { GrowthSummary } from "../learner-dashboard-types";
import { LEVEL_LABELS } from "../learner-dashboard-types";

const LEVEL_STYLE: Record<string, string> = {
  explorer: "bg-fundi-cyan/10 text-fundi-cyan ring-fundi-cyan/30",
  builder: "bg-fundi-lime/10 text-fundi-lime ring-fundi-lime/30",
  practitioner: "bg-fundi-purple/10 text-fundi-purple ring-fundi-purple/30",
  pre_professional: "bg-fundi-orange/10 text-fundi-orange ring-fundi-orange/30",
};

export default function GrowthTreePanel({ data }: { data: GrowthSummary }) {
  const levelStyle = LEVEL_STYLE[data.level] ?? "bg-gray-100 text-gray-600 ring-gray-200";
  const totalFruit = data.badges.length + data.microcredentials.length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-1 h-6 bg-fundi-lime rounded-full shrink-0" />
        <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
          <TreePine className="h-4 w-4 text-fundi-lime" />
          Growth Profile
        </h3>
        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ring-2 ${levelStyle}`}>
          {LEVEL_LABELS[data.level] ?? data.level}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-fundi-lime/10 rounded-xl p-4 flex flex-col items-center gap-1">
          <Leaf className="h-5 w-5 text-fundi-lime" />
          <span className="text-2xl font-extrabold text-[#2f2f2f]">{data.leaves_count}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5b5b5b]">Leaves</span>
          <span className="text-[10px] text-[#5b5b5b]">artifacts</span>
        </div>
        <div className="bg-fundi-orange/10 rounded-xl p-4 flex flex-col items-center gap-1">
          <Apple className="h-5 w-5 text-fundi-orange" />
          <span className="text-2xl font-extrabold text-[#2f2f2f]">{data.fruit_count}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5b5b5b]">Fruit</span>
          <span className="text-[10px] text-[#5b5b5b]">recognition</span>
        </div>
      </div>

      {data.badges.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b5b5b]">Recent Badges</p>
          <div className="flex flex-wrap gap-1.5">
            {data.badges.slice(0, 5).map((b, i) => (
              <span
                key={i}
                title={b.date_awarded ?? ""}
                className="text-xs bg-fundi-orange/10 text-fundi-orange font-bold px-2.5 py-0.5 rounded-md"
              >
                {b.title}
              </span>
            ))}
            {data.badges.length > 5 && (
              <span className="text-xs text-[#5b5b5b]">+{data.badges.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {data.microcredentials.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b5b5b]">Microcredentials</p>
          <div className="space-y-1.5">
            {data.microcredentials.slice(0, 3).map((mc, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-fundi-cyan/10 rounded-lg px-3 py-2 border-l-4 border-fundi-cyan"
              >
                <span className="text-xs font-bold text-fundi-cyan truncate">{mc.title}</span>
                <span className="text-[10px] text-[#5b5b5b] shrink-0 ml-2">{mc.date_issued ?? ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalFruit === 0 && data.leaves_count === 0 && (
        <p className="text-xs text-[#5b5b5b] text-center py-3">
          Submit your first artifact to start growing!
        </p>
      )}
    </div>
  );
}

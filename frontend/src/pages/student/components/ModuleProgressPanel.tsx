import { BookOpen, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleProgressData } from "../learner-dashboard-types";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  partial_complete: "Partial",
  complete: "Complete",
};

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-[#e8e8e8] text-[#5b5b5b]",
  in_progress: "bg-fundi-cyan/10 text-fundi-cyan",
  partial_complete: "bg-fundi-yellow/20 text-[#d4b800]",
  complete: "bg-fundi-lime/10 text-[#496400]",
};

export default function ModuleProgressPanel({ data }: { data: ModuleProgressData | null }) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-6 bg-fundi-orange rounded-full shrink-0" />
          <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-fundi-orange" />
            Current Pathway
          </h3>
        </div>
        <p className="text-sm text-[#5b5b5b] text-center py-6">
          No active module — ask your teacher to enroll you.
        </p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round(data.completion_pct));
  const remaining = data.units_total - data.units_completed;

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 bg-fundi-orange rounded-full shrink-0" />
          <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-fundi-orange" />
            Current Pathway
          </h3>
        </div>
        {data.microcredential_eligible && (
          <span className="text-xs font-bold bg-fundi-lime/10 text-[#496400] px-3 py-1 rounded-full">
            Microcred ready!
          </span>
        )}
      </div>

      {data.pathway && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-fundi-orange mb-2">
          {data.pathway}
        </p>
      )}

      <div className="flex justify-between items-end mb-3">
        <h4 className="text-2xl font-extrabold text-[#2f2f2f] tracking-tight leading-tight">
          {data.module_name}
        </h4>
        <span className="text-fundi-orange font-black text-xl shrink-0 ml-3">{pct}%</span>
      </div>

      {data.outcome_statement && (
        <p className="text-xs text-[#5b5b5b] mb-4 line-clamp-2">{data.outcome_statement}</p>
      )}

      <div className="mb-5">
        <div className="w-full h-3 bg-[#f1f1f1] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fundi-orange to-fundi-orange-light relative transition-all duration-700"
            style={{ width: `${pct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-xs text-[#5b5b5b]">
            {data.units_completed} / {data.units_total} units
          </span>
          <span
            className={cn(
              "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
              STATUS_STYLE[data.status] ?? STATUS_STYLE.not_started
            )}
          >
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {Array.from({ length: data.units_total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              i < data.units_completed
                ? "bg-gradient-to-br from-fundi-orange to-fundi-orange-light text-white shadow-[0_2px_8px_rgba(240,87,34,0.35)]"
                : "bg-[#f1f1f1] text-[#5b5b5b]"
            )}
          >
            {i < data.units_completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </div>
        ))}
      </div>

      {pct < 100 && remaining > 0 && (
        <div className="bg-[#f1f1f1] rounded-lg p-3 flex items-center gap-3 border-l-4 border-fundi-cyan">
          <Lock className="h-4 w-4 text-fundi-cyan shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-fundi-cyan">
              Next Milestone
            </p>
            <p className="text-xs text-[#5b5b5b] font-medium">
              Complete {remaining} more unit{remaining !== 1 ? "s" : ""} to unlock the next level
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

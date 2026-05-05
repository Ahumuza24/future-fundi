import { cn } from "@/lib/utils";
import type { ChildSummary } from "../parent-dashboard-types";
import { LEVEL_LABELS } from "../parent-dashboard-types";
import { Leaf, Apple } from "lucide-react";

interface Props {
  children: ChildSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  explorer: "bg-cyan-50 border-cyan-300 text-cyan-800",
  builder: "bg-lime-50 border-lime-300 text-lime-800",
  practitioner: "bg-purple-50 border-purple-300 text-purple-800",
  pre_professional: "bg-orange-50 border-orange-300 text-orange-800",
};

export default function ChildSelectorPanel({ children, selectedId, onSelect }: Props) {
  if (children.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        No children linked to your account yet.
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {children.map((child) => (
        <button
          key={child.learner_id}
          onClick={() => onSelect(child.learner_id)}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all text-left",
            selectedId === child.learner_id
              ? (LEVEL_COLORS[child.level] ?? "bg-gray-50 border-gray-300 text-gray-800") + " shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          )}
        >
          <div>
            <div className="font-semibold text-sm">{child.name}</div>
            <div className="text-xs opacity-70">{LEVEL_LABELS[child.level] ?? child.level}</div>
          </div>
          <div className="flex gap-2 text-xs ml-2">
            <span className="flex items-center gap-0.5 text-emerald-600">
              <Leaf className="h-3 w-3" />{child.leaves_count}
            </span>
            <span className="flex items-center gap-0.5 text-amber-600">
              <Apple className="h-3 w-3" />{child.fruit_count}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

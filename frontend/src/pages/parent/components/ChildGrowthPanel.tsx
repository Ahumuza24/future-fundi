import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TreePine, Leaf, Apple } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChildGrowth } from "../parent-dashboard-types";
import { LEVEL_LABELS } from "../parent-dashboard-types";

interface Props {
  data: ChildGrowth;
}

const LEVEL_RING: Record<string, string> = {
  explorer: "ring-cyan-400 bg-cyan-50 text-cyan-800",
  builder: "ring-lime-400 bg-lime-50 text-lime-800",
  practitioner: "ring-purple-400 bg-purple-50 text-purple-800",
  pre_professional: "ring-orange-400 bg-orange-50 text-orange-800",
};

export default function ChildGrowthPanel({ data }: Props) {
  const ringClass = LEVEL_RING[data.level] ?? "ring-gray-300 bg-gray-50 text-gray-700";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TreePine className="h-4 w-4 text-emerald-600" />
          Growth Tree
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={cn("inline-flex px-3 py-1 rounded-full ring-2 text-sm font-semibold", ringClass)}>
          {LEVEL_LABELS[data.level] ?? data.level}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center bg-emerald-50 rounded-xl py-3 border border-emerald-100">
            <Leaf className="h-5 w-5 text-emerald-500 mb-0.5" />
            <span className="text-xl font-bold text-emerald-700">{data.leaves_count}</span>
            <span className="text-xs text-emerald-600">Leaves</span>
          </div>
          <div className="flex flex-col items-center bg-amber-50 rounded-xl py-3 border border-amber-100">
            <Apple className="h-5 w-5 text-amber-500 mb-0.5" />
            <span className="text-xl font-bold text-amber-700">{data.fruit_count}</span>
            <span className="text-xs text-amber-600">Fruit</span>
          </div>
        </div>

        {data.recent_badges.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Badges</p>
            <div className="flex flex-wrap gap-1.5">
              {data.recent_badges.map((b, i) => (
                <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                  {b.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

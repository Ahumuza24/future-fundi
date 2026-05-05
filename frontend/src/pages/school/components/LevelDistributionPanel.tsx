import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { LevelDistribution } from "../program-manager-types";
import { LEVEL_LABELS, LEVEL_COLORS } from "../program-manager-types";

interface Props {
  data: LevelDistribution;
}

const LEVEL_ORDER = ["explorer", "builder", "practitioner", "pre_professional"];

export default function LevelDistributionPanel({ data }: Props) {
  const total = Object.values(data).reduce((s, n) => s + n, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          Learner Level Distribution
          <span className="ml-auto text-xs text-gray-400">{total} total</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
          {LEVEL_ORDER.map((lvl) => {
            const count = data[lvl] ?? 0;
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={lvl}
                className={`${LEVEL_COLORS[lvl]} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${LEVEL_LABELS[lvl]}: ${count}`}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {LEVEL_ORDER.map((lvl) => {
            const count = data[lvl] ?? 0;
            return (
              <div key={lvl} className="text-center">
                <div className="text-lg font-bold text-gray-800">{count}</div>
                <div className="text-xs text-gray-500">{LEVEL_LABELS[lvl]}</div>
                <div className="text-xs text-gray-400">{Math.round((count / total) * 100)}%</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { PathwayDemandRow } from "../program-manager-types";

interface Props {
  rows: PathwayDemandRow[];
}

export default function PathwayDemandPanel({ rows }: Props) {
  const maxCount = rows[0]?.enrolled_learners ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-cyan-500" />
          Pathway Demand
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-auto">
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No enrollment data yet.</p>
        ) : (
          rows.map((row, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700 truncate max-w-[60%]">
                  {row.pathway}{row.track ? ` · ${row.track}` : ""}
                </span>
                <span className="text-gray-500 tabular-nums">{row.enrolled_learners}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${(row.enrolled_learners / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

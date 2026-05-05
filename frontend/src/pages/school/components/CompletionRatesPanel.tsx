import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompletionRateRow } from "../program-manager-types";

interface Props {
  rows: CompletionRateRow[];
}

export default function CompletionRatesPanel({ rows }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Module Completion Rates
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-64 overflow-auto">
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No progress data yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500 uppercase tracking-wide">
                <th className="text-left py-1.5 font-medium">Module</th>
                <th className="text-right py-1.5 font-medium">Done</th>
                <th className="text-right py-1.5 font-medium w-20">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 truncate max-w-[160px]">
                    <div className="font-medium text-gray-800 truncate">{row.module_name}</div>
                    {row.pathway && <div className="text-gray-400 truncate">{row.pathway}</div>}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-gray-600">
                    {row.learners_complete}
                  </td>
                  <td className="py-1.5 pl-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            row.completion_pct >= 70 ? "bg-green-500" :
                            row.completion_pct >= 40 ? "bg-amber-500" : "bg-red-400"
                          )}
                          style={{ width: `${row.completion_pct}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-gray-600 w-8 text-right">
                        {row.completion_pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

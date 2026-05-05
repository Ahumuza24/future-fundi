import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CohortLearnerRow, CompletionStatus } from "../teacher-dashboard-types";

interface Props {
  rows: CohortLearnerRow[];
  onSelectLearner: (learnerId: string) => void;
}

const STATUS_COLORS: Record<CompletionStatus, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  partial_complete: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<CompletionStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  partial_complete: "Partial",
  complete: "Complete",
};

const LEVEL_COLORS: Record<string, string> = {
  explorer: "bg-cyan-50 text-cyan-700",
  builder: "bg-lime-50 text-lime-700",
  practitioner: "bg-purple-50 text-purple-700",
  pre_professional: "bg-orange-50 text-orange-700",
};

export default function CohortProgressPanel({ rows, onSelectLearner }: Props) {
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) =>
    r.learner_name.toLowerCase().includes(search.toLowerCase())
  );

  const inProgress = rows.filter((r) => r.completion_status === "in_progress").length;
  const complete = rows.filter((r) => r.completion_status === "complete").length;
  const notStarted = rows.filter((r) => r.completion_status === "not_started").length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-cyan-500" />
            Cohort Progress
          </CardTitle>
          <div className="flex gap-3 text-xs font-medium">
            <span className="text-blue-600">{inProgress} active</span>
            <span className="text-green-600">{complete} done</span>
            <span className="text-gray-400">{notStarted} not started</span>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learners…"
            className="pl-9 h-8 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No learners match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2 font-medium">Learner</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Module</th>
                <th className="text-left px-4 py-2 font-medium">Progress</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.learner_id}
                  onClick={() => onSelectLearner(row.learner_id)}
                  className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{row.learner_name}</div>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded capitalize",
                        LEVEL_COLORS[row.level] ?? "bg-gray-100 text-gray-500"
                      )}
                    >
                      {row.level.replace("_", "-")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-gray-700 truncate max-w-[180px]">
                      {row.module || <span className="text-gray-400 italic">None</span>}
                    </div>
                    {row.pathway && (
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{row.pathway}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${row.completion_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {row.units_completed}/{row.units_total}
                      </span>
                    </div>
                    {row.microcredential_eligible && (
                      <span className="text-xs text-emerald-600 font-medium">Microcred ready</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        STATUS_COLORS[row.completion_status]
                      )}
                    >
                      {STATUS_LABELS[row.completion_status]}
                    </span>
                  </td>
                  <td className="pr-3">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
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

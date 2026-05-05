import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CertificationPipelineRow, PipelineStatus } from "../teacher-dashboard-types";

interface Props {
  rows: CertificationPipelineRow[];
  onSelectLearner: (learnerId: string) => void;
}

const STATUS_CONFIG: Record<PipelineStatus, { label: string; bar: string; text: string }> = {
  certified: { label: "Certified", bar: "bg-green-500", text: "text-green-700" },
  on_track: { label: "On Track", bar: "bg-cyan-500", text: "text-cyan-700" },
  needs_push: { label: "Needs Push", bar: "bg-amber-500", text: "text-amber-700" },
  stalled: { label: "Stalled", bar: "bg-red-400", text: "text-red-600" },
};

export default function CertificationPipelinePanel({ rows, onSelectLearner }: Props) {
  const onTrackCount = rows.filter(
    (r) => r.status === "on_track" || r.status === "certified"
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Certification Pipeline
          {rows.length > 0 && (
            <span className="ml-auto text-xs text-gray-500 font-normal">
              {onTrackCount}/{rows.length} on track
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-auto">
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            No learners have microcredentials yet.
          </p>
        ) : (
          rows.map((row) => {
            const config = STATUS_CONFIG[row.status];
            const pct =
              row.microcredentials_required > 0
                ? Math.min(
                    Math.round(
                      (row.microcredentials_earned / row.microcredentials_required) * 100
                    ),
                    100
                  )
                : 0;
            return (
              <button
                key={row.learner_id}
                onClick={() => onSelectLearner(row.learner_id)}
                className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800">{row.learner_name}</span>
                  <span className={cn("text-[10px] font-medium", config.text)}>
                    {config.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <div
                    className={cn("h-full rounded-full transition-all", config.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400">
                  {row.microcredentials_earned}/{row.microcredentials_required} microcredentials
                  {row.capstone_submitted && " · capstone submitted"}
                  {row.program && ` · ${row.program}`}
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, UserX, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterventionFlag, FlagType } from "../teacher-dashboard-types";

interface Props {
  flags: InterventionFlag[];
  onSelectLearner: (learnerId: string) => void;
}

const FLAG_CONFIG: Record<FlagType, { label: string; icon: React.ReactNode; classes: string }> = {
  at_risk: {
    label: "At Risk",
    icon: <AlertTriangle className="h-4 w-4" />,
    classes: "bg-red-50 border-red-200 text-red-700",
  },
  missed_sessions: {
    label: "Missed Sessions",
    icon: <UserX className="h-4 w-4" />,
    classes: "bg-amber-50 border-amber-200 text-amber-700",
  },
  behind_schedule: {
    label: "Behind",
    icon: <TrendingDown className="h-4 w-4" />,
    classes: "bg-orange-50 border-orange-200 text-orange-700",
  },
};

export default function InterventionFlagsPanel({ flags, onSelectLearner }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Intervention Flags
          {flags.length > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {flags.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-60 overflow-auto">
        {flags.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No flags — cohort is on track.</p>
        ) : (
          flags.map((flag, i) => {
            const config = FLAG_CONFIG[flag.flag_type];
            return (
              <button
                key={`${flag.learner_id}-${flag.flag_type}-${i}`}
                onClick={() => onSelectLearner(flag.learner_id)}
                className={cn(
                  "w-full text-left border rounded-lg px-3 py-2 text-xs transition-opacity hover:opacity-80",
                  config.classes
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold mb-0.5">
                  {config.icon}
                  <span>{flag.learner_name}</span>
                  <span className="ml-auto opacity-70">{config.label}</span>
                </div>
                <div className="opacity-80">{flag.detail}</div>
                {flag.module && (
                  <div className="opacity-60 truncate">Module: {flag.module}</div>
                )}
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

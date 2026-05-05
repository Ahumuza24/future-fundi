import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle2 } from "lucide-react";
import type { BadgeReadinessData, PendingBadgeAward } from "../teacher-dashboard-types";

interface Props {
  data: BadgeReadinessData;
  onAwardBadge: (award: PendingBadgeAward) => void;
}

export default function BadgeCompletionPanel({ data, onAwardBadge }: Props) {
  const { pending_awards, recently_issued } = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-amber-500" />
          Badge Completion
          {pending_awards.length > 0 && (
            <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pending_awards.length} pending
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-72 overflow-auto">
        {pending_awards.length === 0 && recently_issued.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No badge actions needed.</p>
        )}
        {pending_awards.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Award</p>
            {pending_awards.map((award, i) => (
              <div
                key={`${award.learner_id}-${award.badge_template_id}-${i}`}
                className="flex items-start justify-between gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{award.learner_name}</div>
                  <div className="text-xs text-amber-700 truncate">{award.badge_title}</div>
                  <div className="text-xs text-gray-400 truncate">{award.unit_title}</div>
                </div>
                <button
                  onClick={() => onAwardBadge(award)}
                  className="shrink-0 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded font-medium transition-colors"
                >
                  Award
                </button>
              </div>
            ))}
          </div>
        )}
        {recently_issued.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">This Week</p>
            {recently_issued.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span className="font-medium">{badge.learner_name}</span>
                <span className="text-gray-400 truncate">— {badge.badge_title}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

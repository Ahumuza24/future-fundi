import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import type { EligibleLearner, MicrocredentialReadinessData } from "../teacher-dashboard-types";

interface Props {
  data: MicrocredentialReadinessData;
  onSelectLearner: (learnerId: string) => void;
  onIssueMicrocredential: (learner: EligibleLearner) => void;
}

export default function MicrocredentialReadinessPanel({
  data,
  onSelectLearner,
  onIssueMicrocredential,
}: Props) {
  const { eligible, not_yet_eligible } = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap className="h-4 w-4 text-purple-500" />
          Microcredential Readiness
          {eligible.length > 0 && (
            <span className="ml-auto bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {eligible.length} eligible
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-72 overflow-auto">
        {eligible.length === 0 && not_yet_eligible.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No active module progress.</p>
        )}
        {eligible.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Ready to Issue</p>
            {eligible.map((learner) => (
              <div
                key={learner.learner_id}
                className="bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => onSelectLearner(learner.learner_id)}
                  className="w-full text-left"
                >
                  <div className="text-xs font-semibold text-gray-800">{learner.learner_name}</div>
                  <div className="text-xs text-green-700">{learner.module}</div>
                  {learner.microcredential_template && (
                    <div className="text-xs text-gray-400">{learner.microcredential_template}</div>
                  )}
                </button>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className={`text-[10px] ${learner.evidence_ids.length > 0 ? "text-green-700" : "text-red-500"}`}>
                    {learner.evidence_ids.length > 0
                      ? `${learner.evidence_ids.length} verified evidence`
                      : "No verified evidence"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIssueMicrocredential(learner)}
                    disabled={!learner.microcredential_template_id || learner.evidence_ids.length === 0}
                    className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {not_yet_eligible.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Not Yet Ready</p>
            {not_yet_eligible.slice(0, 6).map((learner) => (
              <button
                key={learner.learner_id}
                onClick={() => onSelectLearner(learner.learner_id)}
                className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <div className="text-xs font-semibold text-gray-800">{learner.learner_name}</div>
                <div className="text-xs text-gray-500 truncate">{learner.module}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {learner.missing.map((item) => (
                    <span key={item} className="text-[10px] bg-red-50 text-red-600 border border-red-100 rounded px-1">
                      {item}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

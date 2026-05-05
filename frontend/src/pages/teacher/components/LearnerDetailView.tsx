import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Leaf, Star, BookOpen, ClipboardList, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DualViewData } from "../teacher-dashboard-types";

interface Props {
  data: DualViewData;
  onBack: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  explorer: "bg-cyan-50 text-cyan-700",
  builder: "bg-lime-50 text-lime-700",
  practitioner: "bg-purple-50 text-purple-700",
  pre_professional: "bg-orange-50 text-orange-700",
};

export default function LearnerDetailView({ data, onBack }: Props) {
  const { learner, learner_content, teacher_content } = data;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cohort
        </button>
        <div className="flex items-center gap-2 ml-2">
          <span className="font-semibold text-gray-900">{learner.name}</span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded capitalize",
              LEVEL_COLORS[learner.level] ?? "bg-gray-100 text-gray-500"
            )}
          >
            {learner.level.replace("_", "-")}
          </span>
          {learner.equity_flag && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded">
              Support flag
            </span>
          )}
        </div>
        {learner.growth && (
          <div className="ml-auto flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5 text-green-500" />
              {learner.growth.leaves_count} artifacts
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              {learner.growth.fruit_count} awards
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Learner perspective — left pane */}
        <div className="space-y-4 overflow-auto">
          {learner_content.module ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-cyan-500" />
                  Current Module
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900">{learner_content.module.name}</div>
                {learner_content.module.outcome_statement && (
                  <p className="text-gray-600 text-xs italic">
                    {learner_content.module.outcome_statement}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width:
                          learner_content.module.units_total > 0
                            ? `${Math.round(
                                (learner_content.module.units_completed /
                                  learner_content.module.units_total) *
                                  100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums">
                    {learner_content.module.units_completed}/{learner_content.module.units_total} units
                  </span>
                </div>
                {learner_content.module.microcredential_eligible && (
                  <span className="text-xs text-emerald-600 font-medium">
                    Ready for microcredential
                  </span>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-gray-400">
                No active module.
              </CardContent>
            </Card>
          )}

          {learner_content.lesson && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Current Lesson</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="font-medium text-gray-900">{learner_content.lesson.title}</div>
                <div className="text-xs text-gray-500">
                  {learner_content.lesson.duration_minutes} min
                </div>
                {learner_content.lesson.learner_objectives.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                    {learner_content.lesson.learner_objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                )}
                {learner_content.lesson.learner_content && (
                  <div className="text-xs text-gray-700 bg-gray-50 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap">
                    {learner_content.lesson.learner_content}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {learner_content.artifacts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Artifacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {learner_content.artifacts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-xs py-1 border-b last:border-0"
                  >
                    <span className="text-gray-800 truncate max-w-[70%]">{a.title}</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        a.status === "approved" && "bg-green-50 text-green-700",
                        a.status === "pending" && "bg-amber-50 text-amber-700",
                        a.status === "rejected" && "bg-red-50 text-red-600"
                      )}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Teacher-only perspective — right pane */}
        <div className="space-y-4 overflow-auto">
          {teacher_content.module_notes && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
                  <ClipboardList className="h-4 w-4" />
                  Facilitator Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-900 whitespace-pre-wrap">
                  {teacher_content.module_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {teacher_content.lesson_guide && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
                  <BookOpen className="h-4 w-4" />
                  Lesson Guide (Teacher Only)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-900 space-y-2">
                {teacher_content.lesson_guide.teacher_content && (
                  <div className="whitespace-pre-wrap max-h-40 overflow-auto">
                    {teacher_content.lesson_guide.teacher_content}
                  </div>
                )}
                {teacher_content.lesson_guide.resource_links.filter((l) => l.type === "teacher")
                  .length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold">Teacher Resources</p>
                    {teacher_content.lesson_guide.resource_links
                      .filter((l) => l.type === "teacher")
                      .map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block underline truncate"
                        >
                          {link.title || link.url}
                        </a>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {teacher_content.task_rubric && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-purple-800">
                  <FileText className="h-4 w-4" />
                  Rubric &amp; Answer Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-purple-900">
                <div className="font-semibold">{teacher_content.task_rubric.task_title}</div>
                {teacher_content.task_rubric.teacher_rubric && (
                  <div>
                    <p className="font-semibold mb-1">Rubric</p>
                    <div className="bg-white/60 rounded p-2 whitespace-pre-wrap max-h-32 overflow-auto">
                      {teacher_content.task_rubric.teacher_rubric}
                    </div>
                  </div>
                )}
                {teacher_content.task_rubric.answer_key && (
                  <div>
                    <p className="font-semibold mb-1">Answer Key</p>
                    <div className="bg-white/60 rounded p-2 whitespace-pre-wrap max-h-32 overflow-auto">
                      {teacher_content.task_rubric.answer_key}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!teacher_content.module_notes &&
            !teacher_content.lesson_guide &&
            !teacher_content.task_rubric && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-gray-400">
                  No teacher content for the current lesson.
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

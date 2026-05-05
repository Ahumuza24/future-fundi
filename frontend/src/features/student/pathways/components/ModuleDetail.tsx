import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ChevronRight, FileText, LockKeyhole, Play, Send, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type {
  HierarchyTask,
  NormalizedMediaResource,
  PathwayModuleWithLevel,
} from '../types';

interface ModuleDetailProps {
  module: PathwayModuleWithLevel | null;
  moduleIndex: number;
  totalModules: number;
  progressPercent: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onMediaSelect: (media: NormalizedMediaResource) => void;
  mediaResources: NormalizedMediaResource[];
  onSubmitTask: (taskId: string, moduleId: string, label: string) => void;
}

export const ModuleDetail = ({
  module,
  moduleIndex,
  totalModules,
  progressPercent,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  onMediaSelect,
  mediaResources,
  onSubmitTask,
}: ModuleDetailProps) => (
  <AnimatePresence mode="wait">
    {module ? (
      <motion.div
        key={module.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    Microcredential {moduleIndex + 1} of {totalModules}
                  </span>
                  {module.badgeName && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {module.badgeName}
                    </span>
                  )}
                  {module.access && !module.access.can_open && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded flex items-center gap-1">
                      <LockKeyhole className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl mb-2">{module.name}</CardTitle>
                <p className="text-gray-600">{module.outcome_statement ?? module.description}</p>
                {module.programTitle && (
                  <p className="text-xs text-gray-400 mt-2">{module.programTitle}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-medium text-gray-700">Module Progress</p>
                <p className="text-2xl font-bold text-[var(--fundi-orange)]">{progressPercent}%</p>
                <Progress value={progressPercent} className="h-2 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {module.access && !module.access.can_open && (
              <LockedNotice detail={module.gate?.detail} />
            )}

            {module.content && (
              <Section title="Learning Content" icon={<FileText className="h-5 w-5 text-gray-500" />}>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {module.content}
                </div>
              </Section>
            )}

            {module.units && module.units.length > 0 && (
              <Section title="Units, Lessons, and Tasks" icon={<FileText className="h-5 w-5 text-gray-500" />}>
                <div className="space-y-3">
                  {module.units.map((unit, unitIndex) => (
                    <div
                      key={unit.id}
                      className={`rounded-lg border p-4 ${
                        unit.access.can_open ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Unit {unitIndex + 1}
                          </p>
                          <h4 className="font-semibold text-gray-900">{unit.title}</h4>
                          {unit.learning_objectives.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {unit.learning_objectives.join(' - ')}
                            </p>
                          )}
                        </div>
                        <GateChip canOpen={unit.access.can_open} detail={unit.gate.detail} />
                      </div>

                      <div className="mt-3 space-y-3">
                        {unit.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className={`rounded-md border px-3 py-3 ${
                              lesson.access.can_open ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-400">Lesson {lessonIndex + 1}</p>
                                <h5 className="text-sm font-semibold text-gray-800">{lesson.title}</h5>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Timer className="h-3 w-3" />
                                  {lesson.duration_minutes} min
                                </div>
                              </div>
                              <GateChip canOpen={lesson.access.can_open} detail={lesson.gate.detail} />
                            </div>

                            {lesson.access.can_open && lesson.learner_content && (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-3">
                                {lesson.learner_content}
                              </p>
                            )}

                            {lesson.tasks.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {lesson.tasks.map((task) => (
                                  <TaskRow
                                    key={task.id}
                                    task={task}
                                    moduleId={module.id}
                                    onSubmitTask={onSubmitTask}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {mediaResources.length > 0 && (
              <Section title="Media Resources" icon={<Play className="h-5 w-5 text-gray-500" />}>
                <p className="text-xs text-gray-500 mb-3">({mediaResources.length} files)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mediaResources.map((media) => (
                    <button
                      key={media.key}
                      type="button"
                      onClick={() => media.url && onMediaSelect(media)}
                      className="border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white group text-left"
                    >
                      <div className="relative h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {renderMediaPreview(media)}
                      </div>
                      <div className="p-2">
                        <p className="font-medium text-xs truncate" title={media.displayName}>
                          {media.displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{media.typeLabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <Button variant="outline" onClick={onPrevious} disabled={!canGoPrevious}>
                Previous
              </Button>
              <Button
                onClick={onNext}
                disabled={!canGoNext}
                className="bg-[var(--fundi-orange)] hover:bg-orange-600"
              >
                Next Microcredential
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ) : (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a microcredential to start learning</p>
        </CardContent>
      </Card>
    )}
  </AnimatePresence>
);

const LockedNotice = ({ detail }: { detail?: string }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 flex gap-3">
    <LockKeyhole className="h-5 w-5 text-gray-400 shrink-0" />
    <div>
      <p className="font-semibold text-gray-800">This microcredential is locked.</p>
      {detail && <p className="mt-1">{detail}</p>}
    </div>
  </div>
);

const GateChip = ({ canOpen, detail }: { canOpen: boolean; detail?: string }) => (
  <span
    title={detail}
    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      canOpen ? 'bg-green-50 text-green-700' : 'bg-gray-200 text-gray-600'
    }`}
  >
    {!canOpen && <LockKeyhole className="h-3 w-3" />}
    {canOpen ? 'Open' : 'Locked'}
  </span>
);

const TaskRow = ({
  task,
  moduleId,
  onSubmitTask,
}: {
  task: HierarchyTask;
  moduleId: string;
  onSubmitTask: (taskId: string, moduleId: string, label: string) => void;
}) => {
  const submitDisabled = !task.access.can_submit;

  return (
    <div className={`rounded-md border p-3 ${task.access.can_open ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-800">{task.title}</p>
            <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-semibold">
              {task.type}
            </span>
            {task.evidence_required && (
              <span className="rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-[10px] font-semibold">
                Evidence required
              </span>
            )}
          </div>
          {task.access.can_open && task.learner_instructions && (
            <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{task.learner_instructions}</p>
          )}
          {!task.access.can_open && task.gate.detail && (
            <p className="text-xs text-gray-500 mt-1">{task.gate.detail}</p>
          )}
        </div>
        {task.evidence_required && (
          <Button
            type="button"
            size="sm"
            variant={submitDisabled ? "outline" : "default"}
            disabled={submitDisabled}
            onClick={() => onSubmitTask(task.id, moduleId, `Submitting evidence for ${task.title}`)}
            className={submitDisabled ? "" : "bg-[var(--fundi-orange)] hover:bg-orange-600"}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Submit
          </Button>
        )}
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => (
  <div className="bg-white rounded-lg p-6 border">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);

const renderMediaPreview = (media: NormalizedMediaResource) => {
  if (media.isImage && media.url) {
    return (
      <img
        src={media.url}
        alt={media.displayName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
    );
  }

  if (media.isVideo) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <Play className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          Video
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-gray-400">
      <FileText className="h-8 w-8 mb-1" />
      <span className="text-xs">{media.typeLabel}</span>
    </div>
  );
};

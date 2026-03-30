import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, BookOpen, CheckCircle, Target, Trophy } from 'lucide-react';
import type { TeacherProgressData } from '../types';

interface ProgressDialogProps {
  open: boolean;
  progress: TeacherProgressData | null;
  loading: boolean;
  saving: boolean;
  confirming: boolean;
  canConfirm: boolean;
  progressForm: {
    completed_module_ids: string[];
    artifacts: number;
    score: number;
  };
  badgeForm: {
    badge_name: string;
    description: string;
  };
  onToggleModule: (moduleId: string) => void;
  onArtifactsChange: (value: number) => void;
  onScoreChange: (value: number) => void;
  onBadgeChange: (field: 'badge_name' | 'description', value: string) => void;
  onSave: () => void;
  onConfirm: () => void;
  onClose: () => void;
  enrollmentCourseName?: string;
  enrollmentLevelName?: string;
}

export const ProgressDialog = ({
  open,
  progress,
  loading,
  saving,
  confirming,
  canConfirm,
  progressForm,
  badgeForm,
  onToggleModule,
  onArtifactsChange,
  onScoreChange,
  onBadgeChange,
  onSave,
  onConfirm,
  onClose,
  enrollmentCourseName,
  enrollmentLevelName,
}: ProgressDialogProps) => (
  <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Update Progress</DialogTitle>
        <DialogDescription>
          {enrollmentCourseName} - {enrollmentLevelName}
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--fundi-purple)] border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading progress data...</p>
        </div>
      ) : progress ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              icon={Target}
              label="Completion"
              value={`${Math.round(progress.completion_percentage)}%`}
              className="bg-blue-50 border-blue-100"
              iconColor="text-blue-600"
            />
            <SummaryCard
              icon={BookOpen}
              label="Microcredentials"
              value={`${progressForm.completed_module_ids.length} / ${progress.requirements.modules.required}`}
              className="bg-cyan-50 border-cyan-100"
              iconColor="text-cyan-600"
            />
            <SummaryCard
              icon={Trophy}
              label="Score"
              value={`${progressForm.score} / ${progress.requirements.assessment.required}`}
              className="bg-orange-50 border-orange-100"
              iconColor="text-orange-600"
            />
          </div>

          <div className="grid gap-6">
            <ModuleSelection
              modules={progress.available_modules ?? []}
              selected={progressForm.completed_module_ids}
              onToggle={onToggleModule}
              required={progress.requirements.modules.required}
            />

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Artifacts Submitted"
                value={progressForm.artifacts}
                onChange={onArtifactsChange}
                helper={`Required: ${progress.requirements.artifacts.required}`}
              />
              <NumberField
                label="Assessment Score (%)"
                value={progressForm.score}
                onChange={onScoreChange}
                helper={`Pass mark: ${progress.requirements.assessment.required}%`}
                highlight={progressForm.score >= progress.requirements.assessment.required}
              />
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Award Badge (Optional)
              </h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge_name">Badge Name</Label>
                  <Input
                    id="badge_name"
                    value={badgeForm.badge_name}
                    placeholder="e.g., Module Master"
                    onChange={(event) => onBadgeChange('badge_name', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge_description">Description</Label>
                  <Input
                    id="badge_description"
                    value={badgeForm.description}
                    placeholder="Reason for awarding this badge"
                    onChange={(event) => onBadgeChange('description', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              {progress.teacher_confirmed ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700">Level Completed</p>
                    <p className="text-sm text-green-600">You have confirmed completion for this level.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Confirm Completion</h4>
                    <p className="text-sm text-gray-500">Mark this level as complete to unlock the next level.</p>
                  </div>
                  <Button onClick={onConfirm} disabled={!canConfirm || confirming}>
                    {confirming ? 'Confirming...' : 'Mark Complete'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No progress data available for this level.</p>
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onSave} disabled={!progress || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className: string;
  iconColor: string;
}

const SummaryCard = ({ icon: Icon, label, value, className, iconColor }: SummaryCardProps) => (
  <div className={`p-4 rounded-lg border text-center ${className}`}>
    <Icon className={`h-6 w-6 mx-auto mb-2 ${iconColor}`} />
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

interface ModuleSelectionProps {
  modules: { id: string; name: string; badge_name?: string }[];
  selected: string[];
  required: number;
  onToggle: (moduleId: string) => void;
}

const ModuleSelection = ({ modules, selected, required, onToggle }: ModuleSelectionProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label>Microcredential Progress</Label>
      <p className="text-xs text-gray-500">Select completed modules for this pathway</p>
    </div>
    {modules.length ? (
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {modules.map((module) => {
          const completed = selected.includes(module.id);
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onToggle(module.id)}
              className={`w-full text-left border rounded-lg p-3 transition ${completed ? 'border-[var(--fundi-cyan)] bg-cyan-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{module.name}</p>
                  {module.badge_name ? <p className="text-xs text-gray-500 truncate">Badge: {module.badge_name}</p> : null}
                </div>
                {completed ? (
                  <CheckCircle className="h-5 w-5 text-[var(--fundi-cyan)] flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-gray-300 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No microcredentials available for this pathway level.</p>
    )}
    <p className="text-xs text-gray-500">Required for completion: {required}</p>
  </div>
);

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
  highlight?: boolean;
}

const NumberField = ({ label, value, onChange, helper, highlight }: NumberFieldProps) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex items-center gap-4">
      <Input type="number" min={0} max={100} value={value} onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)} />
      {highlight ? (
        <span className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
          <CheckCircle className="h-4 w-4" />
          Passing
        </span>
      ) : null}
    </div>
    {helper ? <p className="text-xs text-gray-500">{helper}</p> : null}
  </div>
);

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Check } from 'lucide-react';
import { cmsApi } from '@/lib/api';
import type { HierarchyContext, WizardStep } from './cms-types';
import { WIZARD_STEPS, WIZARD_STEP_LABELS } from './cms-types';
import HierarchyBreadcrumb from './HierarchyBreadcrumb';
import StructuralLimitWarning from './StructuralLimitWarning';

interface ContentWizardProps {
  initialContext?: Partial<HierarchyContext>;
  onComplete: (context: HierarchyContext) => void;
}

interface StepFormState {
  title: string;
  description: string;
  sequence_order: string;
  outcome_statement: string;
  duration_sessions: string;
  teacher_notes: string;
  task_type: string;
}

const EMPTY_FORM: StepFormState = {
  title: '',
  description: '',
  sequence_order: '1',
  outcome_statement: '',
  duration_sessions: '1',
  teacher_notes: '',
  task_type: 'activity',
};

const TASK_TYPES = ['activity', 'quiz', 'project', 'reflection', 'discussion'];

const buildPayload = (
  step: WizardStep,
  form: StepFormState,
  ctx: Partial<HierarchyContext>,
): Record<string, unknown> => {
  const base = {
    title: form.title,
    description: form.description,
    sequence_order: Number(form.sequence_order),
  };
  if (step === 'track') return { ...base, pathway: ctx.pathway!.id };
  if (step === 'program') return { ...base, track: ctx.track!.id };
  if (step === 'module') return {
    ...base,
    program: ctx.program!.id,
    outcome_statement: form.outcome_statement,
    duration_sessions: Number(form.duration_sessions),
    teacher_notes: form.teacher_notes,
  };
  if (step === 'unit') return { ...base, module: ctx.module!.id };
  if (step === 'lesson') return { ...base, unit: ctx.unit!.id };
  if (step === 'task') return { ...base, lesson: ctx.lesson!.id, task_type: form.task_type };
  return base;
};

type ApiCreateFn = (data: unknown) => Promise<{ data: Record<string, unknown> }>;

const API_MAP: Partial<Record<WizardStep, ApiCreateFn>> = {
  pathway: cmsApi.pathways.create,
  track: cmsApi.tracks.create,
  program: cmsApi.programs.create,
  module: cmsApi.modules.create,
  unit: cmsApi.units.create,
  lesson: cmsApi.lessons.create,
  task: cmsApi.tasks.create,
};

export default function ContentWizard({ initialContext = {}, onComplete }: ContentWizardProps) {
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [context, setContext] = useState<Partial<HierarchyContext>>(initialContext);
  const [form, setForm] = useState<StepFormState>(EMPTY_FORM);
  const [warning, setWarning] = useState<string | null>(null);

  const activeStep = WIZARD_STEPS[stepIndex];
  const isReview = activeStep === 'review';
  const progressPct = Math.round((stepIndex / (WIZARD_STEPS.length - 1)) * 100);

  const createMutation = useMutation({
    mutationFn: async () => {
      const createFn = API_MAP[activeStep];
      if (!createFn) throw new Error(`No API for step: ${activeStep}`);
      return createFn(buildPayload(activeStep, form, context));
    },
    onSuccess: (res) => {
      const created = res.data;
      setWarning((created.structural_warning as string) ?? null);
      setContext((prev) => ({ ...prev, [activeStep]: created }));
      queryClient.invalidateQueries({ queryKey: ['cms', `${activeStep}s`] });
      setForm(EMPTY_FORM);
      setStepIndex((i) => i + 1);
    },
  });

  const updateField = (key: keyof StepFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputClass =
    'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-fundi-orange/50 focus:outline-none';

  const renderStepFields = () => {
    if (activeStep === 'module') {
      return (
        <>
          <FieldRow label="Module Title"><input className={inputClass} value={form.title} onChange={updateField('title')} /></FieldRow>
          <FieldRow label="Description"><textarea className={`${inputClass} resize-none`} rows={3} value={form.description} onChange={updateField('description')} /></FieldRow>
          <FieldRow label="Learning Outcome"><textarea className={`${inputClass} resize-none`} rows={2} value={form.outcome_statement} onChange={updateField('outcome_statement')} /></FieldRow>
          <FieldRow label="Duration (sessions)"><input type="number" min={1} className={inputClass} value={form.duration_sessions} onChange={updateField('duration_sessions')} /></FieldRow>
          <FieldRow label="Teacher Notes"><textarea className={`${inputClass} resize-none`} rows={2} value={form.teacher_notes} onChange={updateField('teacher_notes')} /></FieldRow>
          <FieldRow label="Order"><input type="number" min={1} className={inputClass} value={form.sequence_order} onChange={updateField('sequence_order')} /></FieldRow>
        </>
      );
    }
    if (activeStep === 'task') {
      return (
        <>
          <FieldRow label="Task Title"><input className={inputClass} value={form.title} onChange={updateField('title')} /></FieldRow>
          <FieldRow label="Description"><textarea className={`${inputClass} resize-none`} rows={3} value={form.description} onChange={updateField('description')} /></FieldRow>
          <FieldRow label="Task Type">
            <select className={`${inputClass} bg-gray-900`} value={form.task_type} onChange={updateField('task_type')}>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Order"><input type="number" min={1} className={inputClass} value={form.sequence_order} onChange={updateField('sequence_order')} /></FieldRow>
        </>
      );
    }
    return (
      <>
        <FieldRow label={`${WIZARD_STEP_LABELS[activeStep]} Title`}><input className={inputClass} value={form.title} onChange={updateField('title')} /></FieldRow>
        <FieldRow label="Description"><textarea className={`${inputClass} resize-none`} rows={3} value={form.description} onChange={updateField('description')} /></FieldRow>
        <FieldRow label="Order"><input type="number" min={1} className={inputClass} value={form.sequence_order} onChange={updateField('sequence_order')} /></FieldRow>
      </>
    );
  };

  if (isReview) {
    return (
      <div className="flex flex-col gap-6">
        <HierarchyBreadcrumb context={context as HierarchyContext} />
        <div className="rounded-xl border border-fundi-lime/20 bg-fundi-lime/5 p-4 text-sm text-fundi-lime">
          All 7 layers created successfully. Review the hierarchy above and click Finish.
        </div>
        <button
          type="button"
          onClick={() => onComplete(context as HierarchyContext)}
          className="self-end rounded-lg bg-fundi-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-fundi-orange/90 transition-colors"
        >
          Finish
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Step {stepIndex + 1} of {WIZARD_STEPS.length - 1}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5">
          <div className="h-full rounded-full bg-fundi-orange transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
          {WIZARD_STEPS.slice(0, -1).map((step, i) => (
            <div key={step} className={`flex shrink-0 items-center gap-1 text-xs ${i < stepIndex ? 'text-fundi-lime' : i === stepIndex ? 'text-white' : 'text-gray-600'}`}>
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {i < stepIndex && <Check className="h-3 w-3" />}
              {WIZARD_STEP_LABELS[step]}
            </div>
          ))}
        </div>
      </div>

      {context.pathway && (
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
          <HierarchyBreadcrumb context={context as HierarchyContext} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-white">
          Create {WIZARD_STEP_LABELS[activeStep]}
        </h3>
        {renderStepFields()}
      </div>

      <StructuralLimitWarning message={warning} />

      {createMutation.isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {(createMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save. Please try again.'}
        </div>
      )}

      <button
        type="button"
        disabled={!form.title.trim() || createMutation.isPending}
        onClick={() => createMutation.mutate()}
        className="self-end rounded-lg bg-fundi-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-fundi-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createMutation.isPending ? 'Saving…' : 'Save & Continue'}
      </button>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  );
}

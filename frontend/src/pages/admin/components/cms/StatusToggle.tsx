import { useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import type { ContentStatus } from './cms-types';
import { STATUS_LABELS, STATUS_COLORS } from './cms-types';

interface StatusToggleProps {
  currentStatus: ContentStatus;
  requiresReview?: boolean;
  onStatusChange: (newStatus: ContentStatus) => void;
  disabled?: boolean;
}

const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ['active', 'archived'],
  active: ['archived'],
  archived: ['draft'],
};

const CONFIRM_MESSAGES: Partial<Record<ContentStatus, string>> = {
  active: 'Publishing makes this content visible to learners. Ensure peer review is complete before publishing.',
  archived: 'Archiving hides this content from learners. You can restore it to draft later.',
};

export default function StatusToggle({
  currentStatus,
  requiresReview = false,
  onStatusChange,
  disabled = false,
}: StatusToggleProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ContentStatus | null>(null);

  const available = TRANSITIONS[currentStatus];
  const blockPublish = currentStatus === 'draft' && requiresReview;

  const handleSelect = (next: ContentStatus) => {
    setOpen(false);
    if (CONFIRM_MESSAGES[next]) {
      setPending(next);
    } else {
      onStatusChange(next);
    }
  };

  const confirmTransition = () => {
    if (pending) {
      onStatusChange(pending);
      setPending(null);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity ${STATUS_COLORS[currentStatus]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
      >
        {STATUS_LABELS[currentStatus]}
        {!disabled && <ChevronDown className="h-3 w-3" />}
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-36 rounded-lg border border-white/10 bg-gray-900 shadow-xl">
          {available.map((next) => {
            const isPublish = next === 'active';
            const blocked = isPublish && blockPublish;
            return (
              <button
                key={next}
                type="button"
                disabled={blocked}
                onClick={() => !blocked && handleSelect(next)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${blocked ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/5'}`}
              >
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[next]}`}>
                  {STATUS_LABELS[next]}
                </span>
                {blocked && (
                  <span className="ml-auto text-xs text-gray-500">needs review</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 max-w-sm rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-fundi-yellow">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-semibold">Confirm status change</span>
            </div>
            <p className="mb-5 text-sm text-gray-300">{CONFIRM_MESSAGES[pending]}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTransition}
                className="rounded-lg bg-fundi-orange px-4 py-2 text-sm font-medium text-white hover:bg-fundi-orange/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

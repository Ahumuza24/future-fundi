import { AlertTriangle } from 'lucide-react';

interface StructuralLimitWarningProps {
  message: string | null | undefined;
}

export default function StructuralLimitWarning({ message }: StructuralLimitWarningProps) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-fundi-yellow/40 bg-fundi-yellow/10 px-3 py-2 text-sm text-fundi-yellow">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

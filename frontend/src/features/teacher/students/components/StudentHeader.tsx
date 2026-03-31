import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface StudentHeaderProps {
  fullName?: string;
  email?: string;
  onBack: () => void;
}

export const StudentHeader = ({ fullName, email, onBack }: StudentHeaderProps) => (
  <div className="flex items-center gap-4">
    <Button variant="ghost" onClick={onBack} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
    <div className="flex-1">
      <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: 'var(--fundi-black)' }}>
        {fullName ?? 'Student'}
      </h1>
      {email ? <p className="text-gray-600">{email}</p> : null}
    </div>
  </div>
);

import { Button } from '@/components/ui/button';
import type { ChangeEvent } from 'react';

interface AttendanceHeaderProps {
  selectedDate: string;
  saving: boolean;
  onDateChange: (value: string) => void;
  onBack: () => void;
  onSave: () => void;
}

export const AttendanceHeader = ({
  selectedDate,
  saving,
  onDateChange,
  onBack,
  onSave,
}: AttendanceHeaderProps) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Button variant="ghost" onClick={onBack} className="p-2">
        <span className="sr-only">Back</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Button>
      <div>
        <h1
          className="heading-font text-3xl md:text-4xl font-bold"
          style={{ color: 'var(--fundi-black)' }}
        >
          Mark Attendance
        </h1>
        <p className="text-gray-600">Record student attendance for today</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <input
        type="date"
        value={selectedDate}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onDateChange(event.target.value)}
        className="px-3 py-2 border rounded-md"
      />
      <Button
        onClick={onSave}
        disabled={saving}
        style={{ backgroundColor: 'var(--fundi-cyan)', color: 'white' }}
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 5h14v14H5z" />
              <polyline points="9 5 9 9 15 9 15 5" />
              <line x1="9" x2="9" y1="15" y2="19" />
              <line x1="15" x2="15" y1="15" y2="19" />
            </svg>
            Save Attendance
          </span>
        )}
      </Button>
    </div>
  </header>
);

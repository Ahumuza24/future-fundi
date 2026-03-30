import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, GraduationCap, School, TrendingUp } from 'lucide-react';

type StatConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  borderColor: string;
  textColor?: string;
};

interface StudentStatsProps {
  currentClass?: string;
  attendanceRate?: number;
  badgesCount?: number;
  credentialsCount?: number;
}

const getAttendanceColor = (rate?: number): string => {
  if (!rate && rate !== 0) return 'var(--fundi-cyan)';
  if (rate >= 90) return 'var(--fundi-lime)';
  if (rate >= 70) return 'var(--fundi-orange)';
  return 'var(--fundi-pink)';
};

export const StudentStats = ({ currentClass, attendanceRate, badgesCount, credentialsCount }: StudentStatsProps) => {
  const stats: StatConfig[] = [
    {
      label: 'Class',
      icon: School,
      value: currentClass || '—',
      borderColor: 'var(--fundi-cyan)',
    },
    {
      label: 'Attendance',
      icon: TrendingUp,
      value: `${attendanceRate ?? 0}%`,
      borderColor: getAttendanceColor(attendanceRate),
      textColor: getAttendanceColor(attendanceRate),
    },
    {
      label: 'Badges',
      icon: Award,
      value: String(badgesCount ?? 0),
      borderColor: 'var(--fundi-orange)',
    },
    {
      label: 'Credentials',
      icon: GraduationCap,
      value: String(credentialsCount ?? 0),
      borderColor: 'var(--fundi-purple)',
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {stats.map(({ borderColor, icon: Icon, label, value, textColor }) => (
        <Card key={label} className="border-l-4" style={{ borderLeftColor: borderColor }}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Icon className="h-4 w-4" />
              <CardDescription>{label}</CardDescription>
            </div>
            <CardTitle className="text-xl" style={textColor ? { color: textColor } : undefined}>
              {value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

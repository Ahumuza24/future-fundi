import { Card, CardContent } from '@/components/ui/card';

interface AttendanceStatsProps {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export const AttendanceStats = ({ present, absent, late, excused }: AttendanceStatsProps) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatCard label="Present" value={present} color="var(--fundi-lime)" />
    <StatCard label="Absent" value={absent} color="var(--fundi-red)" />
    <StatCard label="Late" value={late} color="var(--fundi-orange)" />
    <StatCard label="Excused" value={excused} color="var(--fundi-purple)" />
  </div>
);

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

const StatCard = ({ label, value, color }: StatCardProps) => (
  <Card className="border-l-4" style={{ borderLeftColor: color }}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {value}
          </p>
        </div>
        <span className="h-8 w-8 rounded-full" style={{ backgroundColor: `${color}33` }} />
      </div>
    </CardContent>
  </Card>
);

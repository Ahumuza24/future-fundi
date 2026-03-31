import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Users, XCircle } from 'lucide-react';
import type { AttendanceMap, AttendanceStatus, TeacherAttendanceStudent } from '../types';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  present: { label: 'Present', color: 'var(--fundi-lime)', icon: CheckCircle },
  absent: { label: 'Absent', color: 'var(--fundi-red)', icon: XCircle },
  late: { label: 'Late', color: 'var(--fundi-orange)', icon: Clock },
  excused: { label: 'Excused', color: 'var(--fundi-purple)', icon: AlertCircle },
};

interface StudentGridProps {
  students: TeacherAttendanceStudent[];
  attendance: AttendanceMap;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}

export const StudentGrid = ({ students, attendance, onStatusChange }: StudentGridProps) => {
  if (!students.length) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 text-lg font-semibold mb-2">No Students Found</p>
        <p className="text-gray-500 text-sm">Unable to load students. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((student, index) => {
        const record = attendance[student.id];
        const activeStatus = record?.status ?? 'present';

        return (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.02 }}
          >
            <Card className="border-2">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{student.full_name}</h3>
                  <p className="text-sm text-gray-600">{student.current_class}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    const isActive = activeStatus === status;

                    return (
                      <Button
                        key={`${student.id}-${status}`}
                        onClick={() => onStatusChange(student.id, status)}
                        variant={isActive ? 'default' : 'outline'}
                        className="text-xs"
                        style={
                          isActive
                            ? {
                                backgroundColor: config.color,
                                color: 'white',
                              }
                            : undefined
                        }
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Trophy } from 'lucide-react';
import type { TeacherEnrollment } from '../types';

interface EnrollmentListProps {
  enrollments: TeacherEnrollment[];
  onOpenProgress: (enrollment: TeacherEnrollment) => void;
}

export const EnrollmentList = ({ enrollments, onOpenProgress }: EnrollmentListProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" style={{ color: 'var(--fundi-cyan)' }} />
        Microcredentials
      </CardTitle>
      <CardDescription>Active and past enrollments</CardDescription>
    </CardHeader>
    <CardContent>
      {enrollments.length ? (
        <div className="space-y-3">
          {enrollments.map((enrollment, index) => (
            <motion.div
              key={enrollment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-gray-50 gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{enrollment.course_name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      enrollment.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {enrollment.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Current Level: <span className="font-semibold text-[var(--fundi-purple)]">{enrollment.current_level_name || 'Not Started'}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
              </div>

              <Button
                onClick={() => onOpenProgress(enrollment)}
                style={{ backgroundColor: 'var(--fundi-cyan)', color: 'white' }}
                className="flex items-center gap-2"
                disabled={!enrollment.is_active}
              >
                <Trophy className="h-4 w-4" />
                Update Progress
              </Button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No active enrollments</p>
        </div>
      )}
    </CardContent>
  </Card>
);

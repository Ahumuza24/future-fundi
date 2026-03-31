import { useCallback, useEffect, useMemo, useState } from 'react';
import { teacherAttendanceService } from '../services/teacherAttendanceService';
import type { AttendanceMap, AttendanceRecord, AttendanceStatus, TeacherAttendanceStudent } from '../types';

const buildInitialAttendance = (students: TeacherAttendanceStudent[]): AttendanceMap => {
  const map: AttendanceMap = {};
  students.forEach((student) => {
    map[student.id] = {
      learner_id: student.id,
      status: 'present',
      notes: '',
    } satisfies AttendanceRecord;
  });
  return map;
};

export const useTeacherAttendance = () => {
  const [students, setStudents] = useState<TeacherAttendanceStudent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teacherAttendanceService.listStudents();
      setStudents(data);
      setAttendance(buildInitialAttendance(data));
      setError(null);
    } catch (err) {
      console.error('Failed to load students', err);
      setStudents([]);
      setAttendance({});
      setError('Unable to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const updateAttendance = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      const current = prev[studentId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [studentId]: {
          ...current,
          status,
        },
      };
    });
  }, []);

  const stats = useMemo(() => ({
    present: Object.values(attendance).filter((record) => record.status === 'present').length,
    absent: Object.values(attendance).filter((record) => record.status === 'absent').length,
    late: Object.values(attendance).filter((record) => record.status === 'late').length,
    excused: Object.values(attendance).filter((record) => record.status === 'excused').length,
  }), [attendance]);

  return {
    students,
    attendance,
    stats,
    loading,
    error,
    refresh: fetchStudents,
    updateAttendance,
  };
};

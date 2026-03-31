import { useCallback, useEffect, useState } from 'react';
import { schoolStudentsService } from '../services/schoolStudentsService';
import type { SchoolStudentDetail } from '../types';

interface UseSchoolStudentDetailResult {
  loading: boolean;
  error: string | null;
  student: SchoolStudentDetail | null;
  refresh: () => Promise<void>;
}

export const useSchoolStudentDetail = (
  studentId?: string,
  enabled: boolean = true,
): UseSchoolStudentDetailResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<SchoolStudentDetail | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!studentId || !enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const detail = await schoolStudentsService.getStudentDetail(studentId);
      setStudent(detail);
    } catch (err) {
      console.error('Failed to fetch school student detail', err);
      setError('Unable to load student details. Please try again.');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, enabled]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  return {
    loading,
    error,
    student,
    refresh: fetchStudent,
  };
};

import { useCallback, useEffect, useState } from 'react';
import { teacherStudentsService } from '../services/teacherStudentsService';
import type {
  TeacherBadgeItem,
  TeacherCredentialItem,
  TeacherEnrollment,
  TeacherStudentDetail,
} from '../types';

interface UseTeacherStudentDetailResult {
  loading: boolean;
  error: string | null;
  student: TeacherStudentDetail | null;
  badges: TeacherBadgeItem[];
  credentials: TeacherCredentialItem[];
  enrollments: TeacherEnrollment[];
  refresh: () => Promise<void>;
}

export const useTeacherStudentDetail = (studentId?: string): UseTeacherStudentDetailResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<TeacherStudentDetail | null>(null);
  const [badges, setBadges] = useState<TeacherBadgeItem[]>([]);
  const [credentials, setCredentials] = useState<TeacherCredentialItem[]>([]);
  const [enrollments, setEnrollments] = useState<TeacherEnrollment[]>([]);

  const fetchStudent = useCallback(async () => {
    if (!studentId) {
      return;
    }

    try {
      setLoading(true);
      const response = await teacherStudentsService.getStudentDetail(studentId);
      setStudent(response.student);
      setBadges(response.badges ?? []);
      setCredentials(response.credentials ?? []);
      setEnrollments(response.enrollments ?? []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch student data', err);
      setError('Unable to load student details');
      setStudent(null);
      setBadges([]);
      setCredentials([]);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  return {
    loading,
    error,
    student,
    badges,
    credentials,
    enrollments,
    refresh: fetchStudent,
  };
};

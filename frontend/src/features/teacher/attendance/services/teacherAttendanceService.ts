import { teacherApi } from '@/lib/api';
import type { TeacherAttendanceStudent } from '../types';

interface TeacherStudentsResponse {
  students?: TeacherAttendanceStudent[];
}

export const teacherAttendanceService = {
  async listStudents(): Promise<TeacherAttendanceStudent[]> {
    const response = await teacherApi.students.getAll();
    const data = (response.data ?? {}) as TeacherStudentsResponse;
    return data.students ?? [];
  },
};

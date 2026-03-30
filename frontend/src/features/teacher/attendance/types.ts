export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface TeacherAttendanceStudent {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  current_class: string;
}

export interface AttendanceRecord {
  learner_id: string;
  status: AttendanceStatus;
  notes: string;
}

export type AttendanceMap = Record<string, AttendanceRecord>;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { AttendanceHeader } from './components/AttendanceHeader';
import { AttendanceStats } from './components/AttendanceStats';
import { StudentGrid } from './components/StudentGrid';
import { useTeacherAttendance } from './hooks/useTeacherAttendance';
import { teacherApi } from '@/lib/api';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const {
    students,
    attendance,
    stats,
    loading,
    error,
    refresh,
    updateAttendance,
  } = useTeacherAttendance();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!sessionId) {
      setSaveError('No session selected');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      const payload = Object.values(attendance);

      if (payload.length === 0) {
        setSaveError('No attendance records to save');
        return;
      }

      // Format attendance records for the API
      const attendanceRecords = payload.map((record) => ({
        learner_id: record.learner_id,
        status: record.status,
        notes: record.notes || '',
      }));

      await teacherApi.markAttendance(sessionId, attendanceRecords);

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/teacher');
      }, 1500);
    } catch (err) {
      console.error('Failed to save attendance', err);
      setSaveError('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="h-12 w-12 border-4 border-[var(--fundi-cyan)] border-t-transparent rounded-full animate-spin mx-auto mb-4"
          />
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="px-4 py-2 rounded bg-[var(--fundi-cyan)] text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Display save success state
  if (saveSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Attendance Saved!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Display no session error
  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">No session specified. Please select a session from the dashboard.</p>
        <button
          type="button"
          onClick={() => navigate('/teacher')}
          className="px-4 py-2 rounded bg-[var(--fundi-cyan)] text-white"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {saveError}
          </div>
        )}
        <AttendanceHeader
          selectedDate={selectedDate}
          saving={saving}
          onDateChange={setSelectedDate}
          onBack={() => navigate('/teacher')}
          onSave={handleSave}
        />

        <AttendanceStats
          present={stats.present}
          absent={stats.absent}
          late={stats.late}
          excused={stats.excused}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StudentGrid
            students={students}
            attendance={attendance}
            onStatusChange={updateAttendance}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default MarkAttendance;

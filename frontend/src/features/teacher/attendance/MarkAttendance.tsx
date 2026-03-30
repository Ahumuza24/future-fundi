import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AttendanceHeader } from './components/AttendanceHeader';
import { AttendanceStats } from './components/AttendanceStats';
import { StudentGrid } from './components/StudentGrid';
import { useTeacherAttendance } from './hooks/useTeacherAttendance';

const MarkAttendance = () => {
  const navigate = useNavigate();
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = Object.values(attendance);
      console.log('Saving attendance for date', selectedDate, payload);
      navigate('/teacher');
    } catch (err) {
      console.error('Failed to save attendance', err);
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

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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

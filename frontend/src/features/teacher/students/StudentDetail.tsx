import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { StudentHeader } from './components/StudentHeader';
import { StudentStats } from './components/StudentStats';
import { EnrollmentList } from './components/EnrollmentList';
import { BadgeGrid } from './components/BadgeGrid';
import { CredentialList } from './components/CredentialList';
import { ProgressDialog } from './components/ProgressDialog';
import { useTeacherStudentDetail } from './hooks/useTeacherStudentDetail';
import { useTeacherProgressDialog } from './hooks/useTeacherProgressDialog';
import type { TeacherEnrollment } from './types';

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, error, student, badges, credentials, enrollments, refresh } = useTeacherStudentDetail(id);
  const {
    isOpen,
    loading: progressLoading,
    saving,
    confirming,
    canConfirm,
    selectedEnrollment,
    currentProgress,
    progressForm,
    badgeForm,
    openDialog,
    closeDialog,
    toggleModuleCompletion,
    updateArtifacts,
    updateScore,
    updateBadgeForm,
    saveProgress,
    confirmCompletion,
  } = useTeacherProgressDialog(id);

  const handleOpenProgress = useCallback((enrollment: TeacherEnrollment) => {
    openDialog(enrollment);
  }, [openDialog]);

  const handleSaveProgress = useCallback(async () => {
    await saveProgress();
    await refresh();
  }, [saveProgress, refresh]);

  const handleConfirmProgress = useCallback(async () => {
    await confirmCompletion();
    await refresh();
  }, [confirmCompletion, refresh]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--fundi-cyan)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 space-y-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => refresh()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 space-y-4 text-center">
            <p className="text-gray-600">Student not found</p>
            <Button onClick={() => navigate('/teacher/students')}>Back to Students</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <StudentHeader
          fullName={student.full_name}
          email={student.user_email}
          onBack={() => navigate('/teacher/students')}
        />

        <StudentStats
          currentClass={student.current_class}
          attendanceRate={student.attendance_rate}
          badgesCount={student.badges_count}
          credentialsCount={student.credentials_count}
        />

        <EnrollmentList enrollments={enrollments} onOpenProgress={handleOpenProgress} />

        <div className="grid gap-4 md:grid-cols-2">
          <BadgeGrid badges={badges} />
          <CredentialList credentials={credentials} />
        </div>
      </div>

      <ProgressDialog
        open={isOpen}
        progress={currentProgress}
        loading={progressLoading}
        saving={saving}
        confirming={confirming}
        canConfirm={canConfirm}
        progressForm={progressForm}
        badgeForm={badgeForm}
        onToggleModule={toggleModuleCompletion}
        onArtifactsChange={updateArtifacts}
        onScoreChange={updateScore}
        onBadgeChange={updateBadgeForm}
        onSave={handleSaveProgress}
        onConfirm={handleConfirmProgress}
        onClose={closeDialog}
        enrollmentCourseName={selectedEnrollment?.course_name}
        enrollmentLevelName={selectedEnrollment?.current_level_name}
      />
    </div>
  );
};

export default StudentDetail;

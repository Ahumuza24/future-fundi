import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Award,
  TrendingUp,
  Archive,
  Clock,
  Map,
} from 'lucide-react';
import { useSchoolStudentDetail } from '@/features/school/students/hooks/useSchoolStudentDetail';
import type { SchoolStudentDetail } from '@/features/school/students/types';
import { ArtifactGallery, type ArtifactCardData } from '@/components/common/ArtifactGallery';

const InfoPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-base font-semibold" style={{ color: 'var(--fundi-black)' }}>{value}</p>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
    {message}
  </div>
);

const PathwayPills = ({ student }: { student: SchoolStudentDetail }) => (
  <div className="flex flex-wrap gap-2">
    {student.pathways.length === 0 && <Badge variant="secondary">No pathways</Badge>}
    {student.pathways.map((pathway) => (
      <Badge key={pathway.id} variant="outline" className="gap-1">
        <Map className="h-3 w-3" />
        {pathway.name}
      </Badge>
    ))}
  </div>
);

const ProgressList = ({ student }: { student: SchoolStudentDetail }) => {
  if (student.progress.length === 0) return <EmptyState message="No progress data yet." />;

  return (
    <div className="space-y-4">
      {student.progress.map((item) => (
        <Card key={item.enrollmentId} className="border-gray-200">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--fundi-black)' }}>{item.courseName}</p>
                <p className="text-xs text-gray-500">{item.currentLevel}</p>
              </div>
              <Badge variant="secondary" className="text-sm font-semibold">
                {Math.round(item.completionPercentage)}%
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoPill label="Modules" value={`${item.modulesCompleted}/${item.totalModules}`} />
              <InfoPill label="Artifacts" value={item.artifactsSubmitted} />
              <InfoPill label="Assessment" value={`${item.assessmentScore}%`} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="h-4 w-4 text-[var(--fundi-pink)]" />
              <span>Status: {item.status.replace('_', ' ')}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const BadgeGrid = ({ student }: { student: SchoolStudentDetail }) => {
  if (student.badges.length === 0) return <EmptyState message="No badges awarded yet." />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {student.badges.map((badgeItem) => (
        <Card key={badgeItem.id} className="border-orange-100 bg-orange-50/40">
          <CardContent className="space-y-1 p-4">
            <p className="font-semibold text-orange-600">{badgeItem.name}</p>
            <p className="text-xs text-gray-600">{badgeItem.moduleName ?? 'General badge'}</p>
            <p className="text-xs text-gray-400">
              {badgeItem.awardedAt ? new Date(badgeItem.awardedAt).toLocaleDateString() : 'Pending date'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const AttendanceList = ({ student }: { student: SchoolStudentDetail }) => {
  if (student.attendance.length === 0) return <EmptyState message="No attendance records yet." />;

  return (
    <div className="space-y-3">
      {student.attendance.map((record) => (
        <div key={record.id} className="rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <Clock className="h-4 w-4 text-[var(--fundi-cyan)]" />
            <span>{record.markedAt ? new Date(record.markedAt).toLocaleString() : 'Pending timestamp'}</span>
            <Badge variant="outline" className="capitalize">{record.status}</Badge>
          </div>
          {record.session && (
            <p className="text-xs text-gray-500">
              {record.session.date ? new Date(record.session.date).toLocaleDateString() : 'Unscheduled'} · {record.session.moduleName ?? 'General session'}
            </p>
          )}
          {record.notes && <p className="text-xs text-gray-600">Notes: {record.notes}</p>}
        </div>
      ))}
    </div>
  );
};

const Header = ({ student, onBack }: { student: SchoolStudentDetail; onBack: () => void }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">Student Overview</p>
      <h1 className="heading-font text-3xl font-bold" style={{ color: 'var(--fundi-black)' }}>{student.fullName}</h1>
      <p className="text-sm text-gray-500">
        Class {student.currentClass || 'Unassigned'} · {student.pathways.length} pathway{student.pathways.length === 1 ? '' : 's'}
      </p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>
      <Button className="bg-[var(--fundi-purple)] text-white hover:opacity-90">
        Contact Parent
      </Button>
    </div>
  </div>
);

const SchoolStudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, error, student, refresh } = useSchoolStudentDetail(id);

  const handleBack = useCallback(() => {
    navigate('/school/students');
  }, [navigate]);

  const artifactCards = useMemo<ArtifactCardData[]>(() => {
    if (!student) {
      return [];
    }
    return student.artifacts.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      moduleName: artifact.moduleName,
      submittedAt: artifact.submittedAt,
      reflection: artifact.reflection ?? null,
      status: artifact.status,
      uploadedByStudent: artifact.uploadedByStudent,
      rejectionReason: artifact.rejectionReason ?? null,
      media: artifact.media?.map((media) => ({
        type: media.type,
        url: media.url,
        filename: media.filename,
        thumbnailUrl: media.thumbnailUrl,
      })) ?? [],
    }));
  }, [student]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--fundi-cyan)]" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="mx-auto max-w-lg border-red-100">
          <CardContent className="space-y-4 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <p className="text-gray-600">{error || 'Student not found.'}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={refresh}>Retry</Button>
              <Button onClick={handleBack} className="bg-[var(--fundi-purple)] text-white hover:opacity-90">Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Header student={student} onBack={handleBack} />

        <div className="grid gap-4 md:grid-cols-3">
          <InfoPill label="Media Consent" value={student.consentMedia ? 'Granted' : 'Not Granted'} />
          <InfoPill label="Equity Flag" value={student.equityFlag ? 'Enabled' : 'None'} />
          <InfoPill label="Joined" value={student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : 'Unknown'} />
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--fundi-black)' }}>
              <Map className="h-5 w-5 text-[var(--fundi-purple)]" />
              Pathways
            </div>
            <PathwayPills student={student} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--fundi-black)' }}>
              <TrendingUp className="h-5 w-5 text-[var(--fundi-pink)]" />
              Progress
            </div>
            <ProgressList student={student} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--fundi-black)' }}>
              <Award className="h-5 w-5 text-[var(--fundi-orange)]" />
              Badges
            </div>
            <BadgeGrid student={student} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--fundi-black)' }}>
              <Archive className="h-5 w-5 text-[var(--fundi-cyan)]" />
              Artifacts
            </div>
            <ArtifactGallery artifacts={artifactCards} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--fundi-black)' }}>
              <Clock className="h-5 w-5 text-[var(--fundi-lime)]" />
              Attendance History
            </div>
            <AttendanceList student={student} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchoolStudentDetailPage;

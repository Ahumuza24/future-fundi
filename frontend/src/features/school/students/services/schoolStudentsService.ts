import { schoolApi } from '@/lib/api';
import type { SchoolStudentDetail, StudentArtifactMedia, StudentArtifactSummary } from '../types';

type RawProgress = Record<string, unknown>;
type RawBadge = Record<string, unknown>;
type RawArtifact = Record<string, unknown> & { media?: RawArtifactMedia[]; media_refs?: RawArtifactMedia[] };
type RawArtifactMedia = {
  type?: string;
  url?: string;
  filename?: string;
  thumbnail_url?: string;
};
type RawAttendance = Record<string, unknown> & { session?: Record<string, unknown> };
type RawPathway = Record<string, unknown>;
type RawStudentDetail = Record<string, unknown> & {
  progress?: RawProgress[];
  badges?: RawBadge[];
  artifacts?: RawArtifact[];
  attendance?: RawAttendance[];
  pathways?: RawPathway[];
  user?: { username?: string };
};

const mapProgress = (progress: RawProgress[] = []) => {
  return progress.map((item) => ({
    enrollmentId: String(item.enrollment_id ?? item.enrollmentId ?? ''),
    courseId: String(item.course_id ?? item.courseId ?? ''),
    courseName: (item.course_name as string) ?? 'Course',
    currentLevel: (item.current_level as string) ?? 'Not Started',
    completionPercentage: Number(item.completion_percentage ?? 0),
    modulesCompleted: Number(item.modules_completed ?? 0),
    totalModules: Number(item.total_modules ?? 0),
    artifactsSubmitted: Number(item.artifacts_submitted ?? 0),
    assessmentScore: Number(item.assessment_score ?? 0),
    status: (item.status as 'on_track' | 'needs_attention' | 'completed') ?? 'on_track',
  }));
};

const mapBadges = (badges: RawBadge[] = []) => {
  return badges.map((badge) => ({
    id: String(badge.id ?? badge.badge_id ?? ''),
    name: (badge.name as string) ?? (badge.badge_name as string) ?? 'Badge',
    description: (badge.description as string) ?? '',
    moduleName: (badge.module_name as string) ?? null,
    awardedAt: (badge.awarded_at as string) ?? null,
  }));
};

const mapMedia = (mediaItems: RawArtifactMedia[] = []): StudentArtifactMedia[] =>
  mediaItems.map((media) => ({
    type: media?.type ?? 'file',
    url: media?.url ?? null,
    filename: media?.filename ?? null,
    thumbnailUrl: media?.thumbnail_url ?? null,
  }));

const mapArtifacts = (artifacts: RawArtifact[] = []): StudentArtifactSummary[] => {
  return artifacts.map((artifact) => ({
    id: String(artifact.id ?? artifact.artifact_id ?? ''),
    title: (artifact.title as string) ?? 'Artifact',
    submittedAt: (artifact.submitted_at as string) ?? (artifact.created_at as string) ?? '',
    moduleName: (artifact.module_name as string) ?? null,
    status: (artifact.status as string) ?? 'approved',
    uploadedByStudent: Boolean(artifact.uploaded_by_student),
    media: mapMedia(artifact.media ?? artifact.media_refs ?? []),
  }));
};

const mapAttendance = (records: RawAttendance[] = []) => {
  return records.map((record) => ({
    id: String(record.id ?? record.record_id ?? ''),
    status: (record.status as string) ?? 'present',
    notes: (record.notes as string) ?? '',
    markedAt: (record.marked_at as string) ?? '',
    session: record.session
      ? {
          id: String(record.session.id ?? ''),
          date: (record.session.date as string) ?? '',
          moduleName: (record.session.module_name as string) ?? null,
          status: (record.session.status as string) ?? 'scheduled',
        }
      : null,
  }));
};

const mapPathways = (pathways: RawPathway[] = []) => {
  return pathways.map((pathway) => ({
    id: String(pathway.id ?? ''),
    name: (pathway.name as string) ?? 'Pathway',
  }));
};

const mapStudentDetail = (data: RawStudentDetail): SchoolStudentDetail => ({
  id: String(data.id ?? ''),
  firstName: (data.first_name as string) ?? '',
  lastName: (data.last_name as string) ?? '',
  fullName:
    (data.full_name as string) ?? `${(data.first_name as string) ?? ''} ${(data.last_name as string) ?? ''}`.trim(),
  username: (data.username as string) ?? data.user?.username ?? null,
  currentClass: (data.current_class as string) ?? 'Unassigned',
  consentMedia: Boolean(data.consent_media),
  equityFlag: Boolean(data.equity_flag),
  joinedAt: (data.joined_at as string) ?? null,
  parentName: (data.parent_name as string) ?? null,
  pathways: mapPathways(data.pathways),
  progress: mapProgress(data.progress),
  badges: mapBadges(data.badges),
  artifacts: mapArtifacts(data.artifacts),
  attendance: mapAttendance(data.attendance),
});

export const schoolStudentsService = {
  async getStudentDetail(studentId: string): Promise<SchoolStudentDetail> {
    const response = await schoolApi.students.getById(studentId);
    return mapStudentDetail(response.data);
  },
};

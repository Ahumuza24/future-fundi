import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  Camera,
  Circle,
  GraduationCap,
  MapPin,
  School,
  TrendingUp,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import {
  ArtifactCard,
  ArtifactModal,
  MicroCredentialBadge,
  PathwayCard,
  StudentArtifactUploadModal,
} from './components';
import {
  useInvalidateStudentArtifacts,
  useStudentArtifacts,
  useStudentDashboardData,
} from './hooks/useStudentDashboard';
import { getIconComponent } from './utils/display';
import type { StudentArtifact } from './types';

const StudentDashboard = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const [showAllLessons, setShowAllLessons] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState<number | null>(null);

  const invalidateArtifacts = useInvalidateStudentArtifacts();
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isError: dashboardError,
    error: dashboardErrorDetails,
  } = useStudentDashboardData();
  const {
    data: artifactsData,
    isLoading: artifactsLoading,
  } = useStudentArtifacts();
  const artifacts: StudentArtifact[] = useMemo(() => artifactsData ?? [], [artifactsData]);

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Student';

  const closeModal = useCallback(() => setSelectedArtifactIndex(null), []);
  const prevArtifact = useCallback(
    () =>
      setSelectedArtifactIndex((current) =>
        current !== null && current > 0 ? current - 1 : current
      ),
    []
  );
  const nextArtifact = useCallback(
    () =>
      setSelectedArtifactIndex((current) =>
        current !== null && current < artifacts.length - 1 ? current + 1 : current
      ),
    [artifacts.length]
  );

  const handleUploadSuccess = useCallback(() => {
    setIsUploadModalOpen(false);
    invalidateArtifacts();
  }, [invalidateArtifacts]);

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (dashboardError || !dashboardData) {
    const message =
      dashboardErrorDetails instanceof Error
        ? dashboardErrorDetails.message
        : 'Failed to load dashboard data';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const approvedArtifactsCount = artifacts.filter(
    (artifact) => !artifact.status || artifact.status === 'approved'
  ).length;
  const selectedArtifact =
    selectedArtifactIndex !== null ? artifacts[selectedArtifactIndex] : null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatar_url}
              name={fullName}
              size="xl"
              className="hidden md:flex border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="heading-font text-3xl md:text-4xl font-bold mb-1 text-[var(--fundi-black)]">
                Welcome back, {dashboardData.learner.firstName || 'Student'}!
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100">
                  <School className="h-4 w-4 text-gray-500" />
                  {dashboardData.learner.currentSchool || user?.tenant_name || 'Future Fundi Academy'}
                </span>
                {dashboardData.learner.currentClass && (
                  <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {dashboardData.learner.currentClass}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Pathways',
              value: dashboardData.pathways.length,
              color: 'var(--fundi-orange)',
              bg: '#fff7ed',
              border: '#fed7aa',
            },
            {
              label: 'Badges Earned',
              value: dashboardData.badges.filter((badge) => !badge.isLocked).length,
              color: '#7c3aed',
              bg: '#f5f3ff',
              border: '#ddd6fe',
            },
            {
              label: 'Artifacts',
              value: approvedArtifactsCount,
              color: '#059669',
              bg: '#ecfdf5',
              border: '#a7f3d0',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border px-4 py-4 flex flex-col items-center text-center shadow-sm"
              style={{ backgroundColor: stat.bg, borderColor: stat.border }}
            >
              <span className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-font text-xl font-bold text-[var(--fundi-black)]">
                  Upcoming Lessons
                </h2>
                {dashboardData.upcomingLessons.length > 3 && (
                  <button
                    onClick={() => setShowAllLessons((value) => !value)}
                    className="text-sm font-medium text-[var(--fundi-orange)] hover:underline"
                  >
                    {showAllLessons
                      ? 'Show less'
                      : `View all ${dashboardData.upcomingLessons.length}`}
                  </button>
                )}
              </div>
              {dashboardData.upcomingLessons.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(showAllLessons
                    ? dashboardData.upcomingLessons
                    : dashboardData.upcomingLessons.slice(0, 3)
                  ).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                      className="bg-white p-4 rounded-xl shadow-sm border border-l-4 flex flex-col gap-1 hover:shadow-md transition-shadow"
                      style={{ borderLeftColor: event.color }}
                    >
                      <span className="text-xs font-bold text-gray-600 line-clamp-1">
                        {event.fullDate}
                      </span>
                      <p className="font-bold text-gray-900 leading-tight line-clamp-1">
                        {event.microcredential}
                      </p>
                      <p className="text-xs text-gray-500 font-medium truncate">{event.pathway}</p>
                      <p className="text-xs font-semibold mt-1" style={{ color: event.color }}>
                        {event.startTime} – {event.endTime}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-gray-200 text-center col-span-full">
                  <GraduationCap className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm font-medium">No upcoming lessons scheduled yet</p>
                  <p className="text-gray-400 text-xs mt-1">Check back soon for new activities!</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-font text-xl font-bold text-[var(--fundi-black)]">My Pathways</h2>
                {dashboardData.pathways.length > 0 && (
                  <span className="text-xs font-bold text-white bg-[var(--fundi-orange)] px-2.5 py-1 rounded-full">
                    {dashboardData.pathways.length} enrolled
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {dashboardData.pathways.map((pathway, index) => (
                  <motion.div
                    key={pathway.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PathwayCard
                      pathway={{ ...pathway, icon: getIconComponent(pathway.icon) }}
                      onClick={() => navigate(`/student/pathway/${pathway.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="heading-font text-xl font-bold text-[var(--fundi-black)]">
                    My Artifacts
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Your projects submitted in class</p>
                </div>
                <div className="flex items-center gap-3">
                  {artifacts.length > 0 && (
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-full">
                      {artifacts.length}
                    </span>
                  )}
                  <Button
                    size="sm"
                    className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Upload Artifact
                  </Button>
                </div>
              </div>

              {artifactsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((placeholder) => (
                    <div key={placeholder} className="rounded-2xl bg-gray-100 animate-pulse h-44" />
                  ))}
                </div>
              ) : artifacts.length === 0 ? (
                <div className="rounded-2xl bg-white border border-dashed border-gray-200 py-16 text-center shadow-sm">
                  <Camera className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No artifacts yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your teacher will capture your work here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {artifacts.map((artifact, index) => (
                    <ArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      index={index}
                      onClick={() => setSelectedArtifactIndex(index)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {dashboardData.pathways.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--fundi-orange), var(--fundi-purple))' }} />
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[var(--fundi-orange)]" />
                      Pathway Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-5">
                    {dashboardData.pathways.map((pathway) => {
                      const Icon = getIconComponent(pathway.icon);
                      return (
                        <div key={pathway.id} className="cursor-pointer group" onClick={() => navigate(`/student/pathway/${pathway.id}`)}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${pathway.color}20` }}>
                              <Icon className="h-3 w-3" style={{ color: pathway.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate group-hover:text-[var(--fundi-orange)] transition-colors">
                                {pathway.title}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">
                                {pathway.currentModule || 'Starting soon...'}
                              </p>
                            </div>
                            <span className="text-xs font-bold shrink-0" style={{ color: pathway.color }}>
                              {pathway.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden ml-8">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pathway.progress}%` }}
                              transition={{ duration: 0.9, delay: 0.5 }}
                              className="h-1.5 rounded-full"
                              style={{ backgroundColor: pathway.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    My Badges & Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.badges.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-10 w-10 mx-auto text-gray-200 mb-2" />
                      <p className="text-xs text-gray-400">Complete modules to earn badges</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {dashboardData.badges.map((badge) => (
                        <MicroCredentialBadge
                          key={badge.id}
                          credential={{
                            ...badge,
                            icon: badge.icon.startsWith('🏆') ? Award : getIconComponent(badge.icon),
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4 text-xs font-semibold hover:text-[var(--fundi-orange)] hover:border-[var(--fundi-orange)]"
                  >
                    View Full Credential Passport
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <div>
                <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Circle className="h-3 w-3 fill-[var(--fundi-orange)] text-[var(--fundi-orange)]" />
                  Lesson Timeline
                </h3>
                {dashboardData.upcomingLessons.length > 0 ? (
                  <div className="border-l-2 border-gray-100 ml-1.5 space-y-5">
                    {dashboardData.upcomingLessons.map((event) => (
                      <div key={`tl-${event.id}`} className="relative pl-6">
                        <div
                          className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: event.color }}
                        />
                        <p className="text-xs font-bold mb-0.5" style={{ color: event.color }}>
                          {event.fullDate}
                        </p>
                        <p className="text-sm font-bold text-[var(--fundi-black)] leading-snug">
                          {event.microcredential}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                            {event.pathway}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {event.startTime} – {event.endTime}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white border border-dashed border-gray-200 py-10 text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Clear schedule</p>
                    <p className="text-gray-400 text-xs mt-1">Check back later for upcoming lessons</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {selectedArtifact && selectedArtifactIndex !== null && (
        <ArtifactModal
          artifact={selectedArtifact}
          onClose={closeModal}
          onPrev={prevArtifact}
          onNext={nextArtifact}
          hasPrev={selectedArtifactIndex > 0}
          hasNext={selectedArtifactIndex < artifacts.length - 1}
        />
      )}

      <StudentArtifactUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default StudentDashboard;

import {
  MapPin,
  School,
  ArrowRight,
  Star,
  Award,
  Circle,
  Bot,
  Code,
  Palette,
  Briefcase,
  Video,
  Paintbrush,
  Music,
  Beaker,
  GraduationCap,
  FileText,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  Wrench,
  Image,
  Film,
  Link2,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { studentApi, MEDIA_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { PathwayCard } from "@/components/student/PathwayCard";
import { MicroCredentialBadge } from "@/components/student/MicroCredentialBadge";
import { Avatar } from "@/components/ui/avatar";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
const iconMap: Record<string, React.ElementType> = {
  Bot, Code, Palette, Briefcase, Video, Paintbrush, Music, Beaker, GraduationCap,
};
const getIconComponent = (iconName: string): React.ElementType =>
  iconMap[iconName] || GraduationCap;

interface DashboardData {
  learner: {
    id: string; firstName: string; lastName: string; fullName: string;
    currentSchool: string; currentClass: string; age?: number;
  };
  pathways: Array<{
    id: string; title: string; description: string; progress: number;
    currentLevel: string; currentLevelNumber: number; currentModule: string;
    totalLevels: number; currentLevelProgress: number; color: string;
    icon: string; status: "not_started" | "good" | "warning" | "critical";
    microCredentialsEarned: number; totalMicroCredentials: number;
  }>;
  upcomingLessons: Array<{
    id: string; title: string; date: string; time: string; type: string; color: string;
    pathway: string; microcredential: string; fullDate: string; startTime: string; endTime: string;
  }>;
  activeProjects: any[];
  badges: Array<{
    id: string; name: string; description: string; icon: string;
    earnedAt: string | null; earnedDate?: string; type: string;
    pathway: string; color: string; isLocked: boolean;
  }>;
}

interface Artifact {
  id: string;
  title: string;
  reflection: string;
  submitted_at: string | null;
  teacher_name: string;
  media_refs: MediaRef[];
}

interface MediaRef {
  type?: string;
  url?: string;
  filename?: string;
  name?: string;
  label?: string;
  size?: number;
}

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function resolveUrl(raw: string): string {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${MEDIA_BASE_URL}${raw}`;
  return `${MEDIA_BASE_URL}/${raw.replace(/^\.?\//, "")}`;
}

function mediaIcon(ref: MediaRef) {
  const t = (ref.type || "").toLowerCase();
  const n = (ref.filename || ref.name || ref.label || "").toLowerCase();
  if (t === "link")                                                 return { icon: Link2,         label: "Link",       color: "text-blue-500"   };
  if (t.startsWith("image") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(n))
                                                                    return { icon: Image,          label: "Image",      color: "text-emerald-500"};
  if (t.startsWith("video") || /\.(mp4|webm|mov|mkv)$/.test(n))        return { icon: Film,           label: "Video",      color: "text-purple-500" };
  if (t.includes("pdf") || n.endsWith(".pdf"))                     return { icon: FileText,       label: "PDF",        color: "text-red-500"    };
  if (t.includes("word") || /\.docx?$/.test(n))                   return { icon: FileText,       label: "Word",       color: "text-blue-600"   };
  if (t.includes("sheet") || /\.xlsx?$/.test(n))                  return { icon: FileSpreadsheet, label: "Excel",     color: "text-green-600"  };
  if (t.includes("presentation") || /\.pptx?$/.test(n))           return { icon: Presentation,   label: "Slides",     color: "text-orange-500" };
  if (t.includes("zip") || /\.(zip|rar|7z)$/.test(n))             return { icon: FileArchive,    label: "Archive",    color: "text-gray-500"   };
  if (/\.(stl|obj|dwg|dxf|f3d|step|stp)$/.test(n))               return { icon: Wrench,         label: "CAD",        color: "text-cyan-500"   };
  return                                                                   { icon: FileText,       label: "File",       color: "text-gray-500"   };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

/** Determine a pastel card accent colour from the index */
const CARD_ACCENTS = [
  "var(--fundi-orange)", "var(--fundi-purple)", "var(--fundi-cyan)",
  "#10b981", "#f59e0b", "#ec4899", "#3b82f6",
];

/* ─────────────────────────────────────────────────────────
   Artifact Card
───────────────────────────────────────────────────────── */
function ArtifactCard({ artifact, index, onClick }: {
  artifact: Artifact; index: number; onClick: () => void;
}) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const mediaCount = artifact.media_refs?.filter(m => m.url || m.filename || m.type === "link").length ?? 0;
  const firstImage = artifact.media_refs?.find(m =>
    (m.type || "").startsWith("image") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(m.filename || m.name || m.url || "")
  );
  const firstMedia = artifact.media_refs?.find(m => m.url || m.filename || m.type === "link");
  const previewUrl = firstImage?.url ? resolveUrl(firstImage.url) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Image preview or icon thumbnail */}
      {previewUrl ? (
        <div className="h-36 overflow-hidden">
          <img src={previewUrl} alt={artifact.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-36 w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: `${accent}15` }}>
           <div className="absolute inset-0 opacity-20" style={{ backgroundColor: accent }} />
           {firstMedia ? (() => {
               const { icon: Icon, color } = mediaIcon(firstMedia);
               // If there's an icon, use its color (remove text- to just apply style, or rely on tailwind)
               // The mediaIcon gives classNames like "text-blue-500", but we can also just use the icon with the accent color
               return <Icon className="h-14 w-14 z-10" style={{ color: accent }} />
           })() : (
               <FileText className="h-14 w-14 z-10" style={{ color: accent }} />
           )}
        </div>
      )}

      <div className="p-4">
        {/* Caption band */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
            {artifact.title}
          </h3>
          <Camera className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accent }} />
        </div>

        {artifact.reflection && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {artifact.reflection}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatDate(artifact.submitted_at)}</span>
          {mediaCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {mediaCount} file{mediaCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {artifact.teacher_name && (
          <p className="text-xs text-gray-400 mt-1 truncate">By {artifact.teacher_name}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Artifact Detail Modal
───────────────────────────────────────────────────────── */
function ArtifactModal({ artifact, onClose, onPrev, onNext, hasPrev, hasNext }: {
  artifact: Artifact; onClose: () => void;
  onPrev: () => void; onNext: () => void;
  hasPrev: boolean; hasNext: boolean;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const images = (artifact.media_refs || []).filter(m =>
    (m.type || "").startsWith("image") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(m.filename || m.name || m.url || "")
  );
  const otherFiles = (artifact.media_refs || []).filter(m => !images.includes(m));

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl text-gray-900 leading-snug">{artifact.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {artifact.submitted_at && <span>{formatDate(artifact.submitted_at)}</span>}
                {artifact.teacher_name && <span>· Captured by {artifact.teacher_name}</span>}
              </div>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Image gallery */}
            {images.length > 0 && (
              <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {images.map((img, i) => {
                  const url = img.url ? resolveUrl(img.url) : null;
                  if (!url) return null;
                  return (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                       className={`block overflow-hidden rounded-xl ${images.length === 1 ? "h-64" : "h-40"}`}>
                      <img src={url} alt={img.name || img.filename || `Image ${i+1}`}
                           className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Reflection / observation */}
            {artifact.reflection && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Teacher's Observation</p>
                <p className="text-gray-700 leading-relaxed text-sm bg-orange-50 rounded-xl p-4 border border-orange-100">
                  "{artifact.reflection}"
                </p>
              </div>
            )}

            {/* Other attachments */}
            {otherFiles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attached Files</p>
                <div className="space-y-2">
                  {otherFiles.map((ref, i) => {
                    const { icon: Icon, label, color } = mediaIcon(ref);
                    const name = ref.label || ref.name || ref.filename || label;
                    const url = ref.url ? resolveUrl(ref.url) : null;
                    return (
                      <div key={i}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className={`p-2 rounded-lg bg-white border border-gray-100 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                          <p className="text-xs text-gray-400">{label}</p>
                        </div>
                        {url && (
                          <a href={url} target="_blank" rel="noreferrer"
                             className="flex items-center gap-1 text-xs text-[var(--fundi-orange)] hover:underline shrink-0">
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {artifact.media_refs?.length === 0 && !artifact.reflection && (
              <p className="text-sm text-gray-400 text-center py-6">No additional details for this artifact.</p>
            )}
          </div>

          {/* Nav footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Dashboard Component
───────────────────────────────────────────────────────── */
const StudentDashboard = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Student';

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [artifactsLoading, setArtifactsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await studentApi.getDashboard();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchArtifacts = async () => {
      try {
        setArtifactsLoading(true);
        const response = await studentApi.getArtifacts();
        const data = Array.isArray(response.data?.artifacts)
          ? response.data.artifacts
          : Array.isArray(response.data) ? response.data : [];
        setArtifacts(data);
      } catch (err) {
        console.error('Failed to fetch artifacts:', err);
        setArtifacts([]);
      } finally {
        setArtifactsLoading(false);
      }
    };

    fetchDashboardData();
    fetchArtifacts();
  }, []);

  const closeModal = useCallback(() => setSelectedArtifactIndex(null), []);
  const prevArtifact = useCallback(() => setSelectedArtifactIndex(i => (i !== null && i > 0 ? i - 1 : i)), []);
  const nextArtifact = useCallback(() => setSelectedArtifactIndex(i => (i !== null && i < artifacts.length - 1 ? i + 1 : i)), [artifacts.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'No data available'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatar_url}
              name={fullName}
              size="xl"
              className="hidden md:flex border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2 text-[var(--fundi-black)]">
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

          <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
            <p className="text-sm font-medium text-gray-500">Upcoming Lessons</p>
            <div className="flex w-full md:w-auto">
              {dashboardData.upcomingLessons.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:flex">
                  {dashboardData.upcomingLessons.slice(0, 3).map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white px-4 py-3 rounded-xl shadow-sm border border-l-4 text-left flex flex-col gap-1 w-full md:w-56"
                      style={{ borderLeftColor: event.color }}
                    >
                      <span className="text-xs font-bold text-gray-600 line-clamp-1">{event.fullDate}</span>
                      <p className="font-bold text-gray-900 leading-tight line-clamp-1">{event.microcredential}</p>
                      <p className="text-xs text-gray-500 font-medium truncate">{event.pathway}</p>
                      <p className="text-xs text-[var(--fundi-orange)] font-semibold mt-1">
                        {event.startTime} - {event.endTime}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-dashed border-gray-200 text-xs text-gray-400 italic flex items-center justify-center w-full md:w-64">
                  No upcoming lessons scheduled yet
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8">

          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* My Pathways Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-font text-2xl font-bold text-[var(--fundi-black)]">
                  My Pathways
                </h2>
                <Button variant="ghost" className="text-sm hover:text-[var(--fundi-orange)]">View All</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {dashboardData.pathways.map((pathway, i) => (
                  <motion.div
                    key={pathway.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PathwayCard
                      pathway={{ ...pathway, icon: getIconComponent(pathway.icon) }}
                      onClick={() => navigate(`/student/pathway/${pathway.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Artifacts Section ── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="heading-font text-2xl font-bold text-[var(--fundi-black)]">
                   My Artifacts
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Your Projects submitted in class</p>
                </div>
                {artifacts.length > 0 && (
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-full">
                    {artifacts.length}
                  </span>
                )}
              </div>

              {artifactsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="rounded-2xl bg-gray-100 animate-pulse h-44" />
                  ))}
                </div>
              ) : artifacts.length === 0 ? (
                <div className="rounded-2xl bg-white border border-dashed border-gray-200 py-16 text-center">
                  <Camera className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No artifacts yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your teacher will capture your work here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {artifacts.map((artifact, i) => (
                    <ArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      index={i}
                      onClick={() => setSelectedArtifactIndex(i)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-8">

            {/* Badges & Microcredentials */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-400" />
                    My Badges & Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {dashboardData.badges.map((badge) => (
                      <MicroCredentialBadge
                        key={badge.id}
                        credential={{
                          ...badge,
                          icon: badge.icon.startsWith('🏆') ? Award : getIconComponent(badge.icon)
                        }}
                      />
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 text-xs font-medium hover:text-[var(--fundi-orange)]">
                    View Full Credential Passport
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Timeline */}
            <div className="pt-4">
              <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                <Circle className="h-3 w-3 fill-current" />
                Timeline
              </h3>
              {dashboardData.upcomingLessons.length > 0 ? (
                <div className="border-l-2 border-gray-100 ml-1.5 space-y-6">
                  {dashboardData.upcomingLessons.map((event) => (
                    <div key={`tl-${event.id}`} className="relative pl-6">
                      <div
                        className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: event.color }}
                      />
                      <p className="text-xs text-[var(--fundi-orange)] font-bold mb-0.5">{event.fullDate}</p>
                      <p className="text-sm font-bold text-[var(--fundi-black)]">{event.microcredential}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                          {event.pathway}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {event.startTime} - {event.endTime}
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

          </div>
        </div>
      </div>

      {/* Artifact Detail Modal */}
      {selectedArtifactIndex !== null && (
        <ArtifactModal
          artifact={artifacts[selectedArtifactIndex]}
          onClose={closeModal}
          onPrev={prevArtifact}
          onNext={nextArtifact}
          hasPrev={selectedArtifactIndex > 0}
          hasNext={selectedArtifactIndex < artifacts.length - 1}
        />
      )}
    </div>
  );
};

export default StudentDashboard;

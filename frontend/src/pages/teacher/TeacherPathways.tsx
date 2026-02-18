import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { courseApi, MEDIA_BASE_URL } from "@/lib/api";
import {
  Award,
  ArrowLeft,
  Loader2,
  Sparkles,
  Briefcase,
  BookOpen,
  FileText,
  Image,
  Wrench,
  Target,
  ExternalLink,
  PlayCircle,
  File,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";

interface CourseModule {
  id: string;
  name: string;
  description?: string;
  content?: string;
  suggested_activities?: Array<{ title?: string; description?: string } | string>;
  materials?: string[];
  competences?: string[];
  media_files?: Array<{ id?: string; name?: string; url?: string; type?: string; content_type?: string }>;
  badge_name?: string;
}

interface CourseSummary {
  id: string;
  name: string;
  description: string;
  modules?: CourseModule[];
  careers?: Array<{ id: string; title: string; description?: string }>;
}

interface CourseDetail extends CourseSummary {}

interface NormalizedMediaItem {
  id: string;
  name: string;
  url: string | null;
  kind: "image" | "video" | "file";
}

const resolveMediaUrl = (media: Record<string, any>): string | null => {
  const raw =
    media?.url || media?.file || media?.path || media?.src || media?.link || "";
  const value = String(raw || "").trim().replace(/\\/g, "/");
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith("//")) {
    return `https:${value}`;
  }
  if (value.startsWith("/")) {
    return `${MEDIA_BASE_URL}${value}`;
  }
  return `${MEDIA_BASE_URL}/${value.replace(/^\.?\//, "")}`;
};

const resolveMediaKind = (media: Record<string, any>, url: string | null): "image" | "video" | "file" => {
  const type = String(media?.content_type || media?.type || "").toLowerCase();
  const source = String(url || "").toLowerCase();

  if (
    type.includes("image") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/.test(source)
  ) {
    return "image";
  }
  if (
    type.includes("video") ||
    /\.(mp4|webm|mov|m4v|ogg)$/.test(source)
  ) {
    return "video";
  }
  return "file";
};

export default function TeacherPathways() {
  const navigate = useNavigate();
  const [pathways, setPathways] = useState<CourseSummary[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<CourseDetail | null>(null);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchPathways();
  }, []);

  const fetchPathways = async () => {
    try {
      setLoading(true);
      const response = await courseApi.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setPathways(data);
    } catch (err) {
      console.error("Failed to fetch pathways:", err);
      setPathways([]);
    } finally {
      setLoading(false);
    }
  };

  const openPathwayDetails = async (pathwayId: string) => {
    try {
      setDetailsLoading(true);
      const response = await courseApi.getById(pathwayId);
      const pathway = response.data as CourseDetail;
      setSelectedPathway(pathway);
      const modules = Array.isArray(pathway.modules) ? pathway.modules : [];
      setSelectedModule(modules.length > 0 ? modules[0] : null);
    } catch (err) {
      console.error("Failed to fetch pathway details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "var(--fundi-cyan)" }} />
          <p className="text-gray-600">Loading pathways...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" onClick={() => navigate("/teacher")} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                All Pathways
              </h1>
            </div>
            <p className="text-gray-600 ml-14">Browse all pathways and their learning details</p>
          </div>
        </header>

        <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pathways</p>
                <p className="text-3xl font-bold" style={{ color: "var(--fundi-purple)" }}>
                  {pathways.length}
                </p>
              </div>
              <Award className="h-10 w-10" style={{ color: "var(--fundi-purple)", opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6" style={{ color: "var(--fundi-purple)" }} />
              Pathways
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pathways.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg">No pathways found</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pathways.map((pathway, index) => (
                  <motion.div
                    key={pathway.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow border-2 h-full flex flex-col">
                      <CardHeader className="flex-1">
                        <CardTitle className="text-lg mb-2">{pathway.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{pathway.description}</CardDescription>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {pathway.modules?.length || 0} modules
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="h-3 w-3" />
                            {pathway.careers?.length || 0} careers
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => openPathwayDetails(pathway.id)}
                          variant="outline"
                          className="w-full"
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedPathway}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPathway(null);
            setSelectedModule(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {detailsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: "var(--fundi-cyan)" }} />
              <p className="text-gray-600">Loading details...</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Award className="h-6 w-6" style={{ color: "var(--fundi-purple)" }} />
                  {selectedPathway?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="font-bold mb-2">Description</h3>
                  <p className="text-gray-700">{selectedPathway?.description || "No description"}</p>
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                    Microcredentials
                  </h3>
                  {selectedPathway?.modules && selectedPathway.modules.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPathway.modules.map((module, moduleIndex) => {
                        const isOpen = selectedModule?.id === module.id;
                        return (
                          <div key={module.id} className="border rounded-lg bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setSelectedModule(isOpen ? null : module)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-500">
                                    Microcredential {moduleIndex + 1}
                                  </span>
                                  {module.badge_name ? (
                                    <Badge className="gap-1" style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}>
                                      <Sparkles className="h-3 w-3" />
                                      {module.badge_name}
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="font-semibold text-gray-900 truncate mt-1">{module.name}</p>
                                {module.description ? (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{module.description}</p>
                                ) : null}
                              </div>
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                            </button>

                            {isOpen ? (
                              <div className="border-t bg-gray-50 p-4 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline">{module.media_files?.length || 0} media</Badge>
                                  <Badge variant="outline">{module.suggested_activities?.length || 0} activities</Badge>
                                  <Badge variant="outline">{module.materials?.length || 0} tools</Badge>
                                  <Badge variant="outline">{module.competences?.length || 0} competencies</Badge>
                                </div>

                                <div className="border rounded-lg bg-white p-4">
                                  <h5 className="font-semibold flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    Course Content
                                  </h5>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                                    {module.content || "No content available."}
                                  </p>
                                </div>

                                <div className="border rounded-lg bg-white p-4">
                                  <h5 className="font-semibold flex items-center gap-2 mb-2">
                                    <Image className="h-4 w-4 text-gray-500" />
                                    Media
                                  </h5>
                                  {(() => {
                                    const mediaItems: NormalizedMediaItem[] = (module.media_files || []).map((media, idx) => {
                                      const url = resolveMediaUrl(media || {});
                                      const kind = resolveMediaKind(media || {}, url);
                                      return {
                                        id: String(media?.id || `${module.id}-${idx}`),
                                        name: media?.name || `Media ${idx + 1}`,
                                        url,
                                        kind,
                                      };
                                    });

                                    if (mediaItems.length === 0) {
                                      return <p className="text-sm text-gray-600">No media resources.</p>;
                                    }

                                    return (
                                      <div className="space-y-2">
                                        {mediaItems.map((media) => (
                                          <div
                                            key={media.id}
                                            className="flex items-center justify-between gap-3 border rounded-md p-3 bg-gray-50"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              {media.kind === "image" ? (
                                                <Image className="h-4 w-4 text-[var(--fundi-cyan)] flex-shrink-0" />
                                              ) : media.kind === "video" ? (
                                                <PlayCircle className="h-4 w-4 text-[var(--fundi-orange)] flex-shrink-0" />
                                              ) : (
                                                <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                              )}
                                              <span className="text-sm text-gray-700 truncate">{media.name}</span>
                                            </div>
                                            {media.url ? (
                                              <a
                                                href={media.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-[var(--fundi-cyan)] hover:underline"
                                              >
                                                Open
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            ) : (
                                              <span className="text-xs text-gray-400">Missing URL</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="border rounded-lg bg-white p-4">
                                  <h5 className="font-semibold flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-gray-500" />
                                    Suggested Activities
                                  </h5>
                                  {module.suggested_activities && module.suggested_activities.length > 0 ? (
                                    <ul className="space-y-2">
                                      {module.suggested_activities.map((activity, idx) => (
                                        <li key={`${module.id}-activity-${idx}`} className="text-sm text-gray-700">
                                          {typeof activity === "string" ? activity : activity.title || "Untitled activity"}
                                          {typeof activity !== "string" && activity.description ? (
                                            <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                                          ) : null}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-600">No suggested activities.</p>
                                  )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="border rounded-lg bg-white p-4">
                                    <h5 className="font-semibold flex items-center gap-2 mb-2">
                                      <Wrench className="h-4 w-4 text-gray-500" />
                                      Tools
                                    </h5>
                                    {module.materials && module.materials.length > 0 ? (
                                      <ul className="space-y-1">
                                        {module.materials.map((material, idx) => (
                                          <li key={`${module.id}-material-${idx}`} className="text-sm text-gray-700">
                                            {material}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-600">No tools/materials listed.</p>
                                    )}
                                  </div>

                                  <div className="border rounded-lg bg-white p-4">
                                    <h5 className="font-semibold flex items-center gap-2 mb-2">
                                      <Target className="h-4 w-4 text-gray-500" />
                                      Competencies
                                    </h5>
                                    {module.competences && module.competences.length > 0 ? (
                                      <ul className="space-y-1">
                                        {module.competences.map((competence, idx) => (
                                          <li key={`${module.id}-competency-${idx}`} className="text-sm text-gray-700">
                                            {competence}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-600">No competencies listed.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No microcredentials found.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                    Careers
                  </h3>
                  {selectedPathway?.careers && selectedPathway.careers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPathway.careers.map((career) => (
                        <div key={career.id} className="border rounded-lg p-3">
                          <p className="font-medium">{career.title}</p>
                          {career.description && <p className="text-sm text-gray-600 mt-1">{career.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No careers linked yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { courseApi } from "@/lib/api";
import {
  Award,
  ArrowLeft,
  Loader2,
  Sparkles,
  Layers,
  Briefcase,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface CourseSummary {
  id: string;
  name: string;
  description: string;
  level_count?: number;
  modules?: Array<{ id: string; name: string; badge_name?: string }>;
  careers?: Array<{ id: string; title: string; description?: string }>;
}

interface CourseLevel {
  id: string;
  level_number: number;
  name: string;
  description?: string;
  learning_outcomes?: string[];
}

interface CourseDetail extends CourseSummary {
  levels?: CourseLevel[];
}

export default function TeacherPathways() {
  const navigate = useNavigate();
  const [pathways, setPathways] = useState<CourseSummary[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<CourseDetail | null>(null);
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
      setSelectedPathway(response.data);
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
                            <Layers className="h-3 w-3" />
                            {pathway.level_count || 0} levels
                          </Badge>
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

      <Dialog open={!!selectedPathway} onOpenChange={() => setSelectedPathway(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                    <Layers className="h-5 w-5" style={{ color: "var(--fundi-lime)" }} />
                    Levels
                  </h3>
                  {selectedPathway?.levels && selectedPathway.levels.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPathway.levels.map((level) => (
                        <div key={level.id} className="border rounded-lg p-3">
                          <p className="font-semibold">Level {level.level_number}: {level.name}</p>
                          {level.description && <p className="text-sm text-gray-600 mt-1">{level.description}</p>}
                          {level.learning_outcomes && level.learning_outcomes.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {level.learning_outcomes.map((outcome, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 mt-0.5 text-[var(--fundi-lime)]" />
                                  <span>{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No levels configured.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                    Modules
                  </h3>
                  {selectedPathway?.modules && selectedPathway.modules.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPathway.modules.map((module) => (
                        <div key={module.id} className="border rounded-lg p-3 flex items-center justify-between">
                          <span className="font-medium">{module.name}</span>
                          {module.badge_name ? (
                            <Badge className="gap-1" style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}>
                              <Sparkles className="h-3 w-3" />
                              {module.badge_name}
                            </Badge>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No modules found.</p>
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

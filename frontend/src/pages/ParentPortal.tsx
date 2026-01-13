import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { childApi } from "@/lib/api";
import {
  Users, Calendar, TrendingUp, Award, ChevronRight,
  Settings, BookOpen, Heart, Target, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChildManagement from "@/components/ChildManagement";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  age?: number;
  date_of_birth?: string;
}

interface ChildDashboard {
  pathway: {
    score: number | null;
    gate: string | null;
  };
  artifacts_count: number;
  weekly_pulse: any;
}

const ParentPortal = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childDashboard, setChildDashboard] = useState<ChildDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchChildDashboard(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childApi.getAll();
      // Handle both paginated and non-paginated responses
      const childrenData = response.data.results || response.data;
      const childrenArray = Array.isArray(childrenData) ? childrenData : [];
      setChildren(childrenArray);

      // Auto-select first child if available
      if (childrenArray.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenArray[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch children:", err);
      setChildren([]); // Ensure it's always an array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchChildDashboard = async (childId: string) => {
    try {
      const response = await childApi.getDashboard(childId);
      setChildDashboard(response.data);
    } catch (err) {
      console.error("Failed to fetch child dashboard:", err);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  const getGateColor = (gate: string | null) => {
    if (!gate) return "var(--fundi-gray)";
    if (gate.includes("GREEN")) return "var(--fundi-lime)";
    if (gate.includes("AMBER")) return "var(--fundi-yellow)";
    return "var(--fundi-orange)";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showManagement) {
    return (
      <div className="min-h-screen p-3 md:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: 'var(--fundi-black)' }}>
              Manage Children
            </h1>
            <Button
              onClick={() => {
                setShowManagement(false);
                fetchChildren();
              }}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Back to Dashboard
            </Button>
          </div>
          <ChildManagement />
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen p-3 md:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-12">
            <Users className="h-20 w-20 mx-auto mb-6 text-gray-400" />
            <h2 className="heading-font text-3xl font-bold mb-4" style={{ color: 'var(--fundi-black)' }}>
              Welcome to Future Fundi!
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Start by adding your children to track their learning journey
            </p>
            <Button
              onClick={() => setShowManagement(true)}
              style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
              className="text-lg px-8 py-6"
            >
              <Plus className="h-6 w-6 mr-2" />
              Add Your First Child
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <header className="stagger flex items-center justify-between" style={{ animationDelay: '0ms' }}>
          <div>
            <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
              Parent Portal
            </h1>
            <p className="text-gray-600">Track your children's growth and celebrate their achievements</p>
          </div>
          <Button
            onClick={() => setShowManagement(true)}
            style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
            className="flex items-center gap-2"
          >
            <Settings className="h-5 w-5" />
            Manage Children
          </Button>
        </header>

        {/* Child Selector */}
        <Card className="stagger border-l-4" style={{ animationDelay: '50ms', borderLeftColor: 'var(--fundi-purple)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
              Your Children ({children.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <motion.div
                  key={child.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`hover:shadow-lg transition-all cursor-pointer ${selectedChildId === child.id ? 'ring-2 ring-purple-500 shadow-lg' : ''
                      }`}
                    onClick={() => setSelectedChildId(child.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{child.full_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {child.age && (
                          <>
                            <Calendar className="h-4 w-4" />
                            {child.age} years old
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    {selectedChildId === child.id && childDashboard && (
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Pathway Score</div>
                            <div className="text-2xl font-bold mono-font" style={{ color: 'var(--fundi-orange)' }}>
                              {childDashboard.pathway.score || "N/A"}
                            </div>
                          </div>
                          {childDashboard.pathway.gate && (
                            <div className="px-3 py-1 rounded" style={{
                              backgroundColor: getGateColor(childDashboard.pathway.gate)
                            }}>
                              <span className="text-sm font-bold">{childDashboard.pathway.gate}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Child Dashboard */}
        <AnimatePresence mode="wait">
          {selectedChild && childDashboard && (
            <motion.div
              key={selectedChildId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Progress Overview */}
              <div className="grid md:grid-cols-3 gap-4 stagger" style={{ animationDelay: '100ms' }}>
                <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-orange)' }}>
                  <CardHeader className="pb-3">
                    <CardDescription>Pathway Score</CardDescription>
                    <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-orange)' }}>
                      {childDashboard.pathway.score || "N/A"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {childDashboard.pathway.score && (
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="h-full rounded-full" style={{
                          width: `${childDashboard.pathway.score}%`,
                          backgroundColor: 'var(--fundi-orange)'
                        }}></div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-cyan)' }}>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Artifacts</CardDescription>
                    <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-cyan)' }}>
                      {childDashboard.artifacts_count}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      Learning portfolio
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-lime)' }}>
                  <CardHeader className="pb-3">
                    <CardDescription>Current Gate</CardDescription>
                    <CardTitle className="text-2xl" style={{
                      color: getGateColor(childDashboard.pathway.gate)
                    }}>
                      {childDashboard.pathway.gate || "Not Set"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      Progress milestone
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="stagger" style={{ animationDelay: '150ms' }}>
                <CardHeader>
                  <CardTitle>Quick Actions for {selectedChild.first_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Button className="justify-between bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200">
                      View Artifacts
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button className="justify-between bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                      Growth Tree
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button className="justify-between bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                      Weekly Pulse
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button className="justify-between bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                      Download Portfolio
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ParentPortal;

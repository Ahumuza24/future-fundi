import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Download, Calendar, TrendingUp, MessageCircle, Heart, Award, ChevronRight } from "lucide-react";

interface Child {
  id: string;
  name: string;
  grade: string;
  pathwayScore: number;
  gate: string;
  recentArtifacts: number;
}

const ParentPortal = () => {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const children: Child[] = [
    { id: "1", name: "Amina Nakato", grade: "Grade 6", pathwayScore: 72, gate: "GREEN", recentArtifacts: 5 },
    { id: "2", name: "David Nakato", grade: "Grade 4", pathwayScore: 65, gate: "AMBER", recentArtifacts: 3 },
  ];

  const selectedChildData = children.find(c => c.id === selectedChild);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <header className="stagger" style={{ animationDelay: '0ms' }}>
          <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
            Parent Portal
          </h1>
          <p className="text-gray-600">Track your children's growth and celebrate their achievements</p>
        </header>

        {/* Child Selector */}
        <Card className="stagger border-l-4" style={{ animationDelay: '50ms', borderLeftColor: 'var(--fundi-purple)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
              Your Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {children.map((child) => (
                <Card 
                  key={child.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    selectedChild === child.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setSelectedChild(child.id)}
                >
                  <CardHeader>
                    <CardTitle>{child.name}</CardTitle>
                    <CardDescription>{child.grade} • {child.recentArtifacts} recent artifacts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Pathway Score</div>
                        <div className="text-2xl font-bold mono-font" style={{ color: 'var(--fundi-orange)' }}>{child.pathwayScore}</div>
                      </div>
                      <div className="px-3 py-1 rounded" style={{ 
                        backgroundColor: child.gate === 'GREEN' ? 'var(--fundi-lime)' : 'var(--fundi-yellow)' 
                      }}>
                        <span className="text-sm font-bold">{child.gate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedChildData && (
          <>
            {/* Progress Overview */}
            <div className="grid md:grid-cols-3 gap-4 stagger" style={{ animationDelay: '100ms' }}>
              <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-orange)' }}>
                <CardHeader className="pb-3">
                  <CardDescription>Pathway Score</CardDescription>
                  <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-orange)' }}>
                    {selectedChildData.pathwayScore}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-full rounded-full" style={{ 
                      width: `${selectedChildData.pathwayScore}%`,
                      backgroundColor: 'var(--fundi-orange)'
                    }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-cyan)' }}>
                <CardHeader className="pb-3">
                  <CardDescription>Artifacts This Term</CardDescription>
                  <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-cyan)' }}>
                    {selectedChildData.recentArtifacts}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">+2 from last week</p>
                </CardContent>
              </Card>

              <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-lime)' }}>
                <CardHeader className="pb-3">
                  <CardDescription>Current Gate</CardDescription>
                  <CardTitle className="text-2xl font-bold">{selectedChildData.gate}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">On track for next level</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Artifacts Feed */}
            <Card className="stagger border-l-4" style={{ animationDelay: '150ms', borderLeftColor: 'var(--fundi-orange)' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6" style={{ color: 'var(--fundi-orange)' }} />
                    Recent Artifacts
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Portfolio
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                      <div className="w-24 h-24 rounded-lg flex-shrink-0" style={{ 
                        background: i % 2 === 0 
                          ? 'linear-gradient(135deg, var(--fundi-cyan), var(--fundi-lime))'
                          : 'linear-gradient(135deg, var(--fundi-orange), var(--fundi-yellow))'
                      }}></div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold mb-1">Solar Panel Prototype {i}</h3>
                            <p className="text-sm text-gray-600 mb-2">Renewable Energy Module • {i} days ago</p>
                          </div>
                          <Award className="h-5 w-5" style={{ color: 'var(--fundi-yellow)' }} />
                        </div>
                        <p className="text-sm italic text-gray-700 mb-3">"I learned how solar cells convert sunlight into electricity and built my own working panel!"</p>
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)', color: 'var(--fundi-orange)' }}>Problem Solving</span>
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(21, 189, 219, 0.1)', color: 'var(--fundi-cyan)' }}>Technical Skills</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Communication Section */}
            <div className="grid md:grid-cols-2 gap-6 stagger" style={{ animationDelay: '200ms' }}>
              <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-purple)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
                    Teacher Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-purple-50">
                      <p className="text-sm font-semibold mb-1">Ms. Nakimuli - Robotics</p>
                      <p className="text-sm text-gray-700">"{selectedChildData.name} showed excellent teamwork during the robot challenge!"</p>
                      <p className="text-xs text-gray-500 mt-2">2 days ago</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50">
                      <p className="text-sm font-semibold mb-1">Mr. Okello - Science</p>
                      <p className="text-sm text-gray-700">"Great progress on the environmental project. Keep it up!"</p>
                      <p className="text-xs text-gray-500 mt-2">1 week ago</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message Teachers
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-pink)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-6 w-6" style={{ color: 'var(--fundi-pink)' }} />
                    Weekly Pulse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">😊</div>
                    <p className="text-sm text-gray-600">Mood: Positive</p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(158, 203, 58, 0.1)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--fundi-lime)' }}>This Week's Win</p>
                      <p className="text-sm text-gray-700">"Finished my robot prototype!"</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--fundi-orange)' }}>This Week's Challenge</p>
                      <p className="text-sm text-gray-700">"Need more practice with coding"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            <Card className="stagger border-l-4" style={{ animationDelay: '250ms', borderLeftColor: 'var(--fundi-cyan)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" style={{ color: 'var(--fundi-cyan)' }} />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-cyan-200 bg-cyan-50">
                    <div>
                      <p className="font-semibold">Deepen Technical Skills</p>
                      <p className="text-sm text-gray-600">Explore advanced robotics modules</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                    <div>
                      <p className="font-semibold">Showcase Portfolio</p>
                      <p className="text-sm text-gray-600">Share work with mentors</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedChild && (
          <Card className="stagger text-center p-12" style={{ animationDelay: '100ms' }}>
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="heading-font text-xl font-semibold mb-2">Select a child to view their progress</h3>
            <p className="text-gray-600">Choose from your children above to see their growth journey</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;

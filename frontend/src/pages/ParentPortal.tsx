import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Download, Calendar, Image as ImageIcon, TrendingUp } from "lucide-react";

interface Child {
  id: string;
  name: string;
  pathwayScore: number;
  gate: string;
  recentArtifacts: number;
}

const ParentPortal = () => {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // Mock data - will be replaced with React Query
  const children: Child[] = [
    { id: "1", name: "Amina Nakato", pathwayScore: 72, gate: "Grow", recentArtifacts: 5 },
    { id: "2", name: "David Okello", pathwayScore: 85, gate: "Thrive", recentArtifacts: 8 },
  ];

  const mockArtifacts = [
    {
      id: "1",
      title: "Solar Panel Prototype",
      module: "Renewable Energy",
      date: "2025-12-15",
      reflection: "Built my first working solar panel! It can charge a phone.",
    },
    {
      id: "2",
      title: "Robot Arm Design",
      module: "Robotics",
      date: "2025-12-10",
      reflection: "Designed a robot arm that can pick up objects.",
    },
    {
      id: "3",
      title: "Water Filter Project",
      module: "Environmental Science",
      date: "2025-12-05",
      reflection: "Created a filter that makes dirty water clean!",
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="stagger" style={{ animationDelay: '0ms' }}>
          <h1 className="heading-font text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
            Parent Portal
          </h1>
          <p className="text-gray-600">Track your child's learning journey</p>
        </header>

        {/* Child Selector */}
        <Card className="stagger border-l-4" style={{ 
          animationDelay: '50ms',
          borderLeftColor: 'var(--fundi-purple)'
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
              Select Your Child
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedChild?.id === child.id
                      ? 'border-[var(--fundi-orange)] bg-orange-50'
                      : 'border-gray-200 hover:border-[var(--fundi-cyan)]'
                  }`}
                >
                  <div className="font-semibold text-lg">{child.name}</div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="mono-font">Score: {child.pathwayScore}</span>
                    <span className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ 
                            backgroundColor: 'var(--fundi-lime)', 
                            color: 'var(--fundi-black)' 
                          }}>
                      {child.gate}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedChild && (
          <>
            {/* Pathway Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="stagger border-l-4" style={{ 
                animationDelay: '100ms',
                borderLeftColor: 'var(--fundi-orange)'
              }}>
                <CardHeader>
                  <CardTitle className="text-xl">Pathway Score</CardTitle>
                  <CardDescription>Current readiness level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mono-font text-4xl font-bold" style={{ color: 'var(--fundi-orange)' }}>
                    {selectedChild.pathwayScore}
                  </div>
                  <div className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold" 
                       style={{ 
                         backgroundColor: 'var(--fundi-lime)', 
                         color: 'var(--fundi-black)' 
                       }}>
                    {selectedChild.gate} Gate
                  </div>
                </CardContent>
              </Card>

              <Card className="stagger border-l-4" style={{ 
                animationDelay: '150ms',
                borderLeftColor: 'var(--fundi-cyan)'
              }}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" style={{ color: 'var(--fundi-cyan)' }} />
                    Artifacts
                  </CardTitle>
                  <CardDescription>This term</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mono-font text-4xl font-bold" style={{ color: 'var(--fundi-cyan)' }}>
                    {selectedChild.recentArtifacts}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Projects completed</p>
                </CardContent>
              </Card>

              <Card className="stagger border-l-4" style={{ 
                animationDelay: '200ms',
                borderLeftColor: 'var(--fundi-pink)'
              }}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" style={{ color: 'var(--fundi-pink)' }} />
                    Progress
                  </CardTitle>
                  <CardDescription>This month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mono-font text-4xl font-bold" style={{ color: 'var(--fundi-pink)' }}>
                    +12
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Points gained</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Tiles Feed */}
            <Card className="stagger" style={{ animationDelay: '250ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Artifacts</CardTitle>
                  <CardDescription>Your child's latest work</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Portfolio
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockArtifacts.map((artifact, index) => (
                    <div 
                      key={artifact.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      style={{ animationDelay: `${300 + index * 50}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-cyan-100 rounded-lg flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="heading-font font-bold text-lg">{artifact.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {artifact.module} • {artifact.date}
                          </p>
                          <p className="text-gray-700 italic">"{artifact.reflection}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Showcase Calendar */}
            <Card className="stagger" style={{ animationDelay: '300ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" style={{ color: 'var(--fundi-yellow-dark)' }} />
                  Upcoming Showcases
                </CardTitle>
                <CardDescription>Events where your child will present their work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-center">
                      <div className="mono-font text-2xl font-bold" style={{ color: 'var(--fundi-yellow-dark)' }}>
                        22
                      </div>
                      <div className="text-xs text-gray-600">DEC</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">End of Term Showcase</h4>
                      <p className="text-sm text-gray-600">10:00 AM - School Hall</p>
                    </div>
                    <Button variant="outline" size="sm">
                      RSVP
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <div className="mono-font text-2xl font-bold text-gray-600">
                        15
                      </div>
                      <div className="text-xs text-gray-600">JAN</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Robotics Competition</h4>
                      <p className="text-sm text-gray-600">2:00 PM - Innovation Lab</p>
                    </div>
                    <Button variant="outline" size="sm">
                      RSVP
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Portfolio */}
            <div className="stagger flex justify-center" style={{ animationDelay: '350ms' }}>
              <Button variant="orange" size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Download Full Portfolio PDF
              </Button>
            </div>
          </>
        )}

        {!selectedChild && (
          <Card className="stagger text-center p-12" style={{ animationDelay: '100ms' }}>
            <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="heading-font text-xl font-semibold mb-2">Select a child to view their progress</h3>
            <p className="text-gray-600">Choose from the options above to see detailed information</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;

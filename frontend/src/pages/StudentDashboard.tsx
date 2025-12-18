import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GrowthTree from "@/components/GrowthTree";
import { TrendingUp, Award, Target, Heart, Sparkles, BookOpen, Calendar } from "lucide-react";

const StudentDashboard = () => {
  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <header className="stagger flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ animationDelay: '0ms' }}>
          <div>
            <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
              Your Growth Journey
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Track your progress from curiosity to career</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Week 12, Term 2</span>
          </div>
        </header>

        {/* Pathway Score Card - Enhanced */}
        <Card className="stagger border-l-4 shadow-lg hover:shadow-xl transition-shadow" style={{ 
          animationDelay: '50ms',
          borderLeftColor: 'var(--fundi-orange)',
          borderLeftWidth: '6px'
        }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}>
                    <Target className="h-5 w-5 md:h-6 md:w-6" style={{ color: 'var(--fundi-orange)' }} />
                  </div>
                  Pathway Score
                </CardTitle>
                <CardDescription className="mt-2">Your current readiness level</CardDescription>
              </div>
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--fundi-lime)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--fundi-black)' }}>GREEN</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mono-font text-6xl md:text-7xl font-bold mb-4" style={{ color: 'var(--fundi-orange)' }}>
                  72
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" 
                       style={{ 
                         width: '72%',
                         background: 'linear-gradient(90deg, var(--fundi-orange), var(--fundi-orange-light))'
                       }}>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Pathway Readiness</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--fundi-yellow)' }} />
                    <span className="text-sm font-medium">Interest</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-orange)' }}>75</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" style={{ color: 'var(--fundi-cyan)' }} />
                    <span className="text-sm font-medium">Skill</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-cyan)' }}>68</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" style={{ color: 'var(--fundi-pink)' }} />
                    <span className="text-sm font-medium">Enjoyment</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-pink)' }}>80</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Two Moves - Enhanced */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="stagger border-l-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1" style={{ 
            animationDelay: '100ms',
            borderLeftColor: 'var(--fundi-cyan)',
            borderLeftWidth: '6px'
          }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(21, 189, 219, 0.1)' }}>
                  <TrendingUp className="h-6 w-6" style={{ color: 'var(--fundi-cyan)' }} />
                </div>
                <div>
                  <CardTitle className="text-xl">Next Move: Deepen</CardTitle>
                  <CardDescription>Build on your strengths</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-700">Your interest and skills are strong! Time to go deeper into advanced concepts.</p>
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span>3 advanced modules available</span>
              </div>
              <Button 
                className="w-full font-semibold" 
                style={{ 
                  backgroundColor: 'var(--fundi-cyan)', 
                  color: 'white'
                }}
              >
                Explore Advanced Modules
              </Button>
            </CardContent>
          </Card>

          <Card className="stagger border-l-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1" style={{ 
            animationDelay: '150ms',
            borderLeftColor: 'var(--fundi-purple)',
            borderLeftWidth: '6px'
          }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(154, 69, 154, 0.1)' }}>
                  <Award className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
                </div>
                <div>
                  <CardTitle className="text-xl">Next Move: Showcase</CardTitle>
                  <CardDescription>Share your work</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-700">You have 5 artifacts ready to showcase to parents and mentors!</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white" 
                         style={{ backgroundColor: `var(--fundi-${i % 2 === 0 ? 'orange' : 'cyan'})` }}>
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--fundi-purple)' }}>5 artifacts</span>
              </div>
              <Button variant="outline" className="w-full font-semibold border-2">
                Prepare Portfolio
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Pulse - Enhanced */}
        <Card className="stagger border-l-4 shadow-md" style={{ 
          animationDelay: '200ms',
          borderLeftColor: 'var(--fundi-pink)',
          borderLeftWidth: '6px'
        }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(234, 61, 150, 0.1)' }}>
                  <Heart className="h-6 w-6" style={{ color: 'var(--fundi-pink)' }} />
                </div>
                <div>
                  <CardTitle>Weekly Pulse</CardTitle>
                  <CardDescription>How are you feeling this week?</CardDescription>
                </div>
              </div>
              <div className="text-4xl">😊</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(158, 203, 58, 0.1)' }}>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--fundi-lime)' }} />
                  This week's win:
                </label>
                <p className="text-gray-700 italic text-sm md:text-base">"Completed my first robot prototype!"</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: 'var(--fundi-orange)' }} />
                  This week's worry:
                </label>
                <p className="text-gray-700 italic text-sm md:text-base">"Need more time for coding practice"</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Mood Score:</span> 75/100
              </div>
              <Button 
                size="sm" 
                className="font-semibold"
                style={{ 
                  backgroundColor: 'var(--fundi-lime)', 
                  color: 'var(--fundi-black)'
                }}
              >
                Update This Week
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Growth Tree Visualization */}
        <div className="stagger" style={{ animationDelay: '250ms' }}>
          <GrowthTree />
        </div>

        {/* Recent Artifacts - Enhanced */}
        <div className="stagger" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-font text-2xl md:text-3xl font-bold" style={{ color: 'var(--fundi-black)' }}>
              Recent Artifacts
            </h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card 
                key={i} 
                className="hover:scale-105 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                <div 
                  className="h-40 bg-gradient-to-br rounded-t-lg relative overflow-hidden"
                  style={{
                    background: i % 3 === 0 
                      ? 'linear-gradient(135deg, var(--fundi-orange), var(--fundi-orange-light))'
                      : i % 3 === 1
                      ? 'linear-gradient(135deg, var(--fundi-cyan), var(--fundi-lime))'
                      : 'linear-gradient(135deg, var(--fundi-purple), var(--fundi-pink))'
                  }}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-xs font-bold text-white bg-black/30">
                    Week {i}
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Robot Prototype {i}</CardTitle>
                  <CardDescription className="text-xs">Robotics Module • {i} days ago</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Upload, CheckCircle, FileText, Camera } from "lucide-react";

interface Student {
  id: string;
  name: string;
  present: boolean;
}

const TeacherCapture = () => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [artifactForm, setArtifactForm] = useState({
    studentId: "",
    title: "",
    module: "",
    reflection: "",
  });

  // Mock data - will be replaced with React Query
  const classes = [
    { id: "1", name: "Robotics - Grade 6A", students: 24 },
    { id: "2", name: "Environmental Science - Grade 7B", students: 28 },
    { id: "3", name: "Renewable Energy - Grade 8C", students: 22 },
  ];

  const mockStudents: Student[] = [
    { id: "1", name: "Amina Nakato", present: true },
    { id: "2", name: "David Okello", present: true },
    { id: "3", name: "Sarah Achieng", present: false },
    { id: "4", name: "John Mugisha", present: true },
    { id: "5", name: "Grace Nambi", present: true },
    { id: "6", name: "Peter Omondi", present: true },
  ];

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSubmitArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    // Will integrate with API
    console.log("Submitting artifact:", artifactForm);
    // Reset form
    setArtifactForm({ studentId: "", title: "", module: "", reflection: "" });
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="stagger" style={{ animationDelay: '0ms' }}>
          <h1 className="heading-font text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
            Teacher Capture
          </h1>
          <p className="text-gray-600">Record attendance, submit artifacts, and track progress</p>
        </header>

        {/* Class Selector */}
        <Card className="stagger border-l-4" style={{ 
          animationDelay: '50ms',
          borderLeftColor: 'var(--fundi-orange)'
        }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" style={{ color: 'var(--fundi-orange)' }} />
              Select Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedClass === cls.id
                      ? 'border-[var(--fundi-orange)] bg-orange-50'
                      : 'border-gray-200 hover:border-[var(--fundi-cyan)]'
                  }`}
                >
                  <div className="font-semibold text-lg">{cls.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {cls.students} students
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedClass && (
          <>
            {/* Attendance Section */}
            <Card className="stagger" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" style={{ color: 'var(--fundi-lime)' }} />
                  Class Attendance
                </CardTitle>
                <CardDescription>Mark students present or absent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mockStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => toggleAttendance(student.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        attendance[student.id] ?? student.present
                          ? 'border-[var(--fundi-lime)] bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{student.name}</span>
                        <CheckCircle 
                          className={`h-5 w-5 ${
                            attendance[student.id] ?? student.present
                              ? 'text-green-600'
                              : 'text-red-400'
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Present: <span className="font-semibold mono-font">
                      {mockStudents.filter(s => attendance[s.id] ?? s.present).length}/{mockStudents.length}
                    </span>
                  </div>
                  <Button variant="lime" size="sm">
                    Save Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Artifact Submission */}
            <Card className="stagger" style={{ animationDelay: '150ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-6 w-6" style={{ color: 'var(--fundi-cyan)' }} />
                  Submit Student Artifact
                </CardTitle>
                <CardDescription>Upload photos and record reflections</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitArtifact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Student</label>
                    <select
                      value={artifactForm.studentId}
                      onChange={(e) => setArtifactForm({ ...artifactForm, studentId: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-cyan)]"
                      required
                    >
                      <option value="">Select a student...</option>
                      {mockStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Artifact Title</label>
                    <input
                      type="text"
                      value={artifactForm.title}
                      onChange={(e) => setArtifactForm({ ...artifactForm, title: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-cyan)]"
                      placeholder="e.g., Solar Panel Prototype"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Module</label>
                    <select
                      value={artifactForm.module}
                      onChange={(e) => setArtifactForm({ ...artifactForm, module: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-cyan)]"
                      required
                    >
                      <option value="">Select module...</option>
                      <option value="robotics">Robotics</option>
                      <option value="renewable">Renewable Energy</option>
                      <option value="environmental">Environmental Science</option>
                      <option value="coding">Coding & Programming</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Photo Upload</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[var(--fundi-cyan)] transition-colors cursor-pointer">
                      <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      <input type="file" className="hidden" accept="image/*" multiple />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Student Reflection</label>
                    <textarea
                      value={artifactForm.reflection}
                      onChange={(e) => setArtifactForm({ ...artifactForm, reflection: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-cyan)] min-h-[100px]"
                      placeholder="What did the student learn? What challenges did they overcome?"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" variant="cyan" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Artifact
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setArtifactForm({ studentId: "", title: "", module: "", reflection: "" })}>
                      Clear
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Quick Assessment Entry */}
            <Card className="stagger" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
                  Mini-Assessment Entry
                </CardTitle>
                <CardDescription>Record quick skill assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Student</label>
                    <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-purple)]">
                      <option value="">Select student...</option>
                      {mockStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Skill Area</label>
                    <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-purple)]">
                      <option value="">Select skill...</option>
                      <option value="problem-solving">Problem Solving</option>
                      <option value="teamwork">Teamwork</option>
                      <option value="technical">Technical Skills</option>
                      <option value="communication">Communication</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-purple)]"
                      placeholder="75"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      Save Assessment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Report */}
            <div className="stagger flex justify-center gap-4" style={{ animationDelay: '250ms' }}>
              <Button variant="orange" size="lg">
                <FileText className="h-5 w-5 mr-2" />
                Export Class Report
              </Button>
            </div>
          </>
        )}

        {!selectedClass && (
          <Card className="stagger text-center p-12" style={{ animationDelay: '100ms' }}>
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="heading-font text-xl font-semibold mb-2">Select a class to begin</h3>
            <p className="text-gray-600">Choose from your classes above to record attendance and submit artifacts</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherCapture;

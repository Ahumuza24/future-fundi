import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { teacherApi } from "@/lib/api";
import { getSelectedTeacherSchoolId, setSelectedTeacherSchool } from "@/lib/auth";
import { CheckCircle, Loader2, School } from "lucide-react";

interface SchoolOption {
  id: string;
  name: string;
}

export default function TeacherSchoolSelect() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    getSelectedTeacherSchoolId() || ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await teacherApi.students.getSchools();
        const schoolsData = Array.isArray(response.data)
          ? response.data
          : response.data?.schools || [];
        const preselected = response.data?.selected_school_id;

        setSchools(schoolsData);

        if (preselected && !selectedSchoolId) {
          setSelectedSchoolId(preselected);
        }
      } catch (err) {
        console.error("Failed to fetch teacher schools:", err);
        setError("Failed to load schools. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );

  const handleContinue = () => {
    if (!selectedSchool) {
      return;
    }
    setSelectedTeacherSchool(selectedSchool.id, selectedSchool.name);
    navigate("/teacher", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: "var(--fundi-cyan)" }} />
          <p className="text-gray-600">Loading your schools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>School Selection</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Choose School
          </CardTitle>
          <CardDescription>
            Select the school context for this session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {schools.length === 0 ? (
            <p className="text-sm text-gray-600">
              No school assignment found on your account. Contact an administrator.
            </p>
          ) : (
            schools.map((school) => {
              const selected = school.id === selectedSchoolId;
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => setSelectedSchoolId(school.id)}
                  className={`w-full text-left border rounded-lg px-4 py-3 transition ${
                    selected
                      ? "border-[var(--fundi-cyan)] bg-cyan-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{school.name}</span>
                    {selected && <CheckCircle className="h-4 w-4 text-[var(--fundi-cyan)]" />}
                  </div>
                </button>
              );
            })
          )}

          <Button
            onClick={handleContinue}
            disabled={!selectedSchool}
            className="w-full mt-2"
            style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

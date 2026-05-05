import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, CheckCircle2, XCircle } from "lucide-react";
import { teacherApi } from "@/lib/api";
import { toast } from "@/lib/toast";

interface PendingArtifact {
  id: string;
  title: string;
  learner_name?: string;
  learner?: { first_name: string; last_name: string };
  module_name?: string;
  submitted_at: string;
  uploaded_by_student: boolean;
}

interface Props {
  artifacts: PendingArtifact[];
  onRefresh: () => void;
}

function getLearnerName(artifact: PendingArtifact): string {
  if (artifact.learner_name) return artifact.learner_name;
  if (artifact.learner) return `${artifact.learner.first_name} ${artifact.learner.last_name}`;
  return "Unknown";
}

export default function ArtifactQualityPanel({ artifacts, onRefresh }: Props) {
  const handleReview = async (id: string, action: "approve" | "reject") => {
    try {
      await teacherApi.reviewArtifact(id, { action });
      onRefresh();
    } catch {
      toast.error("Failed to update artifact status.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FileCheck className="h-4 w-4 text-blue-500" />
          Artifact Quality
          {artifacts.length > 0 && (
            <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {artifacts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-auto">
        {artifacts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No pending verifications.</p>
        ) : (
          artifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="flex items-start justify-between gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">{getLearnerName(artifact)}</div>
                <div className="text-xs text-blue-700 truncate">{artifact.title}</div>
                {artifact.module_name && (
                  <div className="text-xs text-gray-400 truncate">{artifact.module_name}</div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleReview(artifact.id, "approve")}
                  className="p-1 rounded hover:bg-green-100 transition-colors"
                  title="Approve"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </button>
                <button
                  onClick={() => handleReview(artifact.id, "reject")}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                  title="Reject"
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

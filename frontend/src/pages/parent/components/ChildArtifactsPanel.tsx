import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChildArtifact } from "../parent-dashboard-types";
import { ARTIFACT_STATUS_COLORS, ARTIFACT_STATUS_LABELS } from "../parent-dashboard-types";

interface Props {
  artifacts: ChildArtifact[];
}

export default function ChildArtifactsPanel({ artifacts }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FolderOpen className="h-4 w-4 text-purple-500" />
          Submitted Work
          <span className="ml-auto text-xs text-gray-400">{artifacts.length} items</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-60 overflow-auto space-y-2">
        {artifacts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No artifacts submitted yet.</p>
        ) : (
          artifacts.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">{a.title}</div>
                {a.module && <div className="text-gray-400 truncate">{a.module}</div>}
                {a.submitted_at && <div className="text-gray-400">{a.submitted_at}</div>}
              </div>
              <span className={cn("shrink-0 px-2 py-0.5 rounded-full font-medium", ARTIFACT_STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600")}>
                {ARTIFACT_STATUS_LABELS[a.status] ?? a.status}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

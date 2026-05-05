import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import type { ChildSession } from "../parent-dashboard-types";

interface Props {
  sessions: ChildSession[];
}

export default function ChildSessionsPanel({ sessions }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-blue-500" />
          Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No upcoming sessions scheduled.</p>
        ) : (
          sessions.map((s, i) => (
            <div key={i} className="flex gap-3 items-start border rounded-lg px-3 py-2">
              <div className="flex flex-col items-center bg-blue-50 rounded-lg px-2 py-1 text-center min-w-[44px]">
                <span className="text-xs font-bold text-blue-700">{s.date?.split("-")[2]}</span>
                <span className="text-xs text-blue-500">{s.date ? new Date(s.date + "T00:00:00").toLocaleString("default", { month: "short" }) : ""}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">{s.module_name || "Session"}</div>
                {(s.start_time || s.end_time) && (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {s.start_time}{s.end_time ? ` – ${s.end_time}` : ""}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

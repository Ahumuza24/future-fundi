import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star } from "lucide-react";
import type { ChildRecognition } from "../parent-dashboard-types";

interface Props {
  data: ChildRecognition;
}

export default function ChildRecognitionPanel({ data }: Props) {
  const total = data.badges.length + data.microcredentials.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-amber-500" />
          Recognition
          {total > 0 && (
            <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {total}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.badges.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Star className="h-3 w-3" /> Badges ({data.badges.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.badges.map((b, i) => (
                <span key={i} title={b.date_awarded ?? ""} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                  {b.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.microcredentials.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Microcredentials ({data.microcredentials.length})
            </p>
            {data.microcredentials.map((mc, i) => (
              <div key={i} className="text-xs bg-emerald-50 border border-emerald-100 rounded px-2 py-1 flex justify-between">
                <span className="font-medium text-emerald-800 truncate">{mc.title}</span>
                <span className="text-gray-400 shrink-0 ml-2">{mc.date_issued ?? ""}</span>
              </div>
            ))}
          </div>
        )}

        {total === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No recognition earned yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

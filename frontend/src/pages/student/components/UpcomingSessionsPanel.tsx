import { Calendar, Clock, Zap } from "lucide-react";
import type { UpcomingLesson } from "../learner-dashboard-types";

const TYPE_STYLE: Record<string, string> = {
  session: "bg-fundi-cyan/10 text-fundi-cyan",
  activity: "bg-fundi-lime/10 text-fundi-lime",
};

const TYPE_LABEL: Record<string, string> = {
  session: "Session",
  activity: "Activity",
};

function SessionRow({ lesson }: { lesson: UpcomingLesson }) {
  const typeStyle = TYPE_STYLE[lesson.type] ?? "bg-[#e8e8e8] text-[#5b5b5b]";
  const typeLabel = TYPE_LABEL[lesson.type] ?? lesson.type;

  return (
    <div className="flex gap-3 items-start py-3 border-b border-[#f1f1f1] last:border-0">
      <div className="flex flex-col items-center min-w-[2.5rem] shrink-0">
        <span className="text-[11px] font-extrabold text-fundi-orange leading-none">{lesson.date}</span>
        <span className="text-[10px] text-[#5b5b5b] mt-0.5">{lesson.time}</span>
      </div>
      <div className="w-px bg-[#e8e8e8] self-stretch shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold text-[#2f2f2f] truncate">{lesson.title}</p>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${typeStyle}`}>
            {typeLabel}
          </span>
        </div>
        <p className="text-[10px] text-[#5b5b5b] truncate mt-0.5">{lesson.pathway}</p>
      </div>
    </div>
  );
}

export default function UpcomingSessionsPanel({ lessons }: { lessons: UpcomingLesson[] }) {
  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-6 bg-fundi-cyan rounded-full shrink-0" />
          <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fundi-cyan" />
            Upcoming Sessions
          </h3>
        </div>
        <p className="text-xs text-[#5b5b5b] text-center py-4">
          No upcoming sessions scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-1 h-6 bg-fundi-cyan rounded-full shrink-0" />
        <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 text-fundi-cyan" />
          Upcoming Sessions
        </h3>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-fundi-cyan/10 text-fundi-cyan px-2.5 py-1 rounded-full">
          <Zap className="h-2.5 w-2.5" />
          {lessons.length} scheduled
        </span>
      </div>

      <div>
        {lessons.map((lesson) => (
          <SessionRow key={lesson.id} lesson={lesson} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#5b5b5b]">
        <Clock className="h-3 w-3" />
        <span>All times in your local timezone</span>
      </div>
    </div>
  );
}

import { CalendarDays, ChevronRight, Clock, Zap } from "lucide-react";
import type { UpcomingLesson } from "../learner-dashboard-types";

const TYPE_STYLE: Record<string, string> = {
  session: "bg-fundi-cyan text-white",
  activity: "bg-fundi-lime text-[#2f2f2f]",
};

const TYPE_LABEL: Record<string, string> = {
  session: "Session",
  activity: "Activity",
};

function SessionRow({ lesson }: { lesson: UpcomingLesson }) {
  const typeStyle = TYPE_STYLE[lesson.type] ?? "bg-[#e8e8e8] text-[#5b5b5b]";
  const typeLabel = TYPE_LABEL[lesson.type] ?? lesson.type;

  return (
    <article className="group flex cursor-pointer gap-4 rounded-xl bg-[#f1f1f1] p-4 transition-all hover:bg-white hover:shadow-[0_8px_24px_rgba(21,189,219,0.12)]">
      <div className="flex min-w-16 shrink-0 flex-col items-center justify-center border-r border-[#dddddd] pr-4">
        <span className="text-xs font-black uppercase leading-none text-[#5b5b5b]">{lesson.date}</span>
        <span className="mt-1 text-[10px] font-extrabold text-fundi-orange">{lesson.time}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="truncate text-sm font-extrabold text-[#2f2f2f] transition-colors group-hover:text-fundi-orange">
          {lesson.title}
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="truncate text-xs text-[#5b5b5b]">{lesson.pathway}</p>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${typeStyle}`}>
            {typeLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center text-fundi-orange">
        <ChevronRight className="h-5 w-5" />
      </div>
    </article>
  );
}

export default function UpcomingSessionsPanel({ lessons }: { lessons: UpcomingLesson[] }) {
  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-6 w-1 shrink-0 rounded-full bg-fundi-orange" />
          <h3 className="heading-font flex items-center gap-2 text-xl font-extrabold text-[#2f2f2f]">
            <CalendarDays className="h-5 w-5 text-fundi-orange" />
            Today&apos;s Learning
          </h3>
        </div>
        <p className="rounded-xl bg-[#f1f1f1] py-8 text-center text-xs text-[#5b5b5b]">
          No upcoming sessions scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-6 w-1 shrink-0 rounded-full bg-fundi-orange" />
        <h3 className="heading-font flex items-center gap-2 text-xl font-extrabold text-[#2f2f2f]">
          <CalendarDays className="h-5 w-5 text-fundi-orange" />
          Today&apos;s Learning
        </h3>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-fundi-cyan/10 px-2.5 py-1 text-[10px] font-bold text-fundi-cyan">
          <Zap className="h-2.5 w-2.5" />
          {lessons.length} scheduled
        </span>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <SessionRow key={lesson.id} lesson={lesson} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-[#5b5b5b]">
        <Clock className="h-3 w-3" />
        <span>All times in your local timezone</span>
      </div>
    </div>
  );
}

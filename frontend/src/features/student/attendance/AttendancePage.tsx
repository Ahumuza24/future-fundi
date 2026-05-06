import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  MessageSquare,
  TimerReset,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { learnerDashboardApi } from "@/lib/api";
import type { LucideIcon } from "lucide-react";
import type {
  AttendanceStatus,
  StudentAttendanceData,
  StudentAttendanceRecord,
} from "@/pages/student/learner-dashboard-types";

const EMPTY_ATTENDANCE: StudentAttendanceData = {
  summary: {
    attendance_rate: 0,
    total_sessions: 0,
    sessions_completed: 0,
    absent: 0,
    late: 0,
    excused: 0,
    current_streak: 0,
  },
  pathways: [],
  records: [],
};

const STATUS_STYLE: Record<AttendanceStatus, { cell: string; label: string; dot: string }> = {
  present: {
    cell: "border-fundi-lime bg-fundi-lime/20 text-[#496400]",
    label: "Present",
    dot: "bg-fundi-lime",
  },
  late: {
    cell: "border-fundi-cyan bg-fundi-cyan/20 text-[#005968]",
    label: "Late",
    dot: "bg-fundi-cyan",
  },
  absent: {
    cell: "border-fundi-red bg-fundi-red/15 text-fundi-red",
    label: "Absent",
    dot: "bg-fundi-red",
  },
  excused: {
    cell: "border-fundi-yellow bg-fundi-yellow/20 text-[#7d6e1c]",
    label: "Excused",
    dot: "bg-fundi-yellow",
  },
};

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  tone: "orange" | "cyan" | "lime" | "dark";
  icon: LucideIcon;
  progress?: number;
}) {
  if (tone === "dark") {
    return (
      <article className="relative overflow-hidden rounded-xl bg-gradient-to-br from-fundi-orange to-fundi-orange-light p-6 text-white shadow-sm">
        <Icon className="mb-4 h-9 w-9" />
        <h3 className="heading-font text-4xl font-black">{value}</h3>
        <p className="text-sm font-extrabold uppercase tracking-wider text-white/80">{label}</p>
      </article>
    );
  }

  const accent = {
    orange: "bg-fundi-orange text-fundi-orange",
    cyan: "bg-fundi-cyan text-fundi-cyan",
    lime: "bg-fundi-lime text-[#496400]",
  }[tone];
  const [barClass, textClass] = accent.split(" ");

  return (
    <article className="relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <span className={`absolute left-0 top-0 h-full w-1 ${barClass}`} />
      {progress !== undefined ? (
        <div className="relative mx-auto mb-4 h-24 w-24">
          <svg className="h-full w-full -rotate-90">
            <circle cx="48" cy="48" r="40" fill="transparent" stroke="#e8e8e8" strokeWidth="8" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="transparent"
              stroke="var(--fundi-orange)"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(0, progress))) / 100}
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="heading-font text-2xl font-black">{value}</span>
          </div>
        </div>
      ) : (
        <Icon className={`mb-4 h-8 w-8 ${textClass}`} />
      )}
      {progress === undefined && <h3 className="heading-font text-4xl font-black text-[#2f2f2f]">{value}</h3>}
      <p className="text-sm font-extrabold uppercase tracking-wider text-[#5b5b5b]">{label}</p>
    </article>
  );
}

function getMonthCells(records: StudentAttendanceRecord[]) {
  const reference = records[0]?.session.date ? new Date(`${records[0].session.date}T12:00:00`) : new Date();
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const statusByDate = new Map(records.map((record) => [record.session.date, record.status]));

  return {
    label: reference.toLocaleDateString("en-UG", { month: "long", year: "numeric" }),
    cells: Array.from({ length: 35 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        day: date.getDate(),
        inMonth: date.getMonth() === month,
        status: statusByDate.get(key) as AttendanceStatus | undefined,
        isToday: key === new Date().toISOString().slice(0, 10),
      };
    }),
  };
}

function CalendarPanel({ records }: { records: StudentAttendanceRecord[] }) {
  const month = useMemo(() => getMonthCells(records), [records]);
  const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)] lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="heading-font text-2xl font-black tracking-tight">{month.label}</h2>
        <div className="flex flex-wrap gap-4">
          {(Object.entries(STATUS_STYLE) as Array<[AttendanceStatus, typeof STATUS_STYLE.present]>).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${style.dot}`} />
              <span className="text-xs font-bold text-[#5b5b5b]">{style.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
        {labels.map((label) => (
          <div key={label} className="mb-1 text-center text-xs font-black text-[#9d9d9d]">
            {label}
          </div>
        ))}
        {month.cells.map((cell) => {
          const style = cell.status ? STATUS_STYLE[cell.status].cell : "";
          return (
            <div
              key={cell.key}
              className={`aspect-square rounded-lg border-2 text-sm font-bold transition-all ${
                cell.status
                  ? style
                  : cell.inMonth
                    ? "border-transparent bg-[#f1f1f1] text-[#777]"
                    : "border-transparent bg-[#fafafa] text-[#d4d4d4]"
              } ${cell.isToday ? "ring-4 ring-fundi-orange/10 border-fundi-orange text-fundi-orange bg-white" : ""} flex items-center justify-center`}
            >
              {cell.day}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PathwayPerformance({ data }: { data: StudentAttendanceData }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <h2 className="heading-font mb-6 text-xl font-black tracking-tight">Pathway Performance</h2>
      <div className="space-y-6">
        {data.pathways.length > 0 ? (
          data.pathways.map((pathway) => (
            <div key={pathway.name} className="group">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-[#2f2f2f]">{pathway.name}</span>
                <span className="text-sm font-black text-fundi-orange">{pathway.attendance_rate}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e8e8e8]">
                <div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-fundi-orange to-fundi-orange-light transition-transform group-hover:scale-x-105"
                  style={{ width: `${pathway.attendance_rate}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] font-medium text-[#777]">{pathway.total_sessions} sessions recorded</p>
            </div>
          ))
        ) : (
          <p className="py-6 text-sm text-[#5b5b5b]">No pathway attendance records yet.</p>
        )}
      </div>
    </section>
  );
}

function RecentHistory({ records }: { records: StudentAttendanceRecord[] }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <h2 className="heading-font mb-6 text-xl font-black tracking-tight">Recent Records</h2>
      <div className="space-y-3">
        {records.slice(0, 6).map((record) => {
          const style = STATUS_STYLE[record.status];
          return (
            <article key={record.id} className="flex gap-3 rounded-xl bg-[#f1f1f1] p-4">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${style.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate text-sm font-extrabold text-[#2f2f2f]">{record.session.title}</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#777]">
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5b5b5b]">
                  {record.session.date}
                  {record.session.start_time ? ` at ${record.session.start_time}` : ""}
                </p>
                <p className="mt-1 truncate text-xs text-[#777]">{record.session.pathway}</p>
              </div>
            </article>
          );
        })}
        {records.length === 0 && (
          <p className="py-6 text-sm text-[#5b5b5b]">Attendance history will appear after sessions are marked.</p>
        )}
      </div>
    </section>
  );
}

export default function AttendancePage() {
  const attendanceQuery = useQuery<StudentAttendanceData>({
    queryKey: ["learner-attendance"],
    queryFn: () => learnerDashboardApi.getAttendance().then((response) => response.data),
  });

  const data = attendanceQuery.data ?? EMPTY_ATTENDANCE;
  const streakLabel = `${data.summary.current_streak} ${data.summary.current_streak === 1 ? "Day" : "Days"}`;

  return (
    <div className="min-h-screen bg-[#f6f6f6] px-3 py-8 text-[#2f2f2f] sm:px-4 lg:px-6">
      <div className="flex w-full flex-col gap-10">
        <header className="relative">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="heading-font mb-2 text-4xl font-black tracking-tight text-[#2f2f2f] md:text-6xl">
                My Attendance
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-[#5b5b5b]">
                Stay consistent. Every attended session is a step toward mastery and verified growth.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" className="gap-2 rounded-full bg-[#dddddd] px-6">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
              <Button variant="orange" className="gap-2 rounded-full px-6">
                <MessageSquare className="h-4 w-4" />
                Request Excuse
              </Button>
            </div>
          </div>
        </header>

        {attendanceQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-4">
            <div className="h-48 animate-pulse rounded-xl bg-white" />
            <div className="h-48 animate-pulse rounded-xl bg-white" />
            <div className="h-48 animate-pulse rounded-xl bg-white" />
            <div className="h-48 animate-pulse rounded-xl bg-white" />
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-4">
            <StatCard
              label="Attendance Rate"
              value={`${data.summary.attendance_rate}%`}
              tone="orange"
              icon={CalendarDays}
              progress={data.summary.attendance_rate}
            />
            <StatCard
              label="Sessions Completed"
              value={String(data.summary.sessions_completed)}
              tone="cyan"
              icon={CheckCircle2}
            />
            <StatCard
              label="Excused Absences"
              value={String(data.summary.excused).padStart(2, "0")}
              tone="lime"
              icon={TimerReset}
            />
            <StatCard
              label="Current Streak"
              value={streakLabel}
              tone="dark"
              icon={Flame}
            />
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalendarPanel records={data.records} />
          </div>
          <div className="flex flex-col gap-6">
            <PathwayPerformance data={data} />
            <section className="rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
              <h2 className="heading-font mb-4 text-xl font-black tracking-tight">Status Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-fundi-lime/10 p-4">
                  <CheckCircle2 className="mb-2 h-5 w-5 text-[#496400]" />
                  <p className="text-2xl font-black">{data.summary.sessions_completed}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b5b5b]">Present / Late</p>
                </div>
                <div className="rounded-lg bg-fundi-red/10 p-4">
                  <XCircle className="mb-2 h-5 w-5 text-fundi-red" />
                  <p className="text-2xl font-black">{data.summary.absent}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b5b5b]">Absent</p>
                </div>
                <div className="rounded-lg bg-fundi-cyan/10 p-4">
                  <Clock className="mb-2 h-5 w-5 text-fundi-cyan" />
                  <p className="text-2xl font-black">{data.summary.late}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b5b5b]">Late</p>
                </div>
                <div className="rounded-lg bg-fundi-yellow/20 p-4">
                  <TimerReset className="mb-2 h-5 w-5 text-[#7d6e1c]" />
                  <p className="text-2xl font-black">{data.summary.excused}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b5b5b]">Excused</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <RecentHistory records={data.records} />
      </div>
    </div>
  );
}

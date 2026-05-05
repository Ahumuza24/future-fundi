import { Award, Star, Trophy } from "lucide-react";
import type { GrowthSummary, CertificationsData } from "../learner-dashboard-types";

const BADGE_COLORS = [
  "bg-fundi-orange/10 text-fundi-orange",
  "bg-fundi-cyan/10 text-fundi-cyan",
  "bg-fundi-lime/10 text-fundi-lime",
  "bg-fundi-purple/10 text-fundi-purple",
  "bg-fundi-yellow/20 text-[#d4b800]",
  "bg-fundi-pink/10 text-fundi-pink",
];

interface Props {
  growth: GrowthSummary;
  certifications: CertificationsData;
}

export default function RecognitionPanel({ growth, certifications }: Props) {
  const totalRecognition =
    growth.badges.length + growth.microcredentials.length + certifications.issued.length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 bg-fundi-orange rounded-full shrink-0" />
          <h3 className="font-bold text-[#2f2f2f] text-lg flex items-center gap-2">
            <Award className="h-4 w-4 text-fundi-orange" />
            Badges &amp; Credentials
          </h3>
        </div>
        {totalRecognition > 0 && (
          <span className="bg-fundi-orange text-white text-xs font-black px-2.5 py-1 rounded-full">
            {totalRecognition}
          </span>
        )}
      </div>

      {growth.badges.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b5b5b] flex items-center gap-1 mb-3">
            <Star className="h-3 w-3" /> Badges ({growth.badges.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {growth.badges.slice(0, 5).map((b, i) => (
              <div
                key={i}
                title={b.date_awarded ?? ""}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl ${BADGE_COLORS[i % BADGE_COLORS.length]}`}
              >
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <p className="text-[9px] font-bold text-center leading-tight line-clamp-2">{b.title}</p>
              </div>
            ))}
            {growth.badges.length > 5 && (
              <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#f1f1f1]">
                <div className="w-10 h-10 rounded-full bg-[#e8e8e8] flex items-center justify-center">
                  <span className="text-sm font-bold text-[#5b5b5b]">+{growth.badges.length - 5}</span>
                </div>
                <p className="text-[9px] font-bold text-[#5b5b5b]">More</p>
              </div>
            )}
          </div>
        </div>
      )}

      {growth.microcredentials.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b5b5b]">
            Microcredentials ({growth.microcredentials.length})
          </p>
          {growth.microcredentials.slice(0, 3).map((mc, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-fundi-cyan/10 rounded-lg px-3 py-2 border-l-4 border-fundi-cyan"
            >
              <span className="text-xs font-bold text-fundi-cyan truncate">{mc.title}</span>
              <span className="text-[10px] text-[#5b5b5b] shrink-0 ml-2">{mc.date_issued ?? ""}</span>
            </div>
          ))}
        </div>
      )}

      {certifications.issued.length > 0 && (
        <div className="space-y-2 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b5b5b] flex items-center gap-1">
            <Trophy className="h-3 w-3 text-fundi-orange" /> Certifications
          </p>
          {certifications.issued.map((c, i) => (
            <div key={i} className="bg-fundi-orange/10 rounded-lg px-3 py-2 border-l-4 border-fundi-orange">
              <div className="text-xs font-bold text-fundi-orange">{c.title}</div>
              <div className="text-[10px] text-[#5b5b5b]">{c.program} · {c.date_issued ?? ""}</div>
            </div>
          ))}
        </div>
      )}

      {certifications.in_progress.map((c, i) => (
        <div key={i} className="bg-[#f1f1f1] rounded-lg px-3 py-2.5 space-y-1.5 mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#2f2f2f] font-bold">Certification in progress</span>
            <span className="text-[#5b5b5b]">{c.microcredentials_earned}/{c.microcredentials_required}</span>
          </div>
          <div className="h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fundi-orange to-fundi-orange-light rounded-full transition-all"
              style={{
                width: `${Math.min(100, (c.microcredentials_earned / c.microcredentials_required) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}

      {totalRecognition === 0 && certifications.in_progress.length === 0 && (
        <p className="text-xs text-[#5b5b5b] text-center py-3">
          Keep working through your modules to earn recognition!
        </p>
      )}
    </div>
  );
}

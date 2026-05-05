import { useEffect, useMemo, useState } from "react";
import { Award, BarChart3, CheckCircle2, Download, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { programManagerApi } from "@/lib/api";
import CompletionRatesPanel from "./components/CompletionRatesPanel";
import LevelDistributionPanel from "./components/LevelDistributionPanel";
import PathwayDemandPanel from "./components/PathwayDemandPanel";
import type {
  BadgeDistributionRow,
  CertificationRateRow,
  CompletionRateRow,
  LevelDistribution,
  MicrocredentialIssuanceRow,
  PathwayDemandRow,
} from "./program-manager-types";

interface DashboardState {
  pathwayDemand: PathwayDemandRow[];
  completionRates: CompletionRateRow[];
  badgeDistribution: BadgeDistributionRow[];
  microcredentialIssuance: MicrocredentialIssuanceRow[];
  certificationRates: CertificationRateRow[];
  levelDistribution: LevelDistribution;
}

const EMPTY_DASHBOARD: DashboardState = {
  pathwayDemand: [],
  completionRates: [],
  badgeDistribution: [],
  microcredentialIssuance: [],
  certificationRates: [],
  levelDistribution: {},
};

const getResults = <T,>(response: { data: { results?: T } }): T | undefined =>
  response.data.results;

export default function ProgramManagerDashboard() {
  const [data, setData] = useState<DashboardState>(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [
          pathwayDemand,
          completionRates,
          badgeDistribution,
          microcredentialIssuance,
          certificationRates,
          levelDistribution,
        ] = await Promise.all([
          programManagerApi.getPathwayDemand(),
          programManagerApi.getCompletionRates(),
          programManagerApi.getBadgeDistribution(),
          programManagerApi.getMicrocredentialIssuance(),
          programManagerApi.getCertificationRates(),
          programManagerApi.getLevelDistribution(),
        ]);

        if (!isMounted) {
          return;
        }

        setData({
          pathwayDemand: getResults<PathwayDemandRow[]>(pathwayDemand) ?? [],
          completionRates: getResults<CompletionRateRow[]>(completionRates) ?? [],
          badgeDistribution: getResults<BadgeDistributionRow[]>(badgeDistribution) ?? [],
          microcredentialIssuance:
            getResults<MicrocredentialIssuanceRow[]>(microcredentialIssuance) ?? [],
          certificationRates: getResults<CertificationRateRow[]>(certificationRates) ?? [],
          levelDistribution: levelDistribution.data as LevelDistribution,
        });
      } catch {
        if (isMounted) {
          setErrorMessage("Program analytics are unavailable right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const enrolledLearners = data.pathwayDemand.reduce(
      (sum, row) => sum + row.enrolled_learners,
      0
    );
    const completedModules = data.completionRates.reduce(
      (sum, row) => sum + row.learners_complete,
      0
    );
    const issuedBadges = data.badgeDistribution.reduce(
      (sum, row) => sum + row.issued_count,
      0
    );
    const issuedCredentials = data.microcredentialIssuance.reduce(
      (sum, row) => sum + row.issued_count,
      0
    );

    return {
      enrolledLearners,
      completedModules,
      issuedBadges,
      issuedCredentials,
    };
  }, [data]);

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="heading-font mb-2 text-3xl font-bold text-fundi-black md:text-4xl">
              Program Manager Dashboard
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Cross-program demand, completion, and recognition analytics
            </p>
          </div>
          <Button variant="orange" size="lg" className="font-semibold shadow-md">
            <Download className="mr-2 h-5 w-5" />
            Impact Brief
          </Button>
        </header>

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Enrolled Learners"
            value={totals.enrolledLearners.toLocaleString()}
            colorClass="text-fundi-orange"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completed Modules"
            value={totals.completedModules.toLocaleString()}
            colorClass="text-fundi-lime"
          />
          <MetricCard
            icon={Award}
            label="Badges Issued"
            value={totals.issuedBadges.toLocaleString()}
            colorClass="text-fundi-cyan"
          />
          <MetricCard
            icon={BarChart3}
            label="Microcredentials"
            value={totals.issuedCredentials.toLocaleString()}
            colorClass="text-fundi-purple"
          />
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-fundi-orange" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <PathwayDemandPanel rows={data.pathwayDemand} />
              <CompletionRatesPanel rows={data.completionRates} />
              <LevelDistributionPanel data={data.levelDistribution} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <RecognitionPanel rows={data.badgeDistribution} />
              <CertificationPanel rows={data.certificationRates} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: typeof Users;
  label: string;
  value: string;
  colorClass: string;
}

function MetricCard({ icon: Icon, label, value, colorClass }: MetricCardProps) {
  return (
    <Card className="border-l-4 border-l-fundi-orange shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
          {label}
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`mono-font text-3xl font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function RecognitionPanel({ rows }: { rows: BadgeDistributionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Badge Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">No badges issued yet.</p>
        ) : (
          rows.slice(0, 8).map((row) => (
            <div key={`${row.badge_title}-${row.unit_title}`} className="flex justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-800">{row.badge_title}</div>
                <div className="truncate text-xs text-gray-400">{row.unit_title}</div>
              </div>
              <span className="tabular-nums text-sm font-semibold text-fundi-cyan">
                {row.issued_count}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CertificationPanel({ rows }: { rows: CertificationRateRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Certification Rates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">No certifications issued yet.</p>
        ) : (
          rows.slice(0, 8).map((row) => (
            <div key={`${row.program_name}-${row.cert_title}`} className="space-y-1">
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate font-medium text-gray-800">{row.cert_title}</span>
                <span className="tabular-nums text-gray-500">
                  {row.issued_count}/{row.learners_enrolled}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-fundi-lime"
                  style={{
                    width: `${Math.min(
                      100,
                      (row.issued_count / Math.max(row.learners_enrolled, 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

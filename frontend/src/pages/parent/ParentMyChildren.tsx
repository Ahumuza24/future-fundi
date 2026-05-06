import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Apple,
  BookOpen,
  CheckCircle2,
  Edit3,
  FileText,
  GraduationCap,
  Leaf,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChildForm } from "@/components/ChildForm";
import { childApi, courseApi, parentDashboardApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  EMPTY_FORM,
  type ApiError,
  type Child,
  type ChildFormData,
  type Course,
} from "@/components/child-management-types";
import type { ChildSummary } from "./parent-dashboard-types";
import { LEVEL_LABELS } from "./parent-dashboard-types";

const ERROR_FIELDS = [
  "date_of_birth",
  "username",
  "password",
  "new_password",
  "password_confirm",
  "new_password_confirm",
] as const;

interface ChildDashboardSnapshot {
  evidenceCount: number;
  recognitionCount: number;
  activePathway: string;
  pathwayProgress: number;
}

function mergeChildSummary(child: Child, summaries: ChildSummary[]) {
  return summaries.find((summary) => summary.learner_id === child.id);
}

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function extractApiError(err: unknown): string {
  const data = (err as ApiError).response?.data;
  if (!data) return "An unexpected error occurred.";
  if (typeof data.detail === "string") return data.detail;
  for (const field of ERROR_FIELDS) {
    const value = data[field];
    if (Array.isArray(value)) return value[0];
    if (typeof value === "string") return value;
  }
  return "An unexpected error occurred.";
}

function formatJoined(date: string | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-UG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "orange" | "cyan" | "lime";
}) {
  const styles = {
    orange: "text-fundi-orange bg-fundi-orange/10",
    cyan: "text-fundi-cyan bg-fundi-cyan/10",
    lime: "text-[#496400] bg-fundi-lime/10",
  }[tone];

  return (
    <div className={cn("rounded-xl p-3 text-center", styles)}>
      <p className="heading-font text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#5b5b5b]">{label}</p>
    </div>
  );
}

function ChildProfileCard({
  child,
  summary,
  snapshot,
  onEdit,
  onDelete,
}: {
  child: Child;
  summary?: ChildSummary;
  snapshot?: ChildDashboardSnapshot;
  onEdit: (child: Child) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const activePathway = snapshot?.activePathway || summary?.current_program || summary?.current_track || "Pathway not selected";
  const level = summary?.level ? LEVEL_LABELS[summary.level] ?? summary.level : "Profile";
  const progress = snapshot?.pathwayProgress ?? 0;

  return (
    <article className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
      <span className="absolute left-0 top-0 h-full w-1.5 bg-fundi-orange" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-fundi-orange/10 text-fundi-orange shadow-sm">
            <UserRound className="h-10 w-10" />
          </div>
          <div className="min-w-0">
            <h2 className="heading-font truncate text-2xl font-black tracking-tight text-[#2f2f2f]">
              {child.full_name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-fundi-lime/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#496400]">
                Active
              </span>
              <span className="text-xs font-semibold text-[#777]">{level}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(child)}
            className="rounded-lg p-2 text-[#777] transition-colors hover:bg-[#f1f1f1] hover:text-fundi-orange"
            aria-label={`Edit ${child.full_name}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(child.id, child.full_name)}
            className="rounded-lg p-2 text-[#777] transition-colors hover:bg-fundi-red/10 hover:text-fundi-red"
            aria-label={`Remove ${child.full_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-lg bg-[#f1f1f1] p-4">
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-[#777]">Current Pathway</p>
        <p className="line-clamp-2 text-lg font-black text-fundi-cyan">{activePathway}</p>
        <div className="mt-3 h-2 rounded-full bg-[#dddddd]">
          <div
            className="h-full rounded-full bg-fundi-orange transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile label="Growth" value={(summary?.leaves_count ?? 0) + (summary?.fruit_count ?? 0)} tone="orange" />
        <StatTile label="Evidence" value={snapshot?.evidenceCount ?? 0} tone="cyan" />
        <StatTile label="Awards" value={snapshot?.recognitionCount ?? 0} tone="lime" />
      </div>

      <div className="mb-6 grid gap-2 text-sm font-semibold text-[#5b5b5b] sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-2">
          <GraduationCap className="h-4 w-4 text-fundi-orange" />
          <span className="truncate">{child.current_class || "Class not set"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-2">
          <BookOpen className="h-4 w-4 text-fundi-cyan" />
          <span className="truncate">{child.current_school || "School not set"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-[#496400]" />
          <span>{child.consent_media ? "Media consent on" : "No media consent"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-2">
          <AlertCircle className="h-4 w-4 text-fundi-orange" />
          <span>{child.equity_flag ? "Support flagged" : child.age ? `${child.age} years` : "Age not set"}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/parent"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#e8e8e8] py-3 text-sm font-black text-[#2f2f2f] transition-colors hover:bg-fundi-orange hover:text-white"
        >
          View Dashboard
          <FileText className="h-4 w-4" />
        </Link>
        <Button
          type="button"
          onClick={() => onEdit(child)}
          className="flex-1 rounded-xl bg-fundi-orange py-3 font-black text-white hover:bg-fundi-orange-dark"
        >
          Edit Profile
        </Button>
      </div>
    </article>
  );
}

function FamilyOverview({
  children,
  snapshots,
}: {
  children: Child[];
  snapshots: Record<string, ChildDashboardSnapshot>;
}) {
  const evidenceTotal = children.reduce((total, child) => total + (snapshots[child.id]?.evidenceCount ?? 0), 0);
  const recognitionTotal = children.reduce((total, child) => total + (snapshots[child.id]?.recognitionCount ?? 0), 0);
  const supportFlags = children.filter((child) => child.equity_flag).length;

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <div className="rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <Users className="mb-3 h-6 w-6 text-fundi-orange" />
        <p className="heading-font text-3xl font-black">{children.length}</p>
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#777]">Children</p>
      </div>
      <div className="rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <FileText className="mb-3 h-6 w-6 text-fundi-cyan" />
        <p className="heading-font text-3xl font-black">{evidenceTotal}</p>
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#777]">Evidence Items</p>
      </div>
      <div className="rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <Leaf className="mb-3 h-6 w-6 text-[#496400]" />
        <p className="heading-font text-3xl font-black">{recognitionTotal}</p>
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#777]">Recognition</p>
      </div>
      <div className="rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
        <Apple className="mb-3 h-6 w-6 text-fundi-orange" />
        <p className="heading-font text-3xl font-black">{supportFlags}</p>
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#777]">Support Flags</p>
      </div>
    </section>
  );
}

export default function ParentMyChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [summaries, setSummaries] = useState<ChildSummary[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, ChildDashboardSnapshot>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState<ChildFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showForm = showAddForm || !!editingChild;

  const loadChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const [childrenResponse, summariesResponse] = await Promise.all([
        childApi.getAll(),
        parentDashboardApi.getChildren(),
      ]);
      const childRows = childrenResponse.data.results ?? childrenResponse.data;
      const nextChildren = Array.isArray(childRows) ? childRows : [];
      const nextSummaries = summariesResponse.data.children ?? [];
      setChildren(nextChildren);
      setSummaries(nextSummaries);

      const snapshotEntries = await Promise.all(
        nextChildren.map(async (child) => {
          try {
            const [dashboard, recognition, artifacts] = await Promise.all([
              childApi.getDashboard(child.id),
              parentDashboardApi.getRecognition(child.id),
              parentDashboardApi.getArtifacts(child.id),
            ]);
            const pathways = dashboard.data.pathways ?? [];
            const activePathway = pathways[0];
            const badges = recognition.data.badges ?? [];
            const microcredentials = recognition.data.microcredentials ?? [];
            const artifactRows = artifacts.data.artifacts ?? [];
            return [
              child.id,
              {
                evidenceCount: artifactRows.length,
                recognitionCount: badges.length + microcredentials.length,
                activePathway: activePathway?.name ?? "",
                pathwayProgress: activePathway?.progress ?? 0,
              },
            ] as const;
          } catch {
            return [
              child.id,
              { evidenceCount: 0, recognitionCount: 0, activePathway: "", pathwayProgress: 0 },
            ] as const;
          }
        })
      );
      setSnapshots(Object.fromEntries(snapshotEntries));
    } catch {
      setError("Failed to load children.");
      setChildren([]);
      setSummaries([]);
      setSnapshots({});
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await courseApi.getAll();
      const rows = response.data.results ?? response.data ?? [];
      setCourses(Array.isArray(rows) ? rows : []);
    } catch {
      setCourses([]);
    }
  };

  useEffect(() => {
    loadChildren();
    loadCourses();
  }, []);

  const resetForm = () => setFormData(EMPTY_FORM);

  const cancelForm = () => {
    setEditingChild(null);
    setShowAddForm(false);
    resetForm();
  };

  const validateAge = (dob: string): boolean => {
    if (!dob) return true;
    const age = calculateAge(dob);
    if (age < 6 || age > 18) {
      setError("Child must be between 6 and 18 years old.");
      return false;
    }
    return true;
  };

  const startAdd = () => {
    setError(null);
    setSuccess(null);
    setEditingChild(null);
    resetForm();
    setShowAddForm(true);
  };

  const startEdit = (child: Child) => {
    setError(null);
    setSuccess(null);
    setShowAddForm(false);
    setEditingChild(child);
    setFormData({
      ...EMPTY_FORM,
      first_name: child.first_name,
      last_name: child.last_name,
      date_of_birth: child.date_of_birth ?? "",
      current_school: child.current_school ?? "",
      current_class: child.current_class ?? "",
      consent_media: child.consent_media,
      equity_flag: child.equity_flag,
    });
  };

  const handleAddChild = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateAge(formData.date_of_birth)) return;
    if (!formData.username || !formData.password || !formData.password_confirm) {
      setError("Username, password, and password confirmation are required.");
      return;
    }
    try {
      await childApi.create({
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        current_school: formData.current_school,
        current_class: formData.current_class,
        username: formData.username,
        password: formData.password,
        password_confirm: formData.password_confirm,
        consent_media: formData.consent_media,
        equity_flag: formData.equity_flag,
        pathway_ids: formData.pathway_ids,
      });
      setSuccess("Child added successfully.");
      cancelForm();
      loadChildren();
    } catch (err: unknown) {
      setError(extractApiError(err));
    }
  };

  const handleEditChild = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingChild) return;
    setError(null);
    setSuccess(null);
    if (!validateAge(formData.date_of_birth)) return;
    try {
      const updateData: Partial<ChildFormData> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        current_school: formData.current_school,
        current_class: formData.current_class,
        consent_media: formData.consent_media,
        equity_flag: formData.equity_flag,
      };
      if (formData.new_password) {
        updateData.new_password = formData.new_password;
        updateData.new_password_confirm = formData.new_password_confirm;
      }
      await childApi.update(editingChild.id, updateData);
      setSuccess("Child updated successfully.");
      cancelForm();
      loadChildren();
    } catch (err: unknown) {
      setError(extractApiError(err));
    }
  };

  const handleDeleteChild = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from your family profiles?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await childApi.delete(id);
      setSuccess("Child removed successfully.");
      loadChildren();
    } catch {
      setError("Failed to remove child.");
    }
  };

  const recentlyAdded = useMemo(
    () => [...children].sort((a, b) => String(b.joined_at ?? "").localeCompare(String(a.joined_at ?? "")))[0],
    [children]
  );

  return (
    <div className="min-h-screen bg-[#f6f6f6] px-3 py-8 text-[#2f2f2f] sm:px-4 lg:px-6">
      <div className="flex w-full flex-col gap-8">
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/fundi_bots_logo.png" alt="Fundi Bots" className="h-9 w-auto object-contain" />
              <span className="rounded-full bg-fundi-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-fundi-orange">
                Family Profiles
              </span>
            </div>
            <h1 className="heading-font mb-2 text-4xl font-black tracking-tight text-[#2f2f2f] md:text-6xl">
              My Children
            </h1>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#5b5b5b]">
              Manage learner profiles, school details, pathway enrollment, consent, and support needs.
            </p>
          </div>
          <Button
            type="button"
            onClick={startAdd}
            className="w-fit gap-2 rounded-full bg-fundi-orange px-6 py-3 font-black text-white hover:bg-fundi-orange-dark"
          >
            <Plus className="h-4 w-4" />
            Add Child
          </Button>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="h-32 animate-pulse rounded-xl bg-white" />
            <div className="h-32 animate-pulse rounded-xl bg-white" />
            <div className="h-32 animate-pulse rounded-xl bg-white" />
            <div className="h-32 animate-pulse rounded-xl bg-white" />
          </div>
        ) : (
          <FamilyOverview children={children} snapshots={snapshots} />
        )}

        {(error || success) && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold",
              error ? "border-fundi-red/20 bg-fundi-red/10 text-fundi-red" : "border-fundi-lime/20 bg-fundi-lime/10 text-[#496400]"
            )}
          >
            {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            {error ?? success}
          </div>
        )}

        {showForm && (
          <div className="rounded-xl bg-white p-1 shadow-[0_4px_24px_rgba(240,87,34,0.08)]">
            <ChildForm
              editingChild={editingChild}
              formData={formData}
              onChange={setFormData}
              courses={courses}
              onSubmit={editingChild ? handleEditChild : handleAddChild}
              onCancel={cancelForm}
            />
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 animate-pulse rounded-xl bg-white" />
            <div className="h-96 animate-pulse rounded-xl bg-white" />
          </div>
        ) : children.length === 0 ? (
          <Card className="rounded-xl border-0 bg-white p-10 text-center shadow-[0_4px_24px_rgba(240,87,34,0.06)]">
            <Users className="mx-auto mb-4 h-14 w-14 text-fundi-orange" />
            <h2 className="heading-font text-2xl font-black">No children added yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5b5b5b]">
              Add your first child to create a learner login and start tracking their pathway journey.
            </p>
            <Button onClick={startAdd} className="mt-6 gap-2 rounded-full bg-fundi-orange px-6 text-white">
              <Plus className="h-4 w-4" />
              Add Your First Child
            </Button>
          </Card>
        ) : (
          <section className="grid gap-6 lg:grid-cols-2">
            {children.map((child) => (
              <ChildProfileCard
                key={child.id}
                child={child}
                summary={mergeChildSummary(child, summaries)}
                snapshot={snapshots[child.id]}
                onEdit={startEdit}
                onDelete={handleDeleteChild}
              />
            ))}
          </section>
        )}

        {!loading && recentlyAdded && (
          <footer className="pb-8 text-center">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#e8e8e8] px-5 py-3 text-sm font-semibold text-[#5b5b5b]">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#496400]" />
              <span className="truncate">
                Latest profile: {recentlyAdded.full_name}
                {formatJoined(recentlyAdded.joined_at) ? `, added ${formatJoined(recentlyAdded.joined_at)}` : ""}
              </span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, BookOpen, ClipboardList } from 'lucide-react';
import { cmsApi } from '@/lib/api';
import type { CmsModule, HierarchyContext, ContentStatus } from './components/cms/cms-types';
import ContentWizard from './components/cms/ContentWizard';
import PeerReviewQueue from './components/cms/PeerReviewQueue';
import StatusToggle from './components/cms/StatusToggle';

type ActiveView = 'wizard' | 'modules' | 'review-queue';

export default function CurriculumDesigner() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<ActiveView>('modules');
  const [completedContext, setCompletedContext] = useState<HierarchyContext | null>(null);

  const { data: modules, isLoading } = useQuery<CmsModule[]>({
    queryKey: ['cms', 'modules'],
    queryFn: () => cmsApi.modules.getAll().then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) =>
      cmsApi.modules.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['cms', 'peer-review-queue'] });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: (id: string) => cmsApi.modules.submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'modules'] });
      queryClient.invalidateQueries({ queryKey: ['cms', 'peer-review-queue'] });
    },
  });

  const handleWizardComplete = (ctx: HierarchyContext) => {
    setCompletedContext(ctx);
    setActiveView('modules');
    queryClient.invalidateQueries({ queryKey: ['cms', 'modules'] });
  };

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'modules', label: 'Modules', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'wizard', label: 'New Content', icon: <PlusCircle className="h-4 w-4" /> },
    { id: 'review-queue', label: 'Review Queue', icon: <ClipboardList className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-full min-h-screen flex-col bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Curriculum Designer</h1>
            <p className="text-xs text-gray-500">Build and manage the 7-layer learning hierarchy</p>
          </div>
          <nav className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${activeView === item.id ? 'bg-fundi-orange text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {activeView === 'wizard' && (
          <div className="mx-auto max-w-xl">
            <ContentWizard
              initialContext={completedContext ?? undefined}
              onComplete={handleWizardComplete}
            />
          </div>
        )}

        {activeView === 'modules' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300">All Modules</h2>
              <button
                type="button"
                onClick={() => setActiveView('wizard')}
                className="flex items-center gap-1.5 rounded-lg bg-fundi-orange/10 px-3 py-1.5 text-xs font-medium text-fundi-orange hover:bg-fundi-orange/20 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New Content
              </button>
            </div>

            {isLoading && (
              <div className="py-8 text-center text-sm text-gray-500">Loading modules…</div>
            )}

            {!isLoading && (!modules || modules.length === 0) && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center text-sm text-gray-500">
                No modules yet — use the wizard to create your first content hierarchy.
              </div>
            )}

            <div className="flex flex-col gap-2">
              {modules?.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/5"
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{mod.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {mod.pathway_title} › {mod.track_title} › {mod.program_title}
                      </p>
                    </div>
                    <StatusToggle
                      currentStatus={mod.status}
                      requiresReview={mod.needs_review}
                      onStatusChange={(s) => statusMutation.mutate({ id: mod.id, status: s })}
                    />
                  </div>
                  {mod.outcome_statement && (
                    <p className="mt-2 line-clamp-2 text-xs text-gray-400">{mod.outcome_statement}</p>
                  )}
                  {mod.status === 'draft' && !mod.needs_review && !mod.reviewed_by && (
                    <button
                      type="button"
                      disabled={submitReviewMutation.isPending}
                      onClick={() => submitReviewMutation.mutate(mod.id)}
                      className="mt-3 rounded-md border border-fundi-cyan/20 bg-fundi-cyan/10 px-3 py-1 text-xs text-fundi-cyan transition-colors hover:bg-fundi-cyan/20 disabled:opacity-50"
                    >
                      Submit for Review
                    </button>
                  )}
                  {mod.needs_review && (
                    <span className="mt-2 inline-block rounded-full bg-fundi-yellow/10 px-2 py-0.5 text-xs text-fundi-yellow">
                      Awaiting peer review
                    </span>
                  )}
                  {mod.reviewed_by && !mod.needs_review && (
                    <span className="mt-2 inline-block rounded-full bg-fundi-lime/10 px-2 py-0.5 text-xs text-fundi-lime">
                      Review approved
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'review-queue' && (
          <div className="mx-auto flex max-w-lg flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-300">Peer Review Queue</h2>
            <PeerReviewQueue onApprove={() => setActiveView('modules')} />
          </div>
        )}
      </main>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { cmsApi } from '@/lib/api';
import type { PeerReviewQueueItem } from './cms-types';

interface PeerReviewQueueProps {
  onApprove?: (moduleId: string) => void;
}

export default function PeerReviewQueue({ onApprove }: PeerReviewQueueProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<PeerReviewQueueItem[]>({
    queryKey: ['cms', 'peer-review-queue'],
    queryFn: () => cmsApi.modules.peerReviewQueue().then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (moduleId: string) => cmsApi.modules.approveReview(moduleId),
    onSuccess: (_data, moduleId) => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'peer-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['cms', 'modules'] });
      onApprove?.(moduleId);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-500">
        Loading review queue…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
        Failed to load review queue.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-gray-500">
        <CheckCircle className="h-8 w-8 text-fundi-lime/50" />
        <span>No modules awaiting review</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {data.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/5"
        >
          <div className="mb-1 flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-white leading-tight">{item.title}</span>
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-fundi-yellow" />
          </div>
          <div className="mb-2 flex items-center gap-1 text-xs text-gray-500 flex-wrap">
            <span>{item.pathway_title}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span>{item.track_title}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span>{item.program_title}</span>
          </div>
          <button
            type="button"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate(item.id)}
            className="w-full rounded-md bg-fundi-lime/10 px-3 py-1.5 text-xs font-medium text-fundi-lime transition-colors hover:bg-fundi-lime/20 disabled:opacity-50"
          >
            {approveMutation.isPending ? 'Approving…' : 'Approve Review'}
          </button>
        </div>
      ))}
    </div>
  );
}

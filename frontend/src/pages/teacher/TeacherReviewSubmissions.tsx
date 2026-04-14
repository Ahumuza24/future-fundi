import { useState, useEffect, useCallback } from "react";
import { teacherApi, MEDIA_BASE_URL } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, X, FileText, Image, Video, AlertCircle, ArrowLeft, Loader2, RefreshCw,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

/** Shape returned by QuickArtifactSerializer + learner_name enrichment */
interface PendingSubmission {
  id: string;
  title: string;
  reflection: string;
  submitted_at: string;
  status: string;
  learner_name: string;
  media_refs: Array<{
    type: string;
    url: string;
    filename?: string;
  }>;
}

/** Pick the first media ref for preview purposes */
function getPreviewMedia(submission: PendingSubmission): { url: string; type: string } | null {
  if (!submission.media_refs?.length) return null;
  const first = submission.media_refs[0];
  return { url: first.url, type: first.type || "file" };
}

function MediaPreview({ submission }: { submission: PendingSubmission }) {
  const preview = getPreviewMedia(submission);

  if (!preview) {
    return (
      <div className="h-44 bg-gray-100 flex items-center justify-center rounded-t-2xl">
        <FileText className="h-12 w-12 text-gray-300" />
      </div>
    );
  }

  const isImage = preview.type.startsWith("image");
  const isVideo = preview.type.startsWith("video");

  if (isImage) {
    return (
      <div className="h-44 bg-gray-100 rounded-t-2xl overflow-hidden relative">
        <img
          src={preview.url.startsWith("http") ? preview.url : `${MEDIA_BASE_URL}${preview.url}`}
          alt={submission.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg text-white backdrop-blur-sm">
          <Image className="h-4 w-4" />
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="h-44 bg-gray-900 rounded-t-2xl overflow-hidden relative flex items-center justify-center">
        <Video className="h-12 w-12 text-white/40" />
        <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg text-white backdrop-blur-sm">
          <Video className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-44 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center gap-2 rounded-t-2xl">
      <FileText className="h-10 w-10 text-blue-300" />
      <span className="text-xs text-blue-400 font-medium truncate max-w-[160px]">
        {submission.media_refs[0]?.filename || "File"}
      </span>
    </div>
  );
}

export default function TeacherReviewSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await teacherApi.getStudentSubmissions();
      // Backend returns { results: [], pending_count: number, total: number }
      const data = res.data?.results ?? res.data;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      toast.error("Failed to load student submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = async (id: string) => {
    try {
      setIsApproving(id);
      // Backend expects { action: "approve" }
      await teacherApi.reviewArtifact(id, { action: "approve" });
      toast.success("Artifact approved! It now counts toward the student's progress.");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve artifact");
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      setIsRejecting(true);
      // Backend expects { action: "reject", rejection_reason: "..." }
      await teacherApi.reviewArtifact(rejectingId, {
        action: "reject",
        rejection_reason: rejectionReason.trim(),
      });
      toast.success("Artifact returned for revision");
      setSubmissions((prev) => prev.filter((s) => s.id !== rejectingId));
      setRejectingId(null);
      setRejectionReason("");
      setIsDetailOpen(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Failed to return artifact");
    } finally {
      setIsRejecting(false);
    }
  };

  const openDetailView = (submission: PendingSubmission) => {
    setSelectedSubmission(submission);
    setIsDetailOpen(true);
  };

  const closeDetailView = () => {
    setIsDetailOpen(false);
    setSelectedSubmission(null);
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/teacher")}
            className="rounded-full hover:bg-white shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
              Review Submissions
            </h1>
            <p className="text-gray-500 font-medium mt-0.5">
              Approve or return student artifacts for revision
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge className="text-sm px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                {pendingCount} Pending
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubmissions}
              disabled={loading}
              className="rounded-full gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="text-gray-500 font-medium">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              There are no pending student submissions to review right now.
            </p>
            <Button
              onClick={() => navigate("/teacher")}
              className="bg-gray-900 text-white rounded-full px-6"
            >
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {submissions.map((sub) => (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
                >
                  <Card
                    className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all bg-white rounded-2xl h-full flex flex-col cursor-pointer group relative"
                    onClick={() => openDetailView(sub)}
                  >
                    {/* Click indicator overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10 pointer-events-none" />
                    <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                        Click to review
                      </span>
                    </div>
                    <MediaPreview submission={sub} />

                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="mb-4 flex-1">
                        <h3 className="font-bold text-lg leading-tight mb-1.5 text-gray-900">
                          {sub.title}
                        </h3>
                        <p className="text-sm font-semibold text-blue-600 bg-blue-50 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          {sub.learner_name}
                        </p>

                        {sub.reflection ? (
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-600 line-clamp-3 italic">
                              &ldquo;{sub.reflection}&rdquo;
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No reflection provided</p>
                        )}
                      </div>

                      {sub.media_refs?.length > 1 && (
                        <p className="text-xs text-gray-400 mb-3">
                          +{sub.media_refs.length - 1} more file{sub.media_refs.length > 2 ? "s" : ""}
                        </p>
                      )}

                      <div className="text-xs text-gray-400 mb-4">
                        Submitted {new Date(sub.submitted_at).toLocaleDateString("en-US", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectingId(sub.id);
                            setRejectionReason("");
                          }}
                          disabled={isApproving === sub.id}
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Return
                        </Button>
                        <Button
                          className="text-white shadow-sm rounded-xl"
                          style={{ backgroundColor: 'var(--fundi-orange)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--fundi-orange)'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(sub.id);
                          }}
                          disabled={isApproving === sub.id}
                        >
                          {isApproving === sub.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1.5" />
                              Approve
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Artifact Detail Review Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-xl p-0">
          {selectedSubmission && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      {selectedSubmission.title}
                    </DialogTitle>
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      by {selectedSubmission.learner_name}
                    </p>
                  </div>
                  <Badge className={`text-sm px-3 py-1 ${
                    selectedSubmission.status === 'pending'
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      : selectedSubmission.status === 'approved'
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }`}>
                    {selectedSubmission.status === 'pending' ? 'Pending Review' : selectedSubmission.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="px-6 py-4 space-y-6">
                {/* Media Gallery */}
                {selectedSubmission.media_refs && selectedSubmission.media_refs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Attached Files</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedSubmission.media_refs.map((media, idx) => (
                        <a
                          key={idx}
                          href={media.url.startsWith("http") ? media.url : `${MEDIA_BASE_URL}${media.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          {media.type?.startsWith("image") ? (
                            <img
                              src={media.url.startsWith("http") ? media.url : `${MEDIA_BASE_URL}${media.url}`}
                              alt={media.filename || `File ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                              <FileText className="h-10 w-10 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-500 text-center truncate w-full">
                                {media.filename || `File ${idx + 1}`}
                              </span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reflection */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Student Reflection</h4>
                  {selectedSubmission.reflection ? (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-gray-700 italic">&ldquo;{selectedSubmission.reflection}&rdquo;</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No reflection provided</p>
                  )}
                </div>

                {/* Submission Date */}
                <div className="text-sm text-gray-500">
                  Submitted on {new Date(selectedSubmission.submitted_at).toLocaleDateString("en-US", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectingId(selectedSubmission.id);
                    setRejectionReason("");
                  }}
                  disabled={isApproving === selectedSubmission.id || selectedSubmission.status !== 'pending'}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white rounded-xl px-6"
                >
                  <X className="h-4 w-4 mr-2" />
                  Return
                </Button>
                <Button
                  onClick={() => handleApprove(selectedSubmission.id)}
                  disabled={isApproving === selectedSubmission.id || selectedSubmission.status !== 'pending'}
                  className="rounded-xl px-6 shadow-sm text-white"
                  style={{ backgroundColor: 'var(--fundi-orange)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--fundi-orange)'}
                >
                  {isApproving === selectedSubmission.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectingId}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Return for Revision
            </DialogTitle>
            <DialogDescription className="text-base pt-1">
              Give the student clear feedback on why this artifact needs revision. They will see this message.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <textarea
              placeholder="E.g. Please add more details to your reflection..."
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRejectionReason(e.target.value)
              }
              className="w-full resize-none h-32 text-base rounded-xl border border-gray-200 focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none p-3"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectingId(null);
                setRejectionReason("");
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-red-500 hover:bg-red-600 rounded-full px-6 shadow-sm shadow-red-500/20 text-white"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Returning...
                </>
              ) : (
                "Return Artifact"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { teacherApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, FileText, Image, Video, AlertCircle, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

interface PendingSubmission {
  id: string;
  title: string;
  reflection: string;
  submitted_at: string;
  status: string;
  learner_name: string;
  media_url: string | null;
  media_type: string | null;
}

export default function TeacherReviewSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await teacherApi.getStudentSubmissions();
      // the endpoint might return { pending_count: number, submissions: [] } 
      // based on typical django responses or just the list.
      const data = res.data.submissions || res.data;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load student submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setIsApproving(id);
      await teacherApi.reviewArtifact(id, { status: "approved" });
      toast.success("Artifact approved!");
      setSubmissions(submissions.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
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
      await teacherApi.reviewArtifact(rejectingId, { 
        status: "rejected", 
        rejection_reason: rejectionReason.trim() 
      });
      toast.success("Artifact returned for revision");
      setRejectingId(null);
      setRejectionReason("");
      setSubmissions(submissions.filter(s => s.id !== rejectingId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject artifact");
    } finally {
      setIsRejecting(false);
    }
  };

  const renderMedia = (sub: PendingSubmission) => {
    if (!sub.media_url) {
      return (
        <div className="h-40 bg-gray-100 flex items-center justify-center rounded-t-xl">
          <FileText className="h-12 w-12 text-gray-300" />
        </div>
      );
    }
    
    if (sub.media_type === "image") {
      return (
        <div className="h-40 bg-gray-100 rounded-t-xl overflow-hidden relative">
          <img src={sub.media_url} alt={sub.title} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md text-white backdrop-blur-sm">
            <Image className="h-4 w-4" />
          </div>
        </div>
      );
    }

    if (sub.media_type === "video") {
      return (
        <div className="h-40 bg-gray-900 rounded-t-xl overflow-hidden relative flex items-center justify-center">
            <Video className="h-12 w-12 text-white/50" />
          <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md text-white backdrop-blur-sm">
            <Video className="h-4 w-4" />
          </div>
        </div>
      );
    }

    return (
      <div className="h-40 bg-gray-100 flex items-center justify-center rounded-t-xl">
        <FileText className="h-12 w-12 text-gray-300" />
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="rounded-full hover:bg-white shadow-sm">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                Review Submissions
                </h1>
                <p className="text-gray-500 font-medium">Approve or return student artifacts</p>
            </div>
            {submissions.length > 0 && (
                <Badge className="ml-auto text-sm px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                    {submissions.length} Pending
                </Badge>
            )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <Check className="h-20 w-20 text-green-400 mx-auto mb-6 bg-green-50 p-4 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
            <p className="text-gray-500 max-w-sm mx-auto">There are no pending student submissions to review right now.</p>
            <Button onClick={() => navigate("/teacher")} className="mt-6 bg-gray-900 text-white rounded-full px-6">
                Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {submissions.map((sub) => (
                <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-white rounded-2xl h-full flex flex-col">
                        {renderMedia(sub)}
                        <CardContent className="p-5 flex flex-col flex-1">
                            <div className="mb-4">
                                <h3 className="font-bold text-lg leading-tight mb-1 text-gray-900">{sub.title}</h3>
                                <p className="text-sm font-medium text-blue-600 bg-blue-50 inline-block px-2.5 py-0.5 rounded flex items-center gap-1.5 mb-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {sub.learner_name}
                                </p>
                                {sub.reflection && (
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-600 line-clamp-3 italic">"{sub.reflection}"</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-xs text-gray-400 mb-4 mt-auto">
                                Submitted {(new Date(sub.submitted_at)).toLocaleDateString()}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm"
                                    onClick={() => setRejectingId(sub.id)}
                                >
                                    <X className="h-4 w-4 mr-1.5" /> Return
                                </Button>
                                <Button
                                    className="bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-500/20"
                                    onClick={() => handleApprove(sub.id)}
                                    disabled={isApproving === sub.id}
                                >
                                    {isApproving === sub.id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <><Check className="h-4 w-4 mr-1.5" /> Approve</>
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

      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Return for Revision
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Please provide feedback on why this artifact needs revision. The student will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              placeholder="E.g. Please add more details to your reflection..."
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
              className="w-full resize-none h-32 text-base rounded-xl border border-gray-200 focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none p-3"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setRejectingId(null)} className="rounded-full">Cancel</Button>
            <Button 
                onClick={handleReject} 
                disabled={isRejecting || !rejectionReason.trim()}
                className="bg-red-500 hover:bg-red-600 rounded-full px-6 shadow-sm shadow-red-500/20 text-white"
            >
              {isRejecting ? "Returning..." : "Return Artifact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

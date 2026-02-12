import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Flag, MessageSquare, Bell, Send, Eye, CheckCircle,
    AlertTriangle, User, Calendar, FileText, Users, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FlaggedLearner {
    id: string;
    learner_name: string;
    reason: string;
    priority: "high" | "medium" | "low";
    flagged_at: string;
    status: "pending" | "notified" | "resolved";
    notes?: string;
}

interface WeeklySummary {
    learner_id: string;
    learner_name: string;
    parent_name: string;
    attendance: number;
    artifacts_count: number;
    highlights: string[];
    areas_for_growth: string[];
    preview_ready: boolean;
}

interface AdminRequest {
    id: string;
    type: "support" | "resources" | "concern" | "other";
    subject: string;
    message: string;
    status: "pending" | "acknowledged" | "resolved";
    created_at: string;
}

export default function TeacherCommunication() {
    const [activeTab, setActiveTab] = useState<"flags" | "summaries" | "admin">("flags");
    const [flaggedLearners, setFlaggedLearners] = useState<FlaggedLearner[]>([]);
    const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
    const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
    const [showNewFlagModal, setShowNewFlagModal] = useState(false);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<WeeklySummary | null>(null);

    // New flag form
    const [newFlag, setNewFlag] = useState({
        learner_name: "",
        reason: "",
        priority: "medium" as "high" | "medium" | "low"
    });

    // New request form
    const [newRequest, setNewRequest] = useState({
        type: "support" as "support" | "resources" | "concern" | "other",
        subject: "",
        message: ""
    });

    useEffect(() => {
        // Load demo data
        setFlaggedLearners([
            { id: "1", learner_name: "Diana Asiimwe", reason: "Declining attendance (78% this month)", priority: "high", flagged_at: "Today", status: "pending", notes: "Has missed 3 sessions in 2 weeks" },
            { id: "2", learner_name: "Charles Mugisha", reason: "Needs additional challenge", priority: "low", flagged_at: "Yesterday", status: "notified" },
            { id: "3", learner_name: "Faith Nambi", reason: "Struggling with technical concepts", priority: "medium", flagged_at: "2 days ago", status: "pending" },
        ]);

        setWeeklySummaries([
            {
                learner_id: "1", learner_name: "Alex Kato", parent_name: "Mr. Kato",
                attendance: 100, artifacts_count: 3,
                highlights: ["Completed robot arm project", "Helped peers with coding"],
                areas_for_growth: ["Could improve documentation"],
                preview_ready: true
            },
            {
                learner_id: "2", learner_name: "Bella Nakato", parent_name: "Mrs. Nakato",
                attendance: 80, artifacts_count: 2,
                highlights: ["Great teamwork", "Creative solutions"],
                areas_for_growth: ["Needs more practice with debugging"],
                preview_ready: true
            },
            {
                learner_id: "3", learner_name: "Charles Mugisha", parent_name: "Mr. Mugisha",
                attendance: 100, artifacts_count: 4,
                highlights: ["Exceptional problem-solving", "Mentored other learners"],
                areas_for_growth: ["Building communication skills"],
                preview_ready: false
            },
        ]);

        setAdminRequests([
            { id: "1", type: "resources", subject: "Need more Arduino kits", message: "We've run out of Arduino starter kits for the Robotics class. Need at least 5 more.", status: "acknowledged", created_at: "3 days ago" },
            { id: "2", type: "concern", subject: "Safety issue in lab", message: "The power strip near station 3 is damaged and needs replacement.", status: "resolved", created_at: "1 week ago" },
        ]);
    }, []);

    const handleAddFlag = () => {
        if (!newFlag.learner_name || !newFlag.reason) return;
        setFlaggedLearners(prev => [{
            id: Date.now().toString(),
            ...newFlag,
            flagged_at: "Just now",
            status: "pending"
        }, ...prev]);
        setNewFlag({ learner_name: "", reason: "", priority: "medium" });
        setShowNewFlagModal(false);
    };

    const handleAddRequest = () => {
        if (!newRequest.subject || !newRequest.message) return;
        setAdminRequests(prev => [{
            id: Date.now().toString(),
            ...newRequest,
            status: "pending",
            created_at: "Just now"
        }, ...prev]);
        setNewRequest({ type: "support", subject: "", message: "" });
        setShowNewRequestModal(false);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "var(--fundi-pink)";
            case "medium": return "var(--fundi-orange)";
            default: return "var(--fundi-cyan)";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "resolved": return "text-green-600 bg-green-100";
            case "notified":
            case "acknowledged": return "text-blue-600 bg-blue-100";
            default: return "text-orange-600 bg-orange-100";
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            Communication Hub
                        </h1>
                        <p className="text-gray-600">Flag learners, preview updates, and contact admin</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-100">
                        <MessageSquare className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Pending Flags</CardDescription>
                            <CardTitle className="text-2xl">{flaggedLearners.filter(f => f.status === "pending").length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Summaries Ready</CardDescription>
                            <CardTitle className="text-2xl">{weeklySummaries.filter(s => s.preview_ready).length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Admin Requests</CardDescription>
                            <CardTitle className="text-2xl">{adminRequests.filter(r => r.status !== "resolved").length}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b">
                    {[
                        { id: "flags", label: "Parent Flags", icon: Flag, count: flaggedLearners.length },
                        { id: "summaries", label: "Weekly Summaries", icon: FileText, count: weeklySummaries.length },
                        { id: "admin", label: "Admin Requests", icon: Bell, count: adminRequests.length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? "border-purple-500 text-purple-600 font-medium"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Parent Flags Tab */}
                {activeTab === "flags" && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button
                                onClick={() => setShowNewFlagModal(true)}
                                style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                                className="gap-2"
                            >
                                <Flag className="h-4 w-4" />
                                Flag Learner
                            </Button>
                        </div>

                        {flaggedLearners.map((flag, index) => (
                            <motion.div
                                key={flag.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="border-l-4" style={{ borderLeftColor: getPriorityColor(flag.priority) }}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                                    style={{ backgroundColor: getPriorityColor(flag.priority) }}
                                                >
                                                    {flag.learner_name.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">{flag.learner_name}</h4>
                                                    <p className="text-gray-600">{flag.reason}</p>
                                                    {flag.notes && (
                                                        <p className="text-sm text-gray-500 mt-1 italic">{flag.notes}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-2">{flag.flagged_at}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(flag.status)}`}>
                                                    {flag.status}
                                                </span>
                                                {flag.status === "pending" && (
                                                    <Button
                                                        size="sm"
                                                        style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                                                        className="gap-1"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                        Notify Parent
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}

                        {flaggedLearners.length === 0 && (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Flag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500">No flagged learners</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Weekly Summaries Tab */}
                {activeTab === "summaries" && (
                    <div className="space-y-4">
                        <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Week 12 Parent Updates</h3>
                                        <p className="opacity-90">{weeklySummaries.filter(s => s.preview_ready).length} of {weeklySummaries.length} summaries ready to send</p>
                                    </div>
                                    <Button className="bg-white text-cyan-600 hover:bg-gray-100 gap-2">
                                        <Send className="h-4 w-4" />
                                        Send All Ready
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {weeklySummaries.map((summary, index) => (
                            <motion.div
                                key={summary.learner_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="hover:shadow-md transition-all">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                                    style={{ backgroundColor: "var(--fundi-purple)" }}
                                                >
                                                    {summary.learner_name.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">{summary.learner_name}</h4>
                                                    <p className="text-sm text-gray-500">To: {summary.parent_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right text-sm">
                                                    <p><span className="font-medium">{summary.attendance}%</span> attendance</p>
                                                    <p><span className="font-medium">{summary.artifacts_count}</span> artifacts</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedSummary(summary)}
                                                        className="gap-1"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Preview
                                                    </Button>
                                                    {summary.preview_ready ? (
                                                        <Button
                                                            size="sm"
                                                            style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}
                                                            className="gap-1"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            Send
                                                        </Button>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-sm">
                                                            Not ready
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Admin Requests Tab */}
                {activeTab === "admin" && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button
                                onClick={() => setShowNewRequestModal(true)}
                                style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}
                                className="gap-2"
                            >
                                <Bell className="h-4 w-4" />
                                New Request
                            </Button>
                        </div>

                        {adminRequests.map((request, index) => (
                            <motion.div
                                key={request.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                        {request.type}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold">{request.subject}</h4>
                                                <p className="text-gray-600 mt-1">{request.message}</p>
                                                <p className="text-xs text-gray-400 mt-2">{request.created_at}</p>
                                            </div>
                                            {request.status === "resolved" && (
                                                <CheckCircle className="h-6 w-6 text-green-500" />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* New Flag Modal */}
                <AnimatePresence>
                    {showNewFlagModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowNewFlagModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl max-w-md w-full p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold">Flag Learner for Parent Update</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowNewFlagModal(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Learner Name</label>
                                        <input
                                            type="text"
                                            value={newFlag.learner_name}
                                            onChange={(e) => setNewFlag({ ...newFlag, learner_name: e.target.value })}
                                            className="w-full p-3 border rounded-lg"
                                            placeholder="Enter learner name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Reason</label>
                                        <textarea
                                            value={newFlag.reason}
                                            onChange={(e) => setNewFlag({ ...newFlag, reason: e.target.value })}
                                            className="w-full p-3 border rounded-lg resize-none h-24"
                                            placeholder="Why should parents be notified?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Priority</label>
                                        <div className="flex gap-2">
                                            {["low", "medium", "high"].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setNewFlag({ ...newFlag, priority: p as any })}
                                                    className={`flex-1 py-2 rounded-lg border-2 capitalize transition-all ${newFlag.priority === p
                                                            ? "border-orange-500 bg-orange-50"
                                                            : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleAddFlag}
                                        className="w-full gap-2"
                                        style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                                    >
                                        <Flag className="h-4 w-4" />
                                        Create Flag
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Summary Preview Modal */}
                <AnimatePresence>
                    {selectedSummary && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setSelectedSummary(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-xl">
                                    <h3 className="text-xl font-bold">Weekly Summary Preview</h3>
                                    <p className="opacity-90">For {selectedSummary.parent_name}</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h4 className="font-bold text-lg mb-2">📊 This Week's Highlights</h4>
                                        <p className="text-gray-600 mb-2">
                                            {selectedSummary.learner_name} attended <strong>{selectedSummary.attendance}%</strong> of sessions
                                            and created <strong>{selectedSummary.artifacts_count} artifacts</strong>!
                                        </p>
                                        <ul className="list-disc list-inside text-gray-600">
                                            {selectedSummary.highlights.map((h, i) => (
                                                <li key={i}>{h}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-2">🌱 Areas for Growth</h4>
                                        <ul className="list-disc list-inside text-gray-600">
                                            {selectedSummary.areas_for_growth.map((a, i) => (
                                                <li key={i}>{a}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="flex gap-2 pt-4 border-t">
                                        <Button variant="outline" onClick={() => setSelectedSummary(null)} className="flex-1">
                                            Close
                                        </Button>
                                        <Button
                                            className="flex-1 gap-2"
                                            style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}
                                        >
                                            <Send className="h-4 w-4" />
                                            Send to Parent
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* New Request Modal */}
                <AnimatePresence>
                    {showNewRequestModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowNewRequestModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl max-w-md w-full p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold">Request Admin Support</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowNewRequestModal(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Request Type</label>
                                        <select
                                            value={newRequest.type}
                                            onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as any })}
                                            className="w-full p-3 border rounded-lg"
                                        >
                                            <option value="support">General Support</option>
                                            <option value="resources">Resources Needed</option>
                                            <option value="concern">Safety Concern</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Subject</label>
                                        <input
                                            type="text"
                                            value={newRequest.subject}
                                            onChange={(e) => setNewRequest({ ...newRequest, subject: e.target.value })}
                                            className="w-full p-3 border rounded-lg"
                                            placeholder="Brief subject line"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Message</label>
                                        <textarea
                                            value={newRequest.message}
                                            onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
                                            className="w-full p-3 border rounded-lg resize-none h-24"
                                            placeholder="Describe your request..."
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddRequest}
                                        className="w-full gap-2"
                                        style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}
                                    >
                                        <Send className="h-4 w-4" />
                                        Submit Request
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

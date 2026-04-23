import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Award, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PathwaySummary, Session, Microcredential, Learner } from "./artifact-capture-types";

interface ArtifactContextPanelProps {
    pathways: PathwaySummary[];
    selectedPathway: string;
    onPathwayChange: (id: string) => void;
    microcredentials: Microcredential[];
    pathwayLoading: boolean;
    selectedMicrocredential: string;
    onMicrocredentialChange: (id: string) => void;
    sessions: Session[];
    selectedSession: Session | null;
    onSessionToggle: (session: Session) => void;
    availableLearners: Learner[];
    selectedLearner: string;
    onLearnerChange: (id: string) => void;
}

export function ArtifactContextPanel({
    pathways, selectedPathway, onPathwayChange,
    microcredentials, pathwayLoading, selectedMicrocredential, onMicrocredentialChange,
    sessions, selectedSession, onSessionToggle,
    availableLearners, selectedLearner, onLearnerChange,
}: ArtifactContextPanelProps) {
    return (
        <>
            <PathwayCard
                pathways={pathways}
                selectedPathway={selectedPathway}
                onPathwayChange={onPathwayChange}
                microcredentials={microcredentials}
                pathwayLoading={pathwayLoading}
                selectedMicrocredential={selectedMicrocredential}
                onMicrocredentialChange={onMicrocredentialChange}
            />
            <SessionLearnerCard
                sessions={sessions}
                selectedSession={selectedSession}
                onSessionToggle={onSessionToggle}
                availableLearners={availableLearners}
                selectedLearner={selectedLearner}
                onLearnerChange={onLearnerChange}
            />
        </>
    );
}

function PathwayCard({ pathways, selectedPathway, onPathwayChange, microcredentials, pathwayLoading, selectedMicrocredential, onMicrocredentialChange }: {
    pathways: PathwaySummary[];
    selectedPathway: string;
    onPathwayChange: (id: string) => void;
    microcredentials: Microcredential[];
    pathwayLoading: boolean;
    selectedMicrocredential: string;
    onMicrocredentialChange: (id: string) => void;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-fundi-purple" />
                    Link to Pathway
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="mb-2 block">Pathway</Label>
                    <select
                        value={selectedPathway}
                        onChange={(e) => onPathwayChange(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="">— No pathway —</option>
                        {pathways.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <AnimatePresence>
                    {selectedPathway && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <Label className="mb-2 block">Microcredential</Label>
                            {pathwayLoading ? (
                                <p className="text-sm text-gray-400">Loading microcredentials…</p>
                            ) : microcredentials.length === 0 ? (
                                <p className="text-sm text-gray-400">No microcredentials found for this pathway.</p>
                            ) : (
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {microcredentials.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => onMicrocredentialChange(selectedMicrocredential === m.id ? "" : m.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                                                selectedMicrocredential === m.id
                                                    ? "border-purple-500 bg-purple-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <p className="font-medium">{m.name}</p>
                                            {m.badge_name && (
                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Sparkles className="h-3 w-3" /> {m.badge_name}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

function SessionLearnerCard({ sessions, selectedSession, onSessionToggle, availableLearners, selectedLearner, onLearnerChange }: {
    sessions: Session[];
    selectedSession: Session | null;
    onSessionToggle: (session: Session) => void;
    availableLearners: Learner[];
    selectedLearner: string;
    onLearnerChange: (id: string) => void;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-fundi-purple" />
                    Link to Session
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="mb-2 block">Today's Sessions</Label>
                    {sessions.length === 0 ? (
                        <p className="text-sm text-gray-400">No sessions today.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    type="button"
                                    onClick={() => onSessionToggle(session)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                        selectedSession?.id === session.id
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <p className="font-medium text-sm truncate">{session.module_name}</p>
                                    <p className="text-xs text-gray-500">
                                        {session.learner_count ?? session.learners?.length ?? 0} learners
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <Label className="mb-2 block">Select Learner *</Label>
                    <select
                        value={selectedLearner}
                        onChange={(e) => onLearnerChange(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        required
                    >
                        <option value="">Choose a learner...</option>
                        {availableLearners.map((l) => (
                            <option key={l.id} value={l.id}>{l.full_name}</option>
                        ))}
                    </select>
                </div>
            </CardContent>
        </Card>
    );
}

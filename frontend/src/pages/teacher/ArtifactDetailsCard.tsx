import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookOpen, Lightbulb, Sparkles, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { REFLECTION_PROMPTS } from "./artifact-capture-types";

interface ArtifactDetailsCardProps {
    title: string;
    onTitleChange: (v: string) => void;
    reflection: string;
    onReflectionChange: (v: string) => void;
    showPrompts: boolean;
    onShowPrompts: (v: boolean) => void;
    currentPrompt: number;
    onPromptChange: (i: number) => void;
    onAppendPrompt: () => void;
    saving: boolean;
    canSubmit: boolean;
    onSubmit: () => void;
}

export function ArtifactDetailsCard({
    title, onTitleChange,
    reflection, onReflectionChange,
    showPrompts, onShowPrompts,
    currentPrompt, onPromptChange, onAppendPrompt,
    saving, canSubmit, onSubmit,
}: ArtifactDetailsCardProps) {
    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-fundi-orange" />
                        Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TitleInput title={title} onChange={onTitleChange} />
                    <ReflectionSection
                        reflection={reflection}
                        onReflectionChange={onReflectionChange}
                        showPrompts={showPrompts}
                        onShowPrompts={onShowPrompts}
                        currentPrompt={currentPrompt}
                        onPromptChange={onPromptChange}
                        onAppendPrompt={onAppendPrompt}
                    />
                </CardContent>
            </Card>

            <SubmitButton saving={saving} canSubmit={canSubmit} onSubmit={onSubmit} />
        </>
    );
}

function TitleInput({ title, onChange }: { title: string; onChange: (v: string) => void }) {
    return (
        <div>
            <Label className="mb-2 block">Title *</Label>
            <input
                type="text"
                value={title}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. Robot Arm Assembly"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
            />
        </div>
    );
}

function ReflectionSection({
    reflection, onReflectionChange,
    showPrompts, onShowPrompts,
    currentPrompt, onPromptChange, onAppendPrompt,
}: {
    reflection: string;
    onReflectionChange: (v: string) => void;
    showPrompts: boolean;
    onShowPrompts: (v: boolean) => void;
    currentPrompt: number;
    onPromptChange: (i: number) => void;
    onAppendPrompt: () => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <Label>Reflection / Observation</Label>
                <Button type="button" variant="ghost" size="sm"
                    onClick={() => onShowPrompts(!showPrompts)} className="text-xs gap-1">
                    <Lightbulb className="h-3 w-3" /> Prompts
                </Button>
            </div>

            <AnimatePresence>
                {showPrompts && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="mb-3">
                        <PromptsCarousel
                            currentPrompt={currentPrompt}
                            onPromptChange={onPromptChange}
                            onAppendPrompt={onAppendPrompt}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <textarea
                value={reflection}
                onChange={(e) => onReflectionChange(e.target.value)}
                placeholder="What did the learner accomplish? What skills did they demonstrate?"
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
        </div>
    );
}

function PromptsCarousel({ currentPrompt, onPromptChange, onAppendPrompt }: {
    currentPrompt: number;
    onPromptChange: (i: number) => void;
    onAppendPrompt: () => void;
}) {
    return (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
                <Sparkles className="h-4 w-4 text-yellow-600" />
                <div className="flex gap-1">
                    {REFLECTION_PROMPTS.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onPromptChange(i)}
                            className={`w-2 h-2 rounded-full ${i === currentPrompt ? "bg-yellow-600" : "bg-yellow-300"}`}
                        />
                    ))}
                </div>
            </div>
            <p className="text-sm text-yellow-800 mt-2 italic cursor-pointer" onClick={onAppendPrompt}>
                "{REFLECTION_PROMPTS[currentPrompt]}"
            </p>
        </div>
    );
}

function SubmitButton({ saving, canSubmit, onSubmit }: {
    saving: boolean;
    canSubmit: boolean;
    onSubmit: () => void;
}) {
    return (
        <Button
            type="button"
            onClick={onSubmit}
            disabled={saving || !canSubmit}
            className="w-full h-14 text-lg gap-2 bg-fundi-orange text-white"
        >
            {saving ? (
                <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Capturing...
                </>
            ) : (
                <>
                    <Upload className="h-5 w-5" />
                    Capture Artifact
                </>
            )}
        </Button>
    );
}

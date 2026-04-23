import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link2, Plus, X, Target } from "lucide-react";
import { motion } from "framer-motion";
import { ACCEPTED_FILE_TYPES, METRIC_PRESETS, fileIcon } from "./artifact-capture-types";
import type { AttachedItem } from "./artifact-capture-types";

interface ArtifactAttachPanelProps {
    attachments: AttachedItem[];
    selectedMetrics: string[];
    showLinkForm: boolean;
    linkInput: string;
    linkLabel: string;
    onDrop: (e: React.DragEvent) => void;
    onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onShowLinkForm: (show: boolean) => void;
    onLinkInputChange: (v: string) => void;
    onLinkLabelChange: (v: string) => void;
    onAddLink: () => void;
    onRemoveAttachment: (id: string) => void;
    onToggleMetric: (id: string) => void;
}

export function ArtifactAttachPanel({
    attachments, selectedMetrics, showLinkForm, linkInput, linkLabel,
    onDrop, onFileInput, onShowLinkForm, onLinkInputChange, onLinkLabelChange,
    onAddLink, onRemoveAttachment, onToggleMetric,
}: ArtifactAttachPanelProps) {
    return (
        <>
            <Card className="overflow-hidden">
                <CardHeader className="py-4 px-5 border-b">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Upload className="h-5 w-5 text-fundi-orange" />
                        Attach Media &amp; Files
                    </CardTitle>
                    <CardDescription>Upload files or add links to evidence</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <DropZone onDrop={onDrop} onFileInput={onFileInput} />
                    <LinkSection
                        showLinkForm={showLinkForm} linkInput={linkInput} linkLabel={linkLabel}
                        onShowLinkForm={onShowLinkForm} onLinkInputChange={onLinkInputChange}
                        onLinkLabelChange={onLinkLabelChange} onAddLink={onAddLink}
                    />
                    {attachments.length > 0 && (
                        <AttachmentList attachments={attachments} onRemove={onRemoveAttachment} />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-fundi-cyan" />
                        Quick Tags
                    </CardTitle>
                    <CardDescription>What did the learner demonstrate?</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {METRIC_PRESETS.map((metric) => (
                            <button
                                key={metric.id}
                                type="button"
                                onClick={() => onToggleMetric(metric.id)}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                    selectedMetrics.includes(metric.id)
                                        ? "bg-cyan-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {metric.name}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

function DropZone({ onDrop, onFileInput }: {
    onDrop: (e: React.DragEvent) => void;
    onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("file-upload")?.click()}
        >
            <input type="file" accept={ACCEPTED_FILE_TYPES} multiple onChange={onFileInput} className="hidden" id="file-upload" />
            <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-1 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 leading-relaxed">
                Images · Videos · PDFs · Word · Excel · PowerPoint · ZIP · CAD files
            </p>
        </div>
    );
}

function LinkSection({ showLinkForm, linkInput, linkLabel, onShowLinkForm, onLinkInputChange, onLinkLabelChange, onAddLink }: {
    showLinkForm: boolean; linkInput: string; linkLabel: string;
    onShowLinkForm: (v: boolean) => void; onLinkInputChange: (v: string) => void;
    onLinkLabelChange: (v: string) => void; onAddLink: () => void;
}) {
    const cancel = () => { onShowLinkForm(false); onLinkInputChange(""); onLinkLabelChange(""); };

    return (
        <div>
            {!showLinkForm ? (
                <button type="button" onClick={() => onShowLinkForm(true)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors">
                    <Link2 className="h-4 w-4" /> Add a link (YouTube, Google Drive, etc.)
                </button>
            ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="border rounded-xl p-4 space-y-3 bg-orange-50">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-fundi-orange" /> Add Link
                    </p>
                    <Input placeholder="https://…" value={linkInput} onChange={(e) => onLinkInputChange(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddLink(); } }} className="bg-white" />
                    <Input placeholder="Label (optional)" value={linkLabel} onChange={(e) => onLinkLabelChange(e.target.value)} className="bg-white" />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={onAddLink} className="bg-fundi-orange text-white gap-1">
                            <Plus className="h-3.5 w-3.5" /> Add
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function AttachmentList({ attachments, onRemove }: { attachments: AttachedItem[]; onRemove: (id: string) => void }) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attached ({attachments.length})</p>
            {attachments.map((a) => <AttachmentRow key={a.id} item={a} onRemove={onRemove} />)}
        </div>
    );
}

function AttachmentRow({ item, onRemove }: { item: AttachedItem; onRemove: (id: string) => void }) {
    const RemoveBtn = () => (
        <button type="button" onClick={() => onRemove(item.id)}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
            <X className="h-3.5 w-3.5" />
        </button>
    );

    if (item.kind === "link") {
        return (
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm group">
                <Link2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate flex-1 text-blue-600">{item.label}</span>
                <RemoveBtn />
            </div>
        );
    }

    const { icon: Icon, label } = fileIcon(item.file!);
    const isImage = item.file!.type.startsWith("image/");
    return (
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm group">
            {isImage ? (
                <img src={URL.createObjectURL(item.file!)} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
            ) : (
                <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-gray-500" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{item.file!.name}</p>
                <p className="text-xs text-gray-400">{label} · {(item.file!.size / 1024).toFixed(0)} KB</p>
            </div>
            <RemoveBtn />
        </div>
    );
}

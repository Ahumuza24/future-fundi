import { FileText, FileArchive, FileSpreadsheet, Presentation, Wrench, Image, Film } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Learner {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

export interface Session {
    id: string;
    module_name: string;
    date: string;
    learner_count?: number;
    learners?: Learner[];
}

export interface PathwaySummary {
    id: string;
    name: string;
}

export interface Microcredential {
    id: string;
    name: string;
    badge_name?: string;
}

export interface MetricPreset {
    id: string;
    name: string;
    description: string;
    category: string;
}

export type RawLearner = {
    id?: string | number;
    first_name?: string;
    last_name?: string;
    full_name?: string;
};

export type RawPathwaySummary = {
    id?: string | number;
    name?: string;
};

export type RawModule = {
    id?: string | number;
    name?: string;
    badge_name?: string;
};

export interface ArtifactCapturePayload {
    learner: string;
    title: string;
    reflection: string;
    metrics: string[];
    session?: string;
    module?: string;
    files: File[];
    links: { url: string; label?: string }[];
}

export interface AttachedItem {
    id: string;
    kind: "file" | "link";
    file?: File;
    url?: string;
    label?: string;
}

export const METRIC_PRESETS: MetricPreset[] = [
    { id: "problem_solving", name: "Problem Solving",  description: "Found creative solutions",        category: "skills"    },
    { id: "collaboration",   name: "Teamwork",          description: "Worked well with others",         category: "skills"    },
    { id: "persistence",     name: "Persistence",       description: "Didn't give up on challenges",    category: "skills"    },
    { id: "creativity",      name: "Creative Thinking", description: "Original or innovative approach", category: "skills"    },
    { id: "technical",       name: "Technical Skill",   description: "Demonstrated hands-on ability",  category: "skills"    },
    { id: "communication",   name: "Communication",     description: "Explained ideas clearly",         category: "skills"    },
    { id: "first_success",   name: "First Success",     description: "Achieved something new",          category: "milestone" },
    { id: "breakthrough",    name: "Breakthrough",      description: "Overcame a major challenge",      category: "milestone" },
    { id: "helping_others",  name: "Helping Others",    description: "Supported a peer",                category: "milestone" },
];

export const REFLECTION_PROMPTS = [
    "What did the learner accomplish today?",
    "What new skill did they demonstrate?",
    "What challenge did they overcome?",
    "What should they focus on next?",
    "What surprised you about their work?",
];

export const ACCEPTED_FILE_TYPES = [
    "image/*", "video/*", "application/pdf",
    "application/zip", "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-powerpoint",
    "model/stl", "application/sla", "application/x-autocad", "application/acad",
    "image/vnd.dwg", "image/vnd.dxf",
    ".stl", ".obj", ".dwg", ".dxf", ".f3d", ".step", ".stp", ".rar", ".7z", ".tar", ".gz",
].join(",");

const CAD_EXTENSIONS = [".stl", ".obj", ".dwg", ".dxf", ".f3d", ".step", ".stp"];

export function fileIcon(file: File): { icon: LucideIcon; label: string } {
    const t = file.type.toLowerCase();
    const n = file.name.toLowerCase();
    if (t.startsWith("image/"))        return { icon: Image,            label: "Image"      };
    if (t.startsWith("video/"))        return { icon: Film,             label: "Video"      };
    if (t === "application/pdf")       return { icon: FileText,         label: "PDF"        };
    if (t.includes("word")   || n.endsWith(".docx") || n.endsWith(".doc"))  return { icon: FileText,        label: "Word"       };
    if (t.includes("sheet")  || t.includes("excel") || n.endsWith(".xlsx") || n.endsWith(".xls")) return { icon: FileSpreadsheet, label: "Excel"      };
    if (t.includes("presentation") || t.includes("powerpoint") || n.endsWith(".pptx") || n.endsWith(".ppt")) return { icon: Presentation, label: "PowerPoint" };
    if (t.includes("zip") || n.endsWith(".zip") || n.endsWith(".rar") || n.endsWith(".7z")) return { icon: FileArchive, label: "Archive" };
    if (CAD_EXTENSIONS.some((e) => n.endsWith(e))) return { icon: Wrench, label: "CAD" };
    return { icon: FileText, label: "File" };
}

export function uid(): string {
    return Math.random().toString(36).slice(2);
}

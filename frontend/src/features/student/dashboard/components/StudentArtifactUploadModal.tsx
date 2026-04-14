import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, X, Loader2, BookOpen, GraduationCap } from "lucide-react";
import { studentApi } from "@/lib/api";

interface Module {
  id: string;
  name: string;
  description: string;
}

interface Pathway {
  course_id: string;
  course_name: string;
  modules: Module[];
}

interface StudentArtifactUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentArtifactUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: StudentArtifactUploadModalProps) {
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pathway and Module selection
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [modulesLoading, setModulesLoading] = useState(false);

  // Fetch pathways and modules when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchModules();
    }
  }, [isOpen]);

  const fetchModules = async () => {
    setModulesLoading(true);
    try {
      const response = await studentApi.getMyModules();
      const data = response.data as { pathways: Pathway[] };
      setPathways(data.pathways || []);
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    } finally {
      setModulesLoading(false);
    }
  };

  // Get modules for selected pathway
  const availableModules = selectedPathwayId
    ? pathways.find((p) => p.course_id === selectedPathwayId)?.modules || []
    : [];

  // Handle pathway selection
  const handlePathwayChange = (pathwayId: string) => {
    setSelectedPathwayId(pathwayId);
    setSelectedModuleId(""); // Reset module when pathway changes
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please add a title for your artifact.");
      return;
    }
    if (!selectedModuleId) {
      setError("Please select a pathway and microcredential for this artifact.");
      return;
    }
    if (files.length === 0) {
      setError("Please add at least one file or image.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await studentApi.uploadArtifact({
        title,
        reflection,
        files: files.length > 0 ? files : undefined,
        module_id: selectedModuleId,
      });

      // Reset form
      setTitle("");
      setReflection("");
      setFiles([]);
      setSelectedPathwayId("");
      setSelectedModuleId("");
      onSuccess();
    } catch (err: any) {
      // Handle validation errors from the backend
      const responseData = err.response?.data;
      if (responseData) {
        // Check for specific field errors
        if (responseData.title) {
          setError(`Title: ${responseData.title}`);
        } else if (responseData.reflection) {
          setError(`Reflection: ${responseData.reflection}`);
        } else if (responseData.error) {
          setError(responseData.error);
        } else if (responseData.detail) {
          setError(responseData.detail);
        } else {
          // Handle generic validation errors object
          const errorMessages = Object.entries(responseData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          setError(errorMessages || "Failed to upload artifact. Please try again.");
        }
      } else {
        setError(err.message || "Failed to upload artifact. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Upload Artifact</DialogTitle>
          <DialogDescription>
            Submit your work for teacher review.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pathway Selection - Using native select to avoid clipping issues */}
          <div className="space-y-2">
            <Label htmlFor="pathway">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-orange-500" />
                Pathway <span className="text-red-500">*</span>
              </span>
            </Label>
            <div className="relative">
              <select
                id="pathway"
                value={selectedPathwayId}
                onChange={(e) => handlePathwayChange(e.target.value)}
                disabled={loading || modulesLoading}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
              >
                <option value="">{modulesLoading ? "Loading pathways..." : "Select your pathway"}</option>
                {pathways.map((pathway) => (
                  <option key={pathway.course_id} value={pathway.course_id}>
                    {pathway.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Module/Microcredential Selection - Using native select */}
          <div className="space-y-2">
            <Label htmlFor="module">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                Microcredential <span className="text-red-500">*</span>
              </span>
            </Label>
            <div className="relative">
              <select
                id="module"
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                disabled={loading || !selectedPathwayId || availableModules.length === 0}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
              >
                <option value="">
                  {!selectedPathwayId
                    ? "Select a pathway first"
                    : availableModules.length === 0
                    ? "No modules available"
                    : "Select microcredential"}
                </option>
                {availableModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedPathwayId && availableModules.length === 0 && (
              <p className="text-xs text-amber-600">No microcredentials available for this pathway.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Science Project"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reflection">Reflection (Optional)</Label>
            <textarea
              id="reflection"
              rows={3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you learn? What was challenging?"
              className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Files</Label>
            
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium text-orange-500 hover:text-orange-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileSelect}
                      disabled={loading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md border text-sm">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-500"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-100 mt-4 -mx-6 px-6 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Artifact"
              )}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

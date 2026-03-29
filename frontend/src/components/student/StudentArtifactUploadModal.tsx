import { useState } from "react";
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
import { UploadCloud, X, Loader2 } from "lucide-react";
import { studentApi } from "@/lib/api";

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
    if (files.length === 0) {
      // In a real app we might allow no files if reflection is provided, but typically we want at least one image/doc
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
      });

      // Reset form
      setTitle("");
      setReflection("");
      setFiles([]);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to upload artifact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Artifact</DialogTitle>
          <DialogDescription>
            Submit your work for teacher review.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 font-bold text-white">
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
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useEffect, type FormEvent, type DragEvent } from "react";
import { useResume, useSaveResume, useUploadResume, useDeleteResume } from "../hooks/useResume";

const INPUT =
  "w-full rounded-lg border border-border-default bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export default function ResumePage() {
  const { data: resume, isLoading } = useResume();
  const saveMutation = useSaveResume();
  const uploadMutation = useUploadResume();
  const deleteMutation = useDeleteResume();

  const [content, setContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resume?.content && !content) {
      setContent(resume.content);
    }
  }, [resume, content]);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    saveMutation.mutate(content.trim(), {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }

  function handleFileUpload(file: File) {
    const validTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Only PDF, DOCX, DOC, and TXT files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5 MB.");
      return;
    }
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        setContent(data.content);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  function handleDelete() {
    if (!confirm("Remove your saved resume?")) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => setContent(""),
    });
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-text-primary">My Resume</h1>
        <div className="space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-surface-elevated" />
          <div className="h-40 animate-pulse rounded-lg bg-surface-elevated" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Resume</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Upload or paste your resume — it will be used automatically when generating cover letters.
          </p>
        </div>
        {resume && (
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            Remove Resume
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload area */}
        <div className="lg:col-span-1">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-accent bg-accent/5"
                : "border-border-default bg-surface-secondary hover:border-text-tertiary"
            }`}
          >
            <svg className="mb-3 h-10 w-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p className="text-sm font-medium text-text-secondary">
              {uploadMutation.isPending ? "Uploading..." : "Drop a file here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">PDF, DOCX, DOC, or TXT — up to 5 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {uploadMutation.isError && (
            <p className="mt-2 text-sm text-red-400">Upload failed. Make sure it's a valid PDF, DOCX, DOC, or TXT file.</p>
          )}

          {resume?.fileName && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-2">
              <svg className="h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate text-xs text-text-secondary">{resume.fileName}</span>
            </div>
          )}

          {resume && (
            <p className="mt-3 text-xs text-text-tertiary">
              Last updated: {new Date(resume.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Text editor */}
        <form onSubmit={handleSave} className="lg:col-span-2">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Resume Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your resume text here, or upload a file to auto-fill..."
            rows={20}
            className={INPUT + " resize-y font-mono text-xs leading-relaxed"}
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending || !content.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Resume"}
            </button>
            {saved && (
              <span className="text-sm font-medium text-green-400">Saved!</span>
            )}
            {saveMutation.isError && (
              <span className="text-sm text-red-400">Failed to save.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

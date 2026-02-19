import { useState, type FormEvent } from "react";
import { useNotes, useCreateNote, useDeleteNote } from "../../hooks/useNotes";
import { formatDate } from "../../lib/utils";

interface NotesListProps {
  applicationId: string;
}

export default function NotesList({ applicationId }: NotesListProps) {
  const { data: notes = [], isLoading } = useNotes(applicationId);
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();
  const [content, setContent] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate(
      { applicationId, content: content.trim() },
      { onSuccess: () => setContent("") }
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="w-full rounded-lg border border-border-default bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || createMutation.isPending}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding..." : "Add Note"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-text-tertiary">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-text-tertiary">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-border-default bg-surface-tertiary px-4 py-3">
              <p className="whitespace-pre-wrap text-sm text-text-primary">{note.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-text-tertiary">{formatDate(note.createdAt)}</span>
                <button
                  onClick={() => deleteMutation.mutate({ applicationId, noteId: note.id })}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

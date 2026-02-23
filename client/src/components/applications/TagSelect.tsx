import { useState, useRef, useEffect } from "react";
import {
  useTags,
  useCreateTag,
  useDeleteTag,
  useAddTagToApplication,
  useRemoveTagFromApplication,
} from "../../hooks/useTags";
import { TAG_COLORS } from "../../lib/constants";
import type { ApplicationTag } from "../../types";

interface TagSelectProps {
  applicationId: string;
  currentTags: ApplicationTag[];
}

export default function TagSelect({ applicationId, currentTags }: TagSelectProps) {
  const { data: allTags = [] } = useTags();
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const addMutation = useAddTagToApplication();
  const removeMutation = useRemoveTagFromApplication();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0].value);
  const [showCreate, setShowCreate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeCurrentTags = Array.isArray(currentTags) ? currentTags : [];
  const safeAllTags = Array.isArray(allTags) ? allTags : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const appliedTagIds = new Set(safeCurrentTags.map((t) => t.tagId));

  function handleToggleTag(tagId: string) {
    if (appliedTagIds.has(tagId)) {
      removeMutation.mutate({ applicationId, tagId });
    } else {
      addMutation.mutate({ applicationId, tagId });
    }
  }

  function handleDeleteTag(e: React.MouseEvent, tagId: string, tagName: string) {
    e.stopPropagation();
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all applications.`)) return;
    deleteTagMutation.mutate(tagId);
  }

  function handleCreateTag() {
    if (!newName.trim()) return;
    createTagMutation.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: (tag) => {
          addMutation.mutate({ applicationId, tagId: tag.id });
          setNewName("");
          setNewColor(TAG_COLORS[0].value);
          setShowCreate(false);
        },
      }
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap items-center gap-1.5">
        {safeCurrentTags.map(({ tag, tagId }) => (
          <span
            key={tagId}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => removeMutation.mutate({ applicationId, tagId })}
              className="ml-0.5 opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </span>
        ))}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-default px-2.5 py-0.5 text-xs text-text-tertiary hover:border-accent hover:text-accent"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tag
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-border-default bg-surface-secondary p-2 shadow-lg">
          {safeAllTags.length > 0 && (
            <div className="mb-2 max-h-40 space-y-0.5 overflow-y-auto">
              {safeAllTags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-tertiary"
                >
                  <button
                    onClick={() => handleToggleTag(tag.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate text-text-primary">{tag.name}</span>
                    {appliedTagIds.has(tag.id) && (
                      <svg className="ml-auto h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDeleteTag(e, tag.id, tag.name)}
                    disabled={deleteTagMutation.isPending}
                    className="shrink-0 rounded p-0.5 text-text-tertiary opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete tag"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {showCreate ? (
            <div className="border-t border-border-default pt-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tag name"
                autoFocus
                className="mb-2 w-full rounded-md border border-border-default bg-surface-tertiary px-2 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              />
              <div className="mb-2 flex flex-wrap gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewColor(c.value)}
                    className={`h-5 w-5 rounded-full transition-transform ${
                      newColor === c.value ? "scale-125 ring-2 ring-white/50" : ""
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-md border border-border-default px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={!newName.trim() || createTagMutation.isPending}
                  className="flex-1 rounded-md bg-accent px-2 py-1 text-xs text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 rounded-md border-t border-border-default px-2 pt-2 text-sm text-accent hover:text-accent-hover"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create new tag
            </button>
          )}
        </div>
      )}
    </div>
  );
}

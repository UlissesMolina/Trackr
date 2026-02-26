import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import {
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  type ApplicationPriority,
} from "../../lib/constants";

interface PrioritySelectProps {
  applicationId: string;
  currentPriority: ApplicationPriority | null;
}

const INPUT =
  "rounded-lg border border-border-default bg-surface-tertiary px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export default function PrioritySelect({
  applicationId,
  currentPriority,
}: PrioritySelectProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (priority: ApplicationPriority | null) => {
      const { data } = await api.patch(`/applications/${applicationId}`, {
        priority: priority ?? null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", applicationId] });
    },
  });

  return (
    <select
      value={currentPriority ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        updateMutation.mutate(
          val ? (val as ApplicationPriority) : null
        );
      }}
      disabled={updateMutation.isPending}
      className={INPUT}
    >
      <option value="">No priority</option>
      {PRIORITY_LEVELS.map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p]}
        </option>
      ))}
    </select>
  );
}

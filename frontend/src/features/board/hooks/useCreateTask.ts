import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSectionTask } from "../api";
import { CreateTaskPayload } from "../types";
import { boardQueryKey } from "./useBoard";

export const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: CreateTaskPayload }) =>
      createSectionTask(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSprint,
  updateSprint,
  addTaskToSprint,
  removeTaskFromSprint,
} from "../api";
import { CreateSprintPayload, UpdateSprintPayload } from "../types";
import { sprintsQueryKey } from "./useSprints";
import { backlogQueryKey } from "./useBacklog";

export const useCreateSprint = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSprintPayload) => createSprint(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: backlogQueryKey(projectId) });
    },
  });
};

export const useUpdateSprint = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sprintId,
      payload,
    }: {
      sprintId: string;
      payload: UpdateSprintPayload;
    }) => updateSprint(sprintId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: backlogQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
  });
};

export const useAddTaskToSprint = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      addTaskToSprint(sprintId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: backlogQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
  });
};

export const useRemoveTaskFromSprint = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      removeTaskFromSprint(sprintId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: backlogQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    },
  });
};

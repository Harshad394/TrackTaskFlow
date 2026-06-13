import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSection, deleteSection, updateSection } from "../api";
import { BoardSection, CreateSectionPayload, UpdateSectionPayload } from "../types";
import { boardQueryKey } from "./useBoard";

/** POST /projects/:projectId/sections */
export const useCreateSection = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation<BoardSection, Error, CreateSectionPayload>({
    mutationFn: (data) => createSection(projectId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) }),
  });
};

/** PATCH /sections/:sectionId */
export const useUpdateSection = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    BoardSection,
    Error,
    { sectionId: string; data: UpdateSectionPayload }
  >({
    mutationFn: ({ sectionId, data }) => updateSection(sectionId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) }),
  });
};

/** DELETE /sections/:sectionId */
export const useDeleteSection = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { sectionId: string }>({
    mutationFn: ({ sectionId }) => deleteSection(sectionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) }),
  });
};

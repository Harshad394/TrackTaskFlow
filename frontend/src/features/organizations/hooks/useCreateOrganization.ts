import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrganization } from "../api";
import { CreateOrganizationPayload } from "../types";

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationPayload) => createOrganization(data),
    onSuccess: () => {
      // Invalidate organizations list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
};

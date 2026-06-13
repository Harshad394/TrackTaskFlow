import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeOrganizationMember } from "../api";
import { organizationMembersQueryKey } from "./useOrganizationMembers";

export const useRemoveOrganizationMember = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeOrganizationMember(organizationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
};

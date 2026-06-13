import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOrganizationMember } from "../api";
import { OrganizationRole } from "../types";
import { organizationMembersQueryKey } from "./useOrganizationMembers";

export const useAddOrganizationMember = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrganizationRole }) =>
      addOrganizationMember(organizationId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
};

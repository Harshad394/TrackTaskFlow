import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrganizationMemberRole } from "../api";
import { OrganizationRole } from "../types";
import { organizationMembersQueryKey } from "./useOrganizationMembers";

export const useUpdateOrganizationMember = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrganizationRole }) =>
      updateOrganizationMemberRole(organizationId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
};

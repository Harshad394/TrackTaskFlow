import { useQuery } from "@tanstack/react-query";
import { getOrganizationMembers } from "../api";

export const organizationMembersQueryKey = (organizationId: string) =>
  ["organization-members", organizationId] as const;

export const useOrganizationMembers = (organizationId: string) => {
  return useQuery({
    queryKey: organizationMembersQueryKey(organizationId),
    queryFn: () => getOrganizationMembers(organizationId),
    enabled: Boolean(organizationId),
  });
};

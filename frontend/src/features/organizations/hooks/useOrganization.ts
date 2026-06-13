import { useQuery } from "@tanstack/react-query";
import { getOrganization } from "../api";

export const organizationQueryKey = (organizationId: string) =>
  ["organization", organizationId] as const;

export const useOrganization = (organizationId: string) => {
  return useQuery({
    queryKey: organizationQueryKey(organizationId),
    queryFn: () => getOrganization(organizationId),
    enabled: Boolean(organizationId),
  });
};

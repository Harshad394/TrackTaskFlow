import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api";

export const useProjects = (orgId: string | null) => {
  return useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => getProjects(orgId!),
    enabled: !!orgId, // Only run the query if we have an orgId
  });
};

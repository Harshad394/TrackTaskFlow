import { useQuery } from "@tanstack/react-query";
import { getSprints } from "../api";

export const sprintsQueryKey = (projectId: string) => ["sprints", projectId] as const;

export const useSprints = (projectId: string) => {
  return useQuery({
    queryKey: sprintsQueryKey(projectId),
    queryFn: () => getSprints(projectId),
    enabled: Boolean(projectId),
  });
};

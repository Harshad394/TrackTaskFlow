import { useQuery } from "@tanstack/react-query";
import { getProjectForPermissions } from "../api";

export const useProjectPermissions = (projectId: string) => {
  return useQuery({
    queryKey: ["project-permissions", projectId],
    queryFn: () => getProjectForPermissions(projectId),
    enabled: Boolean(projectId),
  });
};

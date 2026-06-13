import { useQuery } from "@tanstack/react-query";
import { getProjectWithMembers } from "../api";

export const projectMembersQueryKey = (projectId: string) =>
  ["project-members", projectId] as const;

export const useProjectMembers = (projectId: string) => {
  return useQuery({
    queryKey: projectMembersQueryKey(projectId),
    queryFn: () => getProjectWithMembers(projectId),
    enabled: Boolean(projectId),
  });
};

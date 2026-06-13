import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "../../auth/hooks/useMe";
import { getProjectForTimeLogs } from "../api";
import { ProjectRole } from "../types";

export const useProjectRole = (projectId: string) => {
  const { data: user } = useMe();
  const projectQuery = useQuery({
    queryKey: ["project-role", projectId],
    queryFn: () => getProjectForTimeLogs(projectId),
    enabled: Boolean(projectId),
  });

  const role = useMemo<ProjectRole | undefined>(() => {
    const members = projectQuery.data?.members || [];
    const member = members.find((projectMember: any) => {
      const memberUserId =
        typeof projectMember.userId === "string"
          ? projectMember.userId
          : projectMember.userId?._id || projectMember.userId?.id;

      return memberUserId === user?.id;
    });

    return member?.role;
  }, [projectQuery.data?.members, user?.id]);

  return {
    ...projectQuery,
    role,
    isAdmin: role === "ADMIN",
    canUseTaskTimeLogs: role === "ADMIN" || role === "DEVELOPER" || role === "QA",
  };
};

import { useQuery } from "@tanstack/react-query";
import { getProjectBoard } from "../api";

export const boardQueryKey = (projectId: string) => ["board", projectId] as const;

export const useBoard = (projectId: string) => {
  return useQuery({
    queryKey: boardQueryKey(projectId),
    queryFn: () => getProjectBoard(projectId),
    enabled: Boolean(projectId),
  });
};

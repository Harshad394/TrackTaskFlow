import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "../api";

export const useUserSearch = (query: string) => {
  return useQuery({
    queryKey: ["user-search", query],
    queryFn: () => searchUsers(query),
    enabled: query.trim().length >= 2,
  });
};

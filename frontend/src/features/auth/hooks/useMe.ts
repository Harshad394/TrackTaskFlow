import { useQuery } from "@tanstack/react-query";
import { getUser } from "../api";
import { User } from "../types";

export const useMe = () => {
  return useQuery<User, Error>({
    queryKey: ["me"],
    queryFn: getUser,
    retry: false, // Don't retry if unauthenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

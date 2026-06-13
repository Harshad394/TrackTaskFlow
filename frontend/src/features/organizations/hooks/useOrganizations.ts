import { useQuery } from "@tanstack/react-query";
import { getOrganizations } from "../api";

export const useOrganizations = () => {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
  });
};

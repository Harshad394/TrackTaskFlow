import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api";
import { useAuthStore } from "../../../stores/auth-store";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      // Clear react query cache completely
      queryClient.clear();
      // Set Zustand store authenticated flag to false
      setAuth(false);
    },
  });
};

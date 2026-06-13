import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginWithCredentials } from "../api";
import { LoginCredentials } from "../types";
import { useAuthStore } from "../../../stores/auth-store";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginWithCredentials(credentials),
    onSuccess: async () => {
      // Invalidate the 'me' query to force a refetch of user data
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      // We could also optimistically set isAuthenticated to true
      setAuth(true);
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerWithCredentials } from "../api";
import { RegisterCredentials } from "../types";
import { useAuthStore } from "../../../stores/auth-store";

export const useRegister = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => registerWithCredentials(credentials),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setAuth(true);
    },
  });
};

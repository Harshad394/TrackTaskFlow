import api from "../../../lib/api";
import { LoginCredentials, RegisterCredentials, User } from "../types";

export const loginWithCredentials = async (data: LoginCredentials): Promise<void> => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const registerWithCredentials = async (data: RegisterCredentials): Promise<void> => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getUser = async (): Promise<User> => {
  const response = await api.get("/users/me");
  return response.data;
};

export const refreshToken = async (): Promise<void> => {
  const response = await api.post("/auth/refresh");
  return response.data;
};

import axios from "axios";

// Create a centralized Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003/api",
  withCredentials: true, // Crucial for cookie-based auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Interceptors for logging or handling global errors (e.g., 401s)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call. Redirecting to login.");
      if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);



export const organizationApi = {
  list: async () => {
    const res = await api.get("/organizations");
    return res.data;
  },
  get: async (orgId: string) => {
    const res = await api.get(`/organizations/${orgId}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/organizations", data);
    return res.data;
  },
};

export default api;

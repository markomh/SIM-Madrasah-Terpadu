import { apiClient } from "./api-client";
import { setAuthToken, removeAuthToken } from "./api-client";

export const authApi = {
  login: async (email: string, password: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Login failed");
    if (json.token) setAuthToken(json.token);
    return json.data;
  },
  logout: async () => {
    try {
      await apiClient.post("/logout");
    } catch {
      // Ignore
    } finally {
      removeAuthToken();
    }
  },
  getMe: async () => {
    return apiClient.get<unknown>("/me");
  },
};

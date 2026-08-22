import { z } from "zod";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const TOKEN_KEY = "sim-madrasah-token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}, schema?: z.ZodType<T>): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const errorMessage = "Koneksi terputus: Waktu permintaan habis (Network Degradation)";
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("app-api-error", {
            detail: { status: 408, message: errorMessage },
          })
        );
      }
      throw new Error(errorMessage);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // JSON parse error — keep default message
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app-api-error", {
          detail: { status: response.status, message: errorMessage },
        })
      );
    }

    throw new Error(errorMessage);
  }

  const json = await response.json();
  const rawData = json.data !== undefined ? json.data : json;

  if (schema) {
    const parsed = schema.safeParse(rawData);
    if (!parsed.success) {
      const issueDetails = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
        .join("; ");
      const errorMessage = `SSoT Violation: Invalid API Response Format (${issueDetails})`;

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("app-api-error", {
            detail: { status: 500, message: errorMessage },
          })
        );
      }
      throw new Error(errorMessage);
    }
    return parsed.data;
  }

  return rawData;
}

export const apiClient = {
  get: <T>(endpoint: string, schema?: z.ZodType<T>) => request<T>(endpoint, { method: "GET" }, schema),
  post: <T>(endpoint: string, body?: unknown, schema?: z.ZodType<T>) =>
    request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }, schema),
  put: <T>(endpoint: string, body?: unknown, schema?: z.ZodType<T>) =>
    request<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, schema),
  patch: <T>(endpoint: string, body?: unknown, schema?: z.ZodType<T>) =>
    request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, schema),
  delete: <T>(endpoint: string, schema?: z.ZodType<T>) => request<T>(endpoint, { method: "DELETE" }, schema),
};

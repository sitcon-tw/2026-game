const API_BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: { message?: string }
  ) {
    super(data.message ?? `API error ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    // Global 401 handler — clear auth state so guards redirect to /login
    if (res.status === 401) {
      try {
        const { useUserStore } = await import("@/stores/userStore");
        useUserStore.getState().clearUser();
      } catch {
        // Store may not be available during SSR; safe to ignore
      }
    }

    throw new ApiError(res.status, body);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(path, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

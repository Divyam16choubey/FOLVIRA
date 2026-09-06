/**
 * api.ts — Typed fetch wrapper for all FOLVIRA API calls.
 *
 * - Always sends credentials (cookies) with every request.
 * - Parses JSON responses into a consistent { success, data, error } shape.
 * - Throws a plain Error with the server's error message on failure
 *   so callers can catch and display it directly.
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  error?: string
}

export class ApiError extends Error {
  public readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include', // Always send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const body = (await res.json()) as ApiResponse<T>

  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error ?? `Request failed with status ${res.status}`,
      res.status
    )
  }

  return body.data
}

// ─── Typed API methods ────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
}

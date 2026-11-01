import { userError } from './user-error';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  apiBase: string,
  path: string,
  options: { method?: string; token?: string | null; body?: unknown; action?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(userError(0, '', options.action || 'Could not finish that request'), 0);
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      userError(response.status, json?.error, options.action || 'Could not finish that request'),
      response.status,
    );
  }
  return json as T;
}

// src/lib/api/http.ts

export class ApiError extends Error {
  status: number;
  data?: any;
  timestamp: string;

  constructor(message: string, status = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export interface UniversalFetchOptions extends RequestInit {
  timeout?: number;             // ms
  cookie?: string;              // entire Cookie header value
  authToken?: string;           // Bearer token
  skipAuth?: boolean;           // skip Authorization header even if authToken provided
  unwrapApiResponse?: boolean;  // unwrap { success, data } shape (default: true)
  next?: RequestInit['next'];   // Next.js cache hints
  cache?: RequestInit['cache']; // request cache mode
}

const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:3001'
).replace(/\/api$/, '');

const DEFAULT_TIMEOUT = 10000; // 10s

function buildUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}/api/${API_VERSION}${path}`;
}

function buildHeaders(opts?: UniversalFetchOptions): Headers {
  const headers = new Headers(opts?.headers);

  // Content-Type: JSON by default unless body is FormData or already set
  const isFormData = typeof opts?.body !== 'undefined' && typeof FormData !== 'undefined' && opts?.body instanceof FormData;
  if (typeof opts?.body !== 'undefined' && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (opts?.cookie) {
    headers.set('Cookie', opts.cookie);
  }

  if (!opts?.skipAuth && opts?.authToken) {
    headers.set('Authorization', `Bearer ${opts.authToken}`);
  }

  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
  // No content
  if (res.status === 204) return null as T;

  const contentType = res.headers.get('content-type');
  let data: any;

  if (contentType?.includes('application/json')) {
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      throw new ApiError('Invalid JSON response from server', 500, { raw: text });
    }
  } else if (contentType?.includes('text/')) {
    data = await res.text();
  } else {
    // binary or other
    data = await res.arrayBuffer();
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Backend request failed with status ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  // Unwrap common { success, data } API shape by default
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    'data' in data
  ) {
    return data.data as T;
  }

  return data as T;
}

export async function httpFetch<T>(
  endpoint: string,
  opts: UniversalFetchOptions = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  const {
    timeout = DEFAULT_TIMEOUT,
    unwrapApiResponse = true,
    ...init
  } = opts;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...init,
      headers: buildHeaders(opts),
      signal: controller.signal,
      // Defaults suitable for SSR; caller can override
      credentials: 'include',
      cache: init.cache ?? 'no-store',
      next: init.next ?? { revalidate: 0 },
    });

    clearTimeout(timeoutId);
    return unwrapApiResponse ? parseResponse<T>(res) : (res.json() as Promise<T>);
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeout}ms`, 408);
    }

    // Connection errors
    const msg = String(err?.message || '');
    if (
      msg.includes('ECONNREFUSED') ||
      msg.includes('fetch failed') ||
      err?.cause?.code === 'ECONNREFUSED'
    ) {
      throw new ApiError('Could not connect to the backend service', 503);
    }

    if (err instanceof ApiError) throw err;

    throw new ApiError(err?.message || 'Unknown error occurred', 500);
  }
}

export const httpGet = <T>(endpoint: string, opts?: UniversalFetchOptions) =>
  httpFetch<T>(endpoint, { ...opts, method: 'GET' });

export const httpPost = <T>(endpoint: string, body?: any, opts?: UniversalFetchOptions) =>
  httpFetch<T>(endpoint, {
    ...opts,
    method: 'POST',
    body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

export const httpPut = <T>(endpoint: string, body?: any, opts?: UniversalFetchOptions) =>
  httpFetch<T>(endpoint, {
    ...opts,
    method: 'PUT',
    body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

export const httpPatch = <T>(endpoint: string, body?: any, opts?: UniversalFetchOptions) =>
  httpFetch<T>(endpoint, {
    ...opts,
    method: 'PATCH',
    body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

export const httpDelete = <T>(endpoint: string, opts?: UniversalFetchOptions) =>
  httpFetch<T>(endpoint, { ...opts, method: 'DELETE' });

export async function httpGetPaginated<T>(
  endpoint: string,
  page = 1,
  limit = 10,
  filters?: Record<string, any>,
  opts?: UniversalFetchOptions
): Promise<{
  data: T[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filters || {}),
  });

  return httpGet(endpoint + '?' + params.toString(), opts);
}
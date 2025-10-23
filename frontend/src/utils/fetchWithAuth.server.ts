// src/utils/fetchWithAuth.server.ts
/**
 * Server-side fetch helper (use this in Server Components / route handlers)
 */
export type FetchWithAuthOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string | number | boolean>;
};

export async function fetchWithAuth<T = any>(
  url: string,
  token: string | null = null,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  const contentType = res.headers.get('content-type') ?? '';
  if (!res.ok) {
    const text = await res.text();
    let body: unknown = text;
    try {
      if (contentType.includes('application/json')) body = JSON.parse(text);
    } catch {}
    const err: any = new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (contentType.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export default fetchWithAuth;

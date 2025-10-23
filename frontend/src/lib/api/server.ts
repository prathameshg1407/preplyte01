// src/lib/api/server.ts
import 'server-only';
import { cookies } from 'next/headers';
import {
  httpGet,
  httpPost,
  httpPut,
  httpPatch,
  httpDelete,
  httpGetPaginated,
  type UniversalFetchOptions,
} from './http';
export interface ServerFetchOptions {
  headers?: HeadersInit;
  timeout?: number;
  skipAuth?: boolean;
  next?: RequestInit['next'];
  cache?: RequestInit['cache'];
}
const AUTH_COOKIE = 'jwt-token';

export interface ServerFetchOptions {
  headers?: HeadersInit;
  timeout?: number;
  skipAuth?: boolean;
  next?: RequestInit['next'];
  cache?: RequestInit['cache'];
}

/**
 * Collects all cookies as a raw Cookie header string and the auth token (if present)
 */
function getCookieContext() {
  const store = cookies(); // App Router server-only
  const all = store.getAll();
  const cookieHeader = all.map((c) => `${c.name}=${c.value}`).join('; ');
  const token = store.get(AUTH_COOKIE)?.value;
  return { cookieHeader, token };
}

function toUniversalOptions(opts?: ServerFetchOptions): UniversalFetchOptions {
  const { cookieHeader, token } = getCookieContext();
  return {
    headers: opts?.headers,
    timeout: opts?.timeout,
    skipAuth: opts?.skipAuth,
    cookie: cookieHeader,
    authToken: token,
    cache: opts?.cache ?? 'no-store',
    next: opts?.next ?? { revalidate: 0 },
  };
}

export async function serverGet<T>(endpoint: string, opts?: ServerFetchOptions): Promise<T> {
  return httpGet<T>(endpoint, toUniversalOptions(opts));
}

export async function serverPost<T>(
  endpoint: string,
  body?: any,
  opts?: ServerFetchOptions
): Promise<T> {
  return httpPost<T>(endpoint, body, toUniversalOptions(opts));
}

export async function serverPut<T>(
  endpoint: string,
  body?: any,
  opts?: ServerFetchOptions
): Promise<T> {
  return httpPut<T>(endpoint, body, toUniversalOptions(opts));
}

export async function serverPatch<T>(
  endpoint: string,
  body?: any,
  opts?: ServerFetchOptions
): Promise<T> {
  return httpPatch<T>(endpoint, body, toUniversalOptions(opts));
}

export async function serverDelete<T>(endpoint: string, opts?: ServerFetchOptions): Promise<T> {
  return httpDelete<T>(endpoint, toUniversalOptions(opts));
}

export async function serverGetPaginated<T>(
  endpoint: string,
  page = 1,
  limit = 10,
  filters?: Record<string, any>,
  opts?: ServerFetchOptions
): Promise<{
  data: T[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}> {
  return httpGetPaginated<T>(endpoint, page, limit, filters, toUniversalOptions(opts));
}
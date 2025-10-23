'use client';

import Cookies from 'js-cookie';

/**
 * A CLIENT-SIDE wrapper for the fetch API.
 * Automatically adds the auth token from browser cookies.
 * Handles 401 Unauthorized errors by dispatching a global event.
 *
 * IMPORTANT: This function can ONLY be used in Client Components (files with 'use client').
 *
 * @param url The URL to fetch.
 * @param options Additional fetch options (method, body, etc.).
 * @returns The JSON response from the server.
 */
export async function fetchWithAuth<TData = any>(
  url: string,
  options: RequestInit = {},
): Promise<TData> {
  // Reading cookies from the browser
  const token = Cookies.get('jwt-token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(url, config);

  // Global 401 error handling for client-side session expiration
  if (res.status === 401) {
    // Dispatch a global event that an AuthProvider can listen for to trigger a logout
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event('unauthorized'));
    }
    // Stop execution and inform the calling component
    throw new Error('Unauthorized: Your session has expired. Please log in again.');
  }

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }

  // Handle successful responses, including empty ones (204 No Content).
  return res.status === 204 ? (null as TData) : (await res.json());
}
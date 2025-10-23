import { cookies } from 'next/headers';
import 'server-only'; // Ensures this module is never used on the client

/**
 * A custom error class to provide more context on API failures on the server.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * A SERVER-SIDE wrapper for the fetch API.
 * Automatically adds the auth token by reading the request's httpOnly cookies.
 *
 * IMPORTANT: This can ONLY be used in Server Components, Route Handlers, or Server Actions.
 *
 * @param url The URL to fetch.
 * @param options Standard RequestInit options.
 * @returns The JSON response from the API.
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  const cookieStore = await cookies();
  // IMPORTANT: Ensure 'jwt-token' matches the name of your authentication cookie.
  const token = cookieStore.get('jwt-token')?.value;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Ensures fresh data for dynamic server-rendered pages
    cache: 'no-store',
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();

        if (Array.isArray(errorBody.message)) {
          // Format array of messages into multiline string
          errorMessage = errorBody.message.join('\n');
        } else if (typeof errorBody.message === 'string') {
          errorMessage = errorBody.message;
        }
      } catch {
        // No valid JSON, keep default errorMessage
      }
      throw new ApiError(errorMessage, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('A critical server-side network or fetch error occurred:', error);
    throw new Error('A network error occurred on the server.');
  }
};

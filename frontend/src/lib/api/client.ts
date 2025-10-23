'use client';

import Cookies from 'js-cookie';
import type { 
  ApiResponse, 
  ApiMessage,
  PaginatedResponse, 
  ErrorResponse 
} from '@/types';

export class ApiError extends Error {
  status: number;
  data?: any;
  timestamp?: string;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

// Configuration
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/api$/, '');

const AUTH_COOKIE = 'jwt-token';
const REFRESH_TOKEN_COOKIE = 'refresh-token';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RETRYABLE_STATUS_CODES = [502, 503, 504];

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
  expectData?: boolean;
  retryCount?: number;
  skipRetry?: boolean;
}

/**
 * Type guard to check if response has data
 */
function hasData<T>(response: ApiResponse<T>): response is Required<ApiResponse<T>> {
  return response.data !== undefined && response.data !== null;
}

/**
 * Type guard to check if response is paginated
 */
function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return (
    response &&
    typeof response === 'object' &&
    'pagination' in response &&
    'data' in response &&
    Array.isArray(response.data)
  );
}

/**
 * Type guard to check if response is an API message (no data)
 */
function isApiMessage(response: any): response is ApiMessage {
  return (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'message' in response &&
    !('data' in response)
  );
}

/**
 * Decode JWT token (for debugging - doesn't verify signature)
 */
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[decodeJWT] Failed to decode token:', error);
    return null;
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Client-side API fetch utility with automatic token refresh and retry logic
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { 
    skipAuth = false, 
    timeout = 30000, 
    expectData = true,
    retryCount = 0,
    skipRetry = false,
    ...fetchOptions 
  } = options;

  console.log(`[apiFetch] ${fetchOptions.method || 'GET'} ${endpoint} (attempt ${retryCount + 1})`);

  // 1. Get access token
  const accessToken = Cookies.get(AUTH_COOKIE);

  // 2. Check authentication early
  if (!skipAuth && !accessToken) {
    console.error('[apiFetch] No access token found');
    handleUnauthorized();
    throw new ApiError('Authentication required. Please log in.', 401);
  }

  // 3. Build headers
  const headers = new Headers(fetchOptions.headers);
  
  // Set Content-Type for non-FormData requests
  if (!(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Set Authorization header
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // 4. Build full URL with version prefix
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE_URL}/api/${API_VERSION}${cleanEndpoint}`;

  console.log(`[apiFetch] Full URL: ${fullUrl}`);

  // 5. Log auth debug (after headers is created)
  console.log('🔑 [apiFetch] Auth Debug:', {
    hasAccessToken: !!accessToken,
    tokenPreview: accessToken ? accessToken.substring(0, 40) + '...' : 'NO TOKEN',
    authHeader: headers.get('Authorization')?.substring(0, 50) + '...',
    endpoint,
    method: fetchOptions.method || 'GET'
  });

  // 6. Decode and log token payload
  if (accessToken && !skipAuth) {
    const decoded = decodeJWT(accessToken);
    console.log('🎫 [apiFetch] Token Payload:', decoded);
    if (decoded) {
      console.log('🎫 [apiFetch] Token Details:', {
        userId: decoded.sub || decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
        isExpired: decoded.exp ? Date.now() > decoded.exp * 1000 : 'Unknown'
      });
    }
  }

  // 7. Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      credentials: 'include',
    });

    clearTimeout(timeoutId);

    console.log(`[apiFetch] Response: ${response.status} ${response.statusText}`);

    // Handle retryable server errors
    if (!skipRetry && RETRYABLE_STATUS_CODES.includes(response.status) && retryCount < MAX_RETRIES) {
      console.warn(`[apiFetch] Server error ${response.status}, retrying...`);
      await sleep(RETRY_DELAY * (retryCount + 1));
      return apiFetch<T>(endpoint, { ...options, retryCount: retryCount + 1 });
    }

    // Handle no content
    if (response.status === 204) {
      return null as T;
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      // For blob responses (files)
      data = await response.blob();
    }

    // Handle errors
    if (!response.ok) {
      // Handle unauthorized - try to refresh token
      if (response.status === 401 && !skipAuth) {
        console.warn('[apiFetch] Unauthorized, attempting token refresh');
        const refreshed = await attemptTokenRefresh();
        
        if (refreshed) {
          // Retry the original request with new token
          console.log('[apiFetch] Token refreshed, retrying request');
          return apiFetch<T>(endpoint, { ...options, retryCount: 0 });
        } else {
          handleUnauthorized();
          throw new ApiError('Session expired. Please log in again.', 401, data);
        }
      }

      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      
      console.error('[apiFetch] Error:', {
        status: response.status,
        message: errorMessage,
        data,
      });

      throw new ApiError(errorMessage, response.status, data);
    }

    // Handle different response types
    
    // 1. Check if it's a blob (file download)
    if (data instanceof Blob) {
      return data as T;
    }

    // 2. Check if it's plain text
    if (typeof data === 'string') {
      return data as T;
    }

    // 3. Check if it's an API message (no data field)
    if (isApiMessage(data)) {
      return data as T;
    }

    // 4. Check if it's a paginated response
    if (isPaginatedResponse(data)) {
      return data as T;
    }

    // 5. Check if it's a standard API response with data
    if (data && typeof data === 'object' && 'success' in data) {
      const apiResponse = data as ApiResponse<any>;
      
      // If we expect data and it's present, return it
      if (hasData(apiResponse)) {
        return apiResponse.data as T;
      }
      
      // If we don't expect data (like password reset), return empty object
      if (!expectData) {
        return {} as T;
      }
      
      // If we expect data but it's not present, throw error
      console.warn('[apiFetch] API response missing data field:', data);
      throw new ApiError('Invalid API response: missing data', response.status, data);
    }

    // 6. If none of the above, return as-is
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error(`[apiFetch] Request timeout after ${timeout}ms`);
      
      // Retry on timeout if not already exceeded retry limit
      if (!skipRetry && retryCount < MAX_RETRIES) {
        console.log('[apiFetch] Retrying after timeout...');
        await sleep(RETRY_DELAY * (retryCount + 1));
        return apiFetch<T>(endpoint, { ...options, retryCount: retryCount + 1 });
      }
      
      throw new ApiError('Request timed out. Please try again.', 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    console.error(`[apiFetch] Network error:`, error);
    throw new ApiError(
      error.message || 'Network error occurred',
      error.status || 500,
      error,
    );
  }
}

/**
 * Attempt to refresh the access token using refresh token
 */
async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE);
  
  if (!refreshToken) {
    console.error('[Token Refresh] No refresh token available');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('[Token Refresh] Failed:', response.status);
      return false;
    }

    const data: ApiResponse<{ accessToken: string; expiresIn: number }> = await response.json();
    
    if (data.success && hasData(data) && data.data.accessToken) {
      // Store new access token
      const expiresInDays = data.data.expiresIn / 86400; // Convert seconds to days
      Cookies.set(AUTH_COOKIE, data.data.accessToken, { 
        expires: expiresInDays,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      
      console.log('[Token Refresh] Success');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Token Refresh] Error:', error);
    return false;
  }
}

/**
 * Handle unauthorized access
 */
function handleUnauthorized() {
  // Clear auth cookies
  Cookies.remove(AUTH_COOKIE);
  Cookies.remove(REFRESH_TOKEN_COOKIE);
  
  // Dispatch event for app-wide handling
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('unauthorized'));
  }
}

/**
 * Download file from API
 */
export async function downloadFile(
  endpoint: string,
  filename?: string,
  options: FetchOptions = {},
): Promise<void> {
  try {
    const blob = await apiFetch<Blob>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/octet-stream',
      },
      expectData: false,
      skipRetry: true, // Don't retry file downloads
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('[downloadFile] Error:', error);
    throw error;
  }
}

/**
 * Upload file to API with progress tracking
 */
export async function uploadFile<T>(
  endpoint: string,
  file: File,
  fieldName: string = 'file',  // Add fieldName parameter with default value
  additionalData?: Record<string, any>,
  onProgress?: (progress: number) => void,
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);  // Use the fieldName parameter

  // Add additional fields
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
  }

  // XMLHttpRequest for progress tracking
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const accessToken = Cookies.get(AUTH_COOKIE);
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${API_BASE_URL}/api/${API_VERSION}${cleanEndpoint}`;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Handle ApiResponse wrapper
            if (response && typeof response === 'object' && 'data' in response) {
              resolve(response.data || response);
            } else {
              resolve(response);
            }
          } catch (error) {
            reject(new ApiError('Invalid JSON response', xhr.status));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new ApiError(error.message || 'Upload failed', xhr.status, error));
          } catch {
            reject(new ApiError('Upload failed', xhr.status));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError('Network error', 0));
      });

      xhr.open('POST', fullUrl);
      
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  // Standard fetch for uploads without progress
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: formData,
    skipRetry: true, // Don't retry file uploads
  });
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  console.log('[apiGet] Called with:', { endpoint, options });
  return apiFetch<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * POST request for endpoints that return ApiMessage (no data)
 */
export async function apiPostMessage(
  endpoint: string,
  data?: any,
  options?: FetchOptions,
): Promise<ApiMessage> {
  return apiFetch<ApiMessage>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    expectData: false,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Fetch paginated data
 */
export async function apiGetPaginated<T>(
  endpoint: string,
  params?: {
    page?: number;
    limit?: number;
    [key: string]: any;
  },
  options?: FetchOptions,
): Promise<PaginatedResponse<T>> {
  // Build query string
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

  return apiFetch<PaginatedResponse<T>>(fullEndpoint, {
    ...options,
    method: 'GET',
    expectData: true,
  });
}

// Helper functions
export function extractData<T>(response: ApiResponse<T>): T {
  if (hasData(response)) {
    return response.data;
  }
  throw new Error('No data in API response');
}

export function extractDataOrDefault<T>(response: ApiResponse<T>, defaultValue: T): T {
  if (hasData(response)) {
    return response.data;
  }
  return defaultValue;
}

export function extractDataOrNull<T>(response: ApiResponse<T>): T | null {
  if (hasData(response)) {
    return response.data;
  }
  return null;
}

export function isSuccessResponse<T>(response: ApiResponse<T> | ApiMessage): boolean {
  return response.success === true;
}

export function getResponseMessage<T>(response: ApiResponse<T> | ApiMessage): string {
  return response.message || 'Operation completed';
}

export function logout() {
  Cookies.remove(AUTH_COOKIE);
  Cookies.remove(REFRESH_TOKEN_COOKIE);
  
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function isAuthenticated(): boolean {
  return !!Cookies.get(AUTH_COOKIE);
}

export function getAccessToken(): string | undefined {
  return Cookies.get(AUTH_COOKIE);
}

export function setAccessToken(token: string, expiresInSeconds: number) {
  const expiresInDays = expiresInSeconds / 86400;
  Cookies.set(AUTH_COOKIE, token, {
    expires: expiresInDays,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

export function setRefreshToken(token: string, expiresInSeconds?: number) {
  const expiresInDays = expiresInSeconds ? expiresInSeconds / 86400 : 7;
  Cookies.set(REFRESH_TOKEN_COOKIE, token, {
    expires: expiresInDays,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

// Export type guards for use in other files
// Export type guards for use in other files
export { hasData, isPaginatedResponse, isApiMessage, type FetchOptions };
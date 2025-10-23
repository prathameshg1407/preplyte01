'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

// API utilities and types
import { apiGet, apiPost, ApiError } from '@/lib/api/client';
import { 
  type AppUser, 
  type AuthResponse, 
  type LoginDto, 
  type RegisterDto,
  Role,
} from '@/types';

// --- TYPE DEFINITIONS ---

// Use AppUser as the full user profile type
type FullUserProfile = AppUser;

// Credentials for standard email/password login
type LoginCredentials = LoginDto;

// Credentials for user registration
type RegisterCredentials = RegisterDto;

// The shape of the context value provided to consumers
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: FullUserProfile | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<FullUserProfile>;
  loginWithToken: (authData: AuthResponse) => Promise<FullUserProfile>;
  register: (credentials: RegisterCredentials) => Promise<FullUserProfile>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
  updateUser: (updates: Partial<FullUserProfile>) => void;
}

// --- CONSTANTS ---

const AUTH_TOKEN_COOKIE = 'jwt-token';
const REFRESH_TOKEN_COOKIE = 'refresh-token';
const TOKEN_EXPIRY_DAYS = 7;
const TOKEN_VALIDATION_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Cookie options
const getCookieOptions = (expiryDays: number = TOKEN_EXPIRY_DAYS) => ({
  expires: expiryDays,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
});

// --- CONTEXT CREATION ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- AUTH PROVIDER COMPONENT ---

/**
 * Manages and provides authentication state and methods to the entire application
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMounted = useRef(true);
  
  const [user, setUser] = useState<FullUserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  /**
   * Clear all authentication state and cookies
   */
  const clearAuthState = useCallback(() => {
    console.log('[AuthContext] Clearing auth state');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    Cookies.remove(AUTH_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
  }, []);

  /**
   * Set authentication state from auth response
   */
  const setAuthState = useCallback((authData: AuthResponse): FullUserProfile => {
    console.log('[AuthContext] Setting auth state:', authData);
    const { user: userData, accessToken, refreshToken, expiresIn } = authData;

    // Calculate expiry based on token lifetime
    const expiryDays = expiresIn ? expiresIn / 86400 : TOKEN_EXPIRY_DAYS;

    // Set access token
    Cookies.set(AUTH_TOKEN_COOKIE, accessToken, getCookieOptions(expiryDays));

    // Set refresh token if provided
    if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, getCookieOptions(TOKEN_EXPIRY_DAYS));
    }

    setToken(accessToken);
    setUser(userData as FullUserProfile);
    setIsAuthenticated(true);

    console.log('[AuthContext] Auth state set successfully');
    return userData as FullUserProfile;
  }, []);

  /**
   * Fetch and set current user data
   */
  const fetchCurrentUser = useCallback(async (): Promise<void> => {
    const cookieToken = Cookies.get(AUTH_TOKEN_COOKIE);
    console.log('[AuthContext] Fetching current user, token exists:', !!cookieToken);

    if (!cookieToken) {
      console.log('[AuthContext] No token found');
      setIsLoading(false);
      setHasInitialized(true);
      return;
    }

    setIsLoading(true);
    setToken(cookieToken);

    try {
      console.log('[AuthContext] Calling /auth/me endpoint...');
      const response = await apiGet<FullUserProfile>('/auth/me');
      
      console.log('[AuthContext] /auth/me response:', response);
      console.log('[AuthContext] isMounted:', isMounted.current);
      
      // Check if component is still mounted
      if (!isMounted.current) {
        console.log('[AuthContext] Component unmounted, ignoring response');
        return;
      }
      
      // The response IS the user data directly
      if (response && typeof response === 'object' && 'id' in response && 'email' in response) {
        console.log('[AuthContext] Valid user data received, setting user...');
        setUser(response as FullUserProfile);
        setIsAuthenticated(true);
        console.log('[AuthContext] User set successfully');
      } else {
        console.warn('[AuthContext] Invalid response structure:', response);
        clearAuthState();
      }
    } catch (error) {
      console.error('[AuthContext] Failed to fetch user:', error);
      
      if (error instanceof ApiError) {
        // Handle specific error cases
        if (error.status === 401 || error.status === 403) {
          console.warn('[AuthContext] Session expired or invalid');
          clearAuthState();
        }
      } else {
        // For network errors, keep the token but mark as unauthenticated
        setIsAuthenticated(false);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setHasInitialized(true);
        console.log('[AuthContext] Loading complete');
      }
    }
  }, [clearAuthState]);

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<FullUserProfile> => {
      try {
        setIsLoading(true);
        console.log('[AuthContext] Logging in...');

        // Call login endpoint
        const response = await apiPost<AuthResponse>(
          '/auth/login',
          credentials,
          { skipAuth: true }
        );

        console.log('[AuthContext] Login response:', response);
        const userData = setAuthState(response);

        // Redirect based on role
        if (userData.role === Role.STUDENT) {
          router.push('/dashboard');
        } else {
          router.push('/admin/dashboard');
        }

        return userData;
      } catch (error) {
        console.error('[AuthContext] Login failed:', error);
        clearAuthState();
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthState, clearAuthState, router]
  );

  /**
   * Login with pre-existing token (for OAuth/social login)
   */
  const loginWithToken = useCallback(
    async (authData: AuthResponse): Promise<FullUserProfile> => {
      try {
        setIsLoading(true);
        console.log('[AuthContext] Login with token...');
        const userData = setAuthState(authData);
        
        // Redirect based on role
        if (userData.role === Role.STUDENT) {
          router.push('/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
        
        return userData;
      } catch (error) {
        console.error('[AuthContext] Token login failed:', error);
        clearAuthState();
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthState, clearAuthState, router]
  );

  /**
   * Register a new user
   */
  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<FullUserProfile> => {
      try {
        setIsLoading(true);
        console.log('[AuthContext] Registering user...');

        // Call register endpoint
        const response = await apiPost<AuthResponse | { user: AppUser }>(
          '/auth/register',
          credentials,
          { skipAuth: true }
        );

        console.log('[AuthContext] Register response:', response);

        // Check if response includes auth tokens (OAuth or auto-login flow)
        if ('accessToken' in response) {
          return setAuthState(response as AuthResponse);
        }

        // For traditional registration, attempt login
        if (!credentials.password) {
          throw new Error('Password required for email registration');
        }

        // Auto-login after registration
        return await login({
          email: credentials.email,
          password: credentials.password,
        });
      } catch (error) {
        console.error('[AuthContext] Registration failed:', error);
        clearAuthState();
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [login, setAuthState, clearAuthState]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    console.log('[AuthContext] Logging out...');
    try {
      // Call logout endpoint (optional - server can invalidate token)
      await apiPost('/auth/logout').catch((error) => {
        console.warn('[AuthContext] Logout endpoint failed:', error);
      });
    } finally {
      clearAuthState();
      router.push('/auth/login');
    }
  }, [clearAuthState, router]);

  /**
   * Update user data in state (optimistic update)
   */
  const updateUser = useCallback((updates: Partial<FullUserProfile>) => {
    console.log('[AuthContext] Updating user:', updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // --- EFFECTS ---

  /**
   * Track component mount status
   */
  useEffect(() => {
    isMounted.current = true;
    console.log('[AuthContext] Component mounted');
    
    return () => {
      isMounted.current = false;
      console.log('[AuthContext] Component unmounted');
    };
  }, []);

  /**
   * Initialize auth state on mount - only once
   */
  useEffect(() => {
    if (!hasInitialized) {
      console.log('[AuthContext] Initializing auth...');
      fetchCurrentUser();
    }
  }, [hasInitialized, fetchCurrentUser]);

  /**
   * Listen for unauthorized events
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('[AuthContext] Unauthorized event received');
      clearAuthState();
      router.push('/auth/login');
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [clearAuthState, router]);

  /**
   * Listen for storage events (logout from other tabs)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_COOKIE && !e.newValue) {
        console.log('[AuthContext] Token removed in another tab');
        clearAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [clearAuthState]);

  /**
   * Periodic token validation (every 30 minutes)
   */
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const validateToken = async () => {
      try {
        console.log('[AuthContext] Validating token...');
        await apiPost('/auth/verify', {}, { skipAuth: false });
        console.log('[AuthContext] Token validated successfully');
      } catch (error) {
        console.error('[AuthContext] Token validation failed:', error);
        if (error instanceof ApiError && error.status === 401) {
          clearAuthState();
          router.push('/auth/login');
        }
      }
    };

    // Validate immediately
    validateToken();

    // Then every 30 minutes
    const interval = setInterval(validateToken, TOKEN_VALIDATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, clearAuthState, router]);

  // Debug log current state
  useEffect(() => {
    console.log('[AuthContext] Current state:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      hasInitialized,
    });
  }, [isAuthenticated, isLoading, user, hasInitialized]);

  // --- CONTEXT VALUE ---

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      token,
      login,
      loginWithToken,
      register,
      logout,
      refetchUser: fetchCurrentUser,
      updateUser,
    }),
    [
      isAuthenticated,
      isLoading,
      user,
      token,
      login,
      loginWithToken,
      register,
      logout,
      fetchCurrentUser,
      updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- CUSTOM HOOK ---

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// --- UTILITY HOOKS ---

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(requiredRole: string | string[]) {
  const { user } = useAuth();

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  return user ? roles.includes(user.role) : false;
}

/**
 * Hook to require specific role
 * Redirects to unauthorized page if user doesn't have role
 */
export function useRequireRole(requiredRole: string | string[]) {
  const { user, isLoading } = useAuth();
  const hasRole = useHasRole(requiredRole);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !hasRole) {
      router.push('/unauthorized');
    }
  }, [user, isLoading, hasRole, router]);

  return { hasRole, isLoading };
}

/**
 * Hook to get user's institution
 */
export function useInstitution() {
  const { user } = useAuth();
  return user?.institution || null;
}

/**
 * Hook to check authentication status
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
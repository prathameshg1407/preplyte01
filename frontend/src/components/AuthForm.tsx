'use client';

import React, {
  useState,
  useEffect,
  FC,
  ReactNode,
  useCallback,
  memo,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  LogIn,
  Chrome,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { ApiError } from '@/lib/api/client';
import type { AuthResponse, LoginDto, RegisterDto } from '@/types';

// --- TYPE DEFINITIONS ---
type AuthState = 'initial' | 'login' | 'register';
type MessageType = 'error' | 'success' | 'info';

interface Message {
  type: MessageType;
  text: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
}

// --- CONSTANTS ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:3001';

// --- REUSABLE UI COMPONENTS ---

const Alert: FC<{ message: Message }> = memo(({ message }) => {
  const icons = {
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  const colors = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border ${colors[message.type]} animate-slide-down`}
      role="alert"
      aria-live="polite"
    >
      {icons[message.type]}
      <p className="text-sm font-medium">{message.text}</p>
    </div>
  );
});
Alert.displayName = 'Alert';

const AuthScreenLayout: FC<{
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
  onGoogleLogin: () => void;
  googleButtonText: string;
  isLoading?: boolean;
}> = memo(({ title, subtitle, children, footer, onGoogleLogin, googleButtonText, isLoading }) => (
  <>
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      )}
    </div>

    <button
      onClick={onGoogleLogin}
      type="button"
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Chrome size={20} />
      <span>{googleButtonText}</span>
    </button>

    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
      </div>
    </div>

    {children}

    <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>
  </>
));
AuthScreenLayout.displayName = 'AuthScreenLayout';

const IconInput: FC<
  React.InputHTMLAttributes<HTMLInputElement> & { 
    icon: ReactNode;
    error?: string;
  }
> = memo(({ icon, error, className = '', ...props }) => (
  <div className="w-full">
    <div className="relative">
      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
        {icon}
      </span>
      <input
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.name}-error` : undefined}
        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
        } ${className}`}
      />
    </div>
    {error && (
      <p id={`${props.name}-error`} className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle size={14} />
        {error}
      </p>
    )}
  </div>
));
IconInput.displayName = 'IconInput';

const PasswordInput: FC<
  React.InputHTMLAttributes<HTMLInputElement> & { 
    error?: string;
  }
> = memo(({ error, className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <div className="relative">
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <Lock size={20} />
        </span>
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.name}-error` : undefined}
          className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={0}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && (
        <p id={`${props.name}-error`} className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

const FormButton: FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    icon?: ReactNode;
    variant?: 'primary' | 'secondary';
  }
> = ({ loading, children, icon, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 disabled:bg-gray-400',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100',
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

// --- FORM VALIDATION ---
const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return undefined;
};

const validatePassword = (password: string, isLogin: boolean = false): string | undefined => {
  if (!password) return 'Password is required';
  
  // Skip strict validation for login
  if (isLogin) return undefined;
  
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain a number';
  return undefined;
};

const validateFullName = (name: string): string | undefined => {
  if (!name) return 'Full name is required';
  if (name.trim().length < 2) return 'Full name must be at least 2 characters';
  return undefined;
};

// --- AUTHENTICATION STEP COMPONENTS ---

const InitialStep: FC<{
  email: string;
  setEmail: (email: string) => void;
  setAuthState: (state: AuthState) => void;
  onGoogleLogin: () => void;
  isLoading: boolean;
}> = memo(({ email, setEmail, setAuthState, onGoogleLogin, isLoading }) => {
  const [emailError, setEmailError] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError(undefined);
    setAuthState('register');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError(undefined);
    }
  };

  return (
    <AuthScreenLayout
      title="Welcome to Preplyte"
      subtitle="Get started with your placement preparation journey"
      onGoogleLogin={onGoogleLogin}
      googleButtonText="Continue with Google"
      isLoading={isLoading}
      footer={
        <>
          Already have an account?{' '}
          <button
            onClick={() => setAuthState('login')}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
            type="button"
          >
            Sign In
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <IconInput
          type="email"
          name="email"
          placeholder="name@example.com"
          value={email}
          onChange={handleEmailChange}
          required
          icon={<Mail size={20} />}
          error={emailError}
          autoComplete="email"
          autoFocus
        />
        <FormButton type="submit" disabled={isLoading}>
          Continue with Email
        </FormButton>
      </form>
    </AuthScreenLayout>
  );
});
InitialStep.displayName = 'InitialStep';

const LoginStep: FC<{
  email: string;
  setEmail: (email: string) => void;
  handleLoginSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  setAuthState: (state: AuthState) => void;
  loading: boolean;
  message: Message | null;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
}> = memo(({
  email,
  setEmail,
  handleLoginSubmit,
  onGoogleLogin,
  setAuthState,
  loading,
  message,
  errors,
  setErrors,
}) => {
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handlePasswordChange = () => {
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  return (
    <AuthScreenLayout
      title="Welcome Back"
      subtitle="Sign in to continue your preparation"
      onGoogleLogin={onGoogleLogin}
      googleButtonText="Sign in with Google"
      isLoading={loading}
      footer={
        <>
          Don't have an account?{' '}
          <button
            onClick={() => setAuthState('register')}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
            type="button"
          >
            Sign Up
          </button>
        </>
      }
    >
      <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
        {message && <Alert message={message} />}
        
        <IconInput
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          required
          icon={<Mail size={20} />}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <PasswordInput
          placeholder="Password"
          name="password"
          required
          error={errors.password}
          autoComplete="current-password"
          onChange={handlePasswordChange}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              name="rememberMe"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
            />
            <span className="text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => {
              // TODO: Implement forgot password flow
              console.log('Forgot password clicked');
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            Forgot password?
          </button>
        </div>

        <FormButton type="submit" loading={loading} icon={<LogIn size={20} />}>
          Sign In
        </FormButton>
      </form>
    </AuthScreenLayout>
  );
});
LoginStep.displayName = 'LoginStep';

const RegisterStep: FC<{
  email: string;
  handleRegisterSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  setAuthState: (state: AuthState) => void;
  loading: boolean;
  message: Message | null;
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
}> = memo(({
  email,
  handleRegisterSubmit,
  onGoogleLogin,
  setAuthState,
  loading,
  message,
  errors,
  setErrors,
}) => {
  const handleNameChange = () => {
    if (errors.fullName) {
      setErrors({ ...errors, fullName: undefined });
    }
  };

  const handlePasswordChange = () => {
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  return (
    <AuthScreenLayout
      title="Create Your Account"
      subtitle="Join thousands of students preparing for placements"
      onGoogleLogin={onGoogleLogin}
      googleButtonText="Sign up with Google"
      isLoading={loading}
      footer={
        <>
          Already have an account?{' '}
          <button
            onClick={() => setAuthState('login')}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
            type="button"
          >
            Sign In
          </button>
        </>
      }
    >
      <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
        {message && <Alert message={message} />}
        
        <IconInput
          type="text"
          placeholder="Full Name"
          name="fullName"
          required
          icon={<User size={20} />}
          error={errors.fullName}
          autoComplete="name"
          autoFocus
          onChange={handleNameChange}
        />

        <IconInput
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          readOnly
          disabled
          icon={<Mail size={20} />}
          autoComplete="email"
        />

        <PasswordInput
          placeholder="Password"
          name="password"
          required
          minLength={8}
          error={errors.password}
          autoComplete="new-password"
          onChange={handlePasswordChange}
        />

        <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium">Password must contain:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
          </ul>
        </div>

        <FormButton type="submit" loading={loading}>
          Create Account
        </FormButton>

        <p className="text-xs text-gray-500 text-center">
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        </p>
      </form>
    </AuthScreenLayout>
  );
});
RegisterStep.displayName = 'RegisterStep';

// --- MAIN AUTHFORM COMPONENT ---

export default function AuthForm() {
  const [authState, setAuthState] = useState<AuthState>('initial');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const modalRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { login, register, loginWithToken } = useAuth();
  const { closeAuthModal, showToast } = useUI();

  const clearMessage = useCallback(() => setMessage(null), []);

  const handleGoogleLogin = useCallback(() => {
    const width = 600;
    const height = 700;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const url = `${API_BASE_URL}/api/auth/google`;
    
    setLoading(true);
    
    window.open(
      url,
      'GoogleSignIn',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`,
    );
  }, []);

  // Listen for OAuth messages
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      // Validate origin for security
      const allowedOrigins = [
        window.location.origin,
        new URL(API_BASE_URL).origin,
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('[AuthForm] Received message from unauthorized origin:', event.origin);
        return;
      }

      const { type, payload } = event.data || {};

      if (type === 'auth_success' && payload) {
        try {
          setLoading(true);
          await loginWithToken(payload as AuthResponse);
          closeAuthModal();
          showToast({
            type: 'success',
            message: 'Successfully signed in with Google!',
          });
        } catch (error) {
          console.error('[AuthForm] OAuth login error:', error);
          setMessage({
            type: 'error',
            text: 'Failed to complete Google sign in. Please try again.',
          });
        } finally {
          setLoading(false);
        }
      } else if (type === 'auth_error') {
        setLoading(false);
        setMessage({
          type: 'error',
          text: payload?.message || 'Google authentication failed. Please try again.',
        });
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [loginWithToken, closeAuthModal, showToast]);

  // Keyboard event handler - ESC to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        closeAuthModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAuthModal, loading]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey as any);
    return () => modal.removeEventListener('keydown', handleTabKey as any);
  }, [authState]);

  const handleLoginSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearMessage();
      setErrors({});

      const formData = new FormData(e.currentTarget);
      const password = formData.get('password') as string;

      // Validate
      const newErrors: FormErrors = {};
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password, true);

      if (emailError) newErrors.email = emailError;
      if (passwordError) newErrors.password = passwordError;

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);

      try {
        await login({ email, password });
        closeAuthModal();
        showToast({
          type: 'success',
          message: 'Welcome back!',
        });
      } catch (error) {
        console.error('[AuthForm] Login error:', error);
        
        if (error instanceof ApiError) {
          setMessage({
            type: 'error',
            text: error.message,
          });
        } else {
          setMessage({
            type: 'error',
            text: 'An unexpected error occurred. Please try again.',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [email, login, closeAuthModal, clearMessage, showToast]
  );

  const handleRegisterSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearMessage();
      setErrors({});

      const formData = new FormData(e.currentTarget);
      const fullName = (formData.get('fullName') as string)?.trim();
      const password = formData.get('password') as string;

      // Validate
      const newErrors: FormErrors = {};
      const nameError = validateFullName(fullName);
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password, false);

      if (nameError) newErrors.fullName = nameError;
      if (emailError) newErrors.email = emailError;
      if (passwordError) newErrors.password = passwordError;

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);

      try {
        await register({ fullName, email, password });
        closeAuthModal();
        showToast({
          type: 'success',
          message: 'Account created successfully! Welcome to Preplyte.',
        });
      } catch (error) {
        console.error('[AuthForm] Registration error:', error);
        
        if (error instanceof ApiError) {
          if (error.status === 409 || error.message.toLowerCase().includes('already exists')) {
            setMessage({
              type: 'error',
              text: 'An account with this email already exists. Please sign in instead.',
            });
            setTimeout(() => {
              setAuthState('login');
              setMessage(null);
            }, 2000);
          } else {
            setMessage({
              type: 'error',
              text: error.message,
            });
          }
        } else {
          setMessage({
            type: 'error',
            text: 'Failed to create account. Please try again.',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [email, register, closeAuthModal, clearMessage, showToast]
  );

  const handleBack = useCallback(() => {
    setAuthState('initial');
    clearMessage();
    setErrors({});
  }, [clearMessage]);

  const handleClose = useCallback(() => {
    if (!loading) {
      closeAuthModal();
    }
  }, [closeAuthModal, loading]);

  const renderContent = () => {
    switch (authState) {
      case 'login':
        return (
          <LoginStep
            email={email}
            setEmail={setEmail}
            handleLoginSubmit={handleLoginSubmit}
            onGoogleLogin={handleGoogleLogin}
            setAuthState={setAuthState}
            loading={loading}
            message={message}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case 'register':
        return (
          <RegisterStep
            email={email}
            handleRegisterSubmit={handleRegisterSubmit}
            onGoogleLogin={handleGoogleLogin}
            setAuthState={setAuthState}
            loading={loading}
            message={message}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case 'initial':
      default:
        return (
          <InitialStep
            email={email}
            setEmail={setEmail}
            setAuthState={setAuthState}
            onGoogleLogin={handleGoogleLogin}
            isLoading={loading}
          />
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        ref={modalRef}
        className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back Button */}
        {authState !== 'initial' && (
          <button
            onClick={handleBack}
            disabled={loading}
            className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="mt-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
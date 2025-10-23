'use client';

import Link from 'next/link';
import {
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Menu,
  X,
  LogIn,
  ShieldCheck,
  Send,
  Bell,
  BookOpen,
  Calendar,
  FileText,
  Award,
  ChevronDown,
  Loader2,
  Briefcase,
  Building2,
  Users,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback, memo, RefObject } from 'react';

// UPDATE THIS LINE - Use AppUser instead of FullUserProfile
import type { AppUser } from '@/types';
import { Role } from '@/types/enum';

import { useUI } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';

// --- TYPES ---

type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<LucideProps>;
  badge?: number;
};

type MenuItemLink = {
  type: 'link';
  href: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
};

type MenuItemButton = {
  type: 'button';
  label: string;
  icon: React.ComponentType<LucideProps>;
  onClick: () => void;
  variant?: 'default' | 'danger';
};

type MenuItem = MenuItemLink | MenuItemButton;

// --- CUSTOM HOOKS ---

const useClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
};

const useKeyPress = (targetKey: string, handler: () => void, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [targetKey, handler, enabled]);
};

const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (locked) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [locked]);
};

// --- CONSTANTS ---

const NAVIGATION_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/practice', label: 'Practice', icon: Award },
  { href: '/mock-drives', label: 'Mock Drive', icon: Briefcase },
  { href: '/find-colleges', label: 'Colleges', icon: Building2 },
  { href: '/guidance', label: 'Guidance', icon: Users },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/resume-builder', label: 'Resume', icon: FileText },
];

// --- HELPER FUNCTIONS ---

// UPDATE: Use AppUser instead of FullUserProfile
const getAvatarUrl = (user: AppUser | null): string => {
  if (user?.profile?.profileImageUrl) {
    return user.profile.profileImageUrl;
  }
  const name = user?.profile?.fullName || user?.email || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=ffffff&bold=true&size=128`;
};

const getDashboardPath = (role?: Role): string => {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.INSTITUTION_ADMIN:
      return '/admin/dashboard';
    case Role.STUDENT:
    default:
      return '/dashboard';
  }
};

// UPDATE: Use AppUser instead of FullUserProfile
const getInitials = (user: AppUser | null): string => {
  if (user?.profile?.fullName) {
    const parts = user.profile.fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return (user?.email?.[0] || 'U').toUpperCase();
};

// --- CHILD COMPONENTS ---

const NavLink = memo<{
  href: string;
  label: string;
  icon?: React.ComponentType<LucideProps>;
  onClick?: () => void;
  className?: string;
  badge?: number;
}>(({ href, label, icon: Icon, onClick, className = '', badge }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 text-sm font-medium transition-colors relative ${
        isActive 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      } ${className}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && <Icon size={18} />}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-destructive rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
});
NavLink.displayName = 'NavLink';

const NavLinks = memo<{
  className?: string;
  onClick?: () => void;
  showIcons?: boolean;
}>(({ className = '', onClick, showIcons = false }) => (
  <>
    {NAVIGATION_ITEMS.map((item) => (
      <NavLink
        key={item.href}
        href={item.href}
        label={item.label}
        icon={showIcons ? item.icon : undefined}
        badge={item.badge}
        onClick={onClick}
        className={className}
      />
    ))}
  </>
));
NavLinks.displayName = 'NavLinks';

// UPDATE: Use AppUser instead of FullUserProfile
const UserAvatar = memo<{
  user: AppUser | null;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}>(({ user, size = 'md', showStatus = false }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const avatarUrl = getAvatarUrl(user);
  const initials = getInitials(user);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden ring-2 ring-primary/20 relative flex-shrink-0`}>
      {!imageError && user?.profile?.profileImageUrl ? (
        <>
          {imageLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={avatarUrl}
            alt={user?.profile?.fullName || 'User avatar'}
            className={`w-full h-full object-cover transition-opacity ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">
          {initials}
        </div>
      )}
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
      )}
    </div>
  );
});
UserAvatar.displayName = 'UserAvatar';

// UPDATE: Use AppUser instead of FullUserProfile
const UserDropdown = memo<{
  user: AppUser;
  onLogout: () => void;
}>(({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dashboardPath = getDashboardPath(user.role);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const toggleDropdown = useCallback(() => setIsOpen((prev) => !prev), []);
  
  useClickOutside(dropdownRef, closeDropdown, isOpen);
  useKeyPress('Escape', closeDropdown, isOpen);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      const firstLink = dropdownRef.current?.querySelector('a, button');
      if (firstLink instanceof HTMLElement) {
        firstLink.focus();
      }
    }
  }, [isOpen]);

  const menuItems: MenuItem[] = [
    {
      type: 'link',
      href: dashboardPath,
      label: 'Dashboard',
      icon: user.role === Role.STUDENT ? LayoutDashboard : ShieldCheck,
    },
    {
      type: 'link',
      href: '/profile',
      label: 'Profile',
      icon: User,
    },
    {
      type: 'link',
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleLogout = useCallback(() => {
    closeDropdown();
    onLogout();
  }, [closeDropdown, onLogout]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all hover:ring-2 hover:ring-primary/30"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User menu"
        type="button"
      >
        <UserAvatar user={user} showStatus />
        <ChevronDown
          size={16}
          className={`hidden lg:block text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden bg-black/20 backdrop-blur-sm"
            onClick={closeDropdown}
            aria-hidden="true"
          />
          
          <div 
            className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-scale-in"
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <p className="text-sm font-semibold text-foreground truncate">
                {user.profile?.fullName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {user.role !== Role.STUDENT && (
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <ShieldCheck size={12} className="mr-1" />
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                
                if (item.type === 'link') {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeDropdown}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors focus:bg-accent focus:outline-none"
                      role="menuitem"
                    >
                      <Icon size={18} className="mr-3 text-muted-foreground" />
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors focus:outline-none ${
                      item.variant === 'danger'
                        ? 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
                        : 'text-foreground hover:bg-accent focus:bg-accent'
                    }`}
                    role="menuitem"
                  >
                    <Icon size={18} className="mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Logout */}
            <div className="border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors focus:bg-destructive/10 focus:outline-none"
                role="menuitem"
              >
                <LogOut size={18} className="mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
UserDropdown.displayName = 'UserDropdown';

const NotificationBell = memo<{
  count?: number;
}>(({ count = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasNotifications = count > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={`Notifications ${hasNotifications ? `(${count} unread)` : ''}`}
        type="button"
      >
        <Bell size={20} className="text-muted-foreground" />
        {hasNotifications && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </span>
        )}
      </button>

      {/* Notification dropdown - placeholder */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-scale-in">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            </div>
            <div className="p-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </div>
        </>
      )}
    </div>
  );
});
NotificationBell.displayName = 'NotificationBell';

// UPDATE: Use AppUser instead of FullUserProfile
const MobileMenu = memo<{
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: AppUser | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}>(({ isOpen, onClose, isAuthenticated, user, onLogout, onOpenAuth }) => {
  const dashboardPath = getDashboardPath(user?.role);

  useBodyScrollLock(isOpen);
  useKeyPress('Escape', onClose, isOpen);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="fixed inset-x-0 top-16 bottom-0 z-50 md:hidden bg-background overflow-y-auto animate-slide-down">
        <div className="min-h-full">
          {/* Navigation Links */}
          <nav className="px-4 py-4 space-y-1 border-b border-border">
            <NavLinks 
              onClick={onClose} 
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium hover:bg-accent transition-colors" 
              showIcons={true} 
            />
          </nav>

          {/* User Section */}
          <div className="px-4 py-4">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                {/* User Info Card */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border">
                  <UserAvatar user={user} size="md" showStatus />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.profile?.fullName || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {user.role !== Role.STUDENT && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <ShieldCheck size={10} className="mr-1" />
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  <Link
                    href={dashboardPath}
                    onClick={onClose}
                    className="flex items-center gap-3 w-full px-4 py-3 text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    {user.role === Role.STUDENT ? (
                      <LayoutDashboard size={20} />
                    ) : (
                      <ShieldCheck size={20} />
                    )}
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 w-full px-4 py-3 text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    <User size={20} />
                    <span className="text-sm font-medium">Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 w-full px-4 py-3 text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    <Settings size={20} />
                    <span className="text-sm font-medium">Settings</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 mt-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-destructive/20"
                >
                  <LogOut size={20} />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex items-center justify-center gap-2 w-full border-2 border-primary rounded-lg px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <LogIn size={20} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
MobileMenu.displayName = 'MobileMenu';

const NavbarSkeleton = memo(() => (
  <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
          <div className="hidden sm:block w-24 h-6 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-16 h-4 bg-muted rounded animate-pulse" />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block w-10 h-10 bg-muted rounded-full animate-pulse" />
          <div className="md:hidden w-8 h-8 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  </header>
));
NavbarSkeleton.displayName = 'NavbarSkeleton';

// --- MAIN NAVBAR COMPONENT ---

export default function Navbar() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { openAuthModal } = useUI();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('[Navbar] Logout failed:', error);
    }
  }, [logout, router]);

  const handleOpenAuth = useCallback(() => {
    openAuthModal();
  }, [openAuthModal]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Don't show navbar on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Show skeleton during initial load
  if (isLoading && !user) {
    return <NavbarSkeleton />;
  }

  return (
    <header 
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md shadow-sm' 
          : 'bg-background/80 backdrop-blur-md'
      } border-b border-border`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-80 transition-opacity group"
          >
            <div className="relative">
              <Send 
                size={24} 
                className="transform -rotate-45 text-primary transition-transform group-hover:scale-110" 
              />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Preplyte
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav 
            className="hidden md:flex items-center space-x-1 lg:space-x-2"
            aria-label="Main navigation"
          >
            <NavLinks className="px-3 py-2 rounded-lg" />
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : isAuthenticated && user ? (
              <>
                <NotificationBell count={0} />
                <UserDropdown user={user} onLogout={handleLogout} />
              </>
            ) : (
              <button
                onClick={handleOpenAuth}
                className="flex items-center gap-2 border-2 border-primary rounded-lg px-4 lg:px-6 py-2 font-semibold text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                type="button"
              >
                <LogIn size={18} />
                <span className="hidden lg:inline">Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            type="button"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
      />
    </header>
  );
}
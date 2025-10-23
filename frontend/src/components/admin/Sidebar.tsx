'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// ✅ UPDATED: Added CalendarDays icon for the new Events link
import { LayoutDashboard, Users, Building, LogOut, Globe, LucideIcon, Trophy, Send, CalendarDays,Briefcase  } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/enum';

// Define a type for our navigation links to ensure type safety
interface NavLink {
  name: string;
  href: string;
  icon: LucideIcon;
  requiredRole: Role[];
}

// Updated navigation links with role-specific items
const navLinks: NavLink[] = [
  // --- COMMON LINKS ---
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, requiredRole: [Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN] },
  { name: 'Users', href: '/admin/users', icon: Users, requiredRole: [Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN] },
  
  // ✅ UPDATED: "Events" is now a primary feature for both admin types
  { name: 'Events', href: '/admin/events', icon: CalendarDays, requiredRole: [Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN] },

  // --- SUPER ADMIN ONLY ---
  { name: 'Institutions', href: '/admin/institutions', icon: Building, requiredRole: [Role.SUPER_ADMIN] },
  { name: 'Mock Drive', href: '/admin/mock-drive', icon: Briefcase, requiredRole: [Role.INSTITUTION_ADMIN] }, 
  // --- INSTITUTION ADMIN ONLY ---
  { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy, requiredRole: [Role.INSTITUTION_ADMIN] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/'); // Redirect to the main website homepage after logout
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      {/* Header with original logo */}
      <div className="h-20 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Send size={24} className="transform -rotate-45 text-primary" />
          <span>Preplyte</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow px-4 py-6">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            // Check if the user's role is included in the link's required roles
            if (!user || !link.requiredRole.includes(user.role)) {
              return null;
            }

            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="px-4 py-6 border-t border-border space-y-2">
         <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span>Back to Website</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
"use client";

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Avatar, RoleBadge } from './ui';
import { LayoutDashboard, Search, MessageSquare, UserPlus, Calendar, Target, BookOpen, Newspaper, Library, Shield, User, LogOut, Menu, X, ChevronRight } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  section: 'main' | 'learning' | 'account';
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { to: '/dashboard/mentors', label: 'Find a Mentor', icon: Search, roles: ['mentee'], section: 'main' },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare, section: 'main' },
  { to: '/dashboard/requests', label: 'Requests', icon: UserPlus, section: 'main' },
  { to: '/dashboard/sessions', label: 'Sessions', icon: Calendar, section: 'main' },
  { to: '/dashboard/goals', label: 'Goals', icon: Target, roles: ['mentee', 'active_mentor', 'retired_mentor'], section: 'main' },
  { to: '/dashboard/courses', label: 'Courses', icon: BookOpen, section: 'learning' },
  { to: '/dashboard/blog', label: 'Blog', icon: Newspaper, section: 'learning' },
  { to: '/dashboard/library', label: 'Library', icon: Library, section: 'learning' },
  { to: '/dashboard/admin', label: 'Admin Console', icon: Shield, roles: ['admin'], section: 'account' },
  { to: '/dashboard/profile', label: 'My Profile', icon: User, section: 'account' },
];

const sectionLabels: Record<string, string> = {
  main: 'Mentorship',
  learning: 'Learning',
  account: 'Account',
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const filteredNav = navItems.filter(item => !item.roles || (profile && item.roles.includes(profile.role)));
  const sections = ['main', 'learning', 'account'].filter(s => filteredNav.some(i => i.section === s));

  const renderSidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-navy-100">
        <img
          src="/assets/nigerian-navy-logo.png"
          alt="Nigerian Navy Logo"
          className="w-8 h-8 object-contain flex-shrink-0"
        />
        <div>
          <h1 className="text-navy-800 font-bold text-sm leading-tight tracking-tight">NN Mentorship</h1>
          <p className="text-navy-400 text-[10px] font-medium">Nigerian Navy</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {sections.map(section => (
          <div key={section} className="mb-4">
            <p className="px-2.5 mb-1 text-[10px] font-semibold text-navy-300 uppercase tracking-wider">{sectionLabels[section]}</p>
            <div className="space-y-0.5">
              {filteredNav.filter(i => i.section === section).map(item => {
                const isActive = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-navy-700 text-white'
                        : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Card */}
      <div className="px-3 py-3 border-t border-navy-100">
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
          <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-navy-800 text-[13px] font-medium truncate">{profile?.full_name}</p>
            <p className="text-navy-400 text-[11px] truncate">{profile?.rank || profile?.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-navy-400 hover:bg-red-50 hover:text-red-500 transition-all w-full"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-navy-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 sidebar-bg fixed inset-y-0 left-0 z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <motion.div
              className="fixed inset-0 bg-navy-950/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="relative flex flex-col w-60 sidebar-bg"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-500 hover:bg-navy-100"
              >
                <X className="w-4 h-4" />
              </button>
              {renderSidebarContent()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-navy-100 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 rounded-md flex items-center justify-center text-navy-500 hover:bg-navy-50 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/assets/nigerian-navy-logo.png"
                alt="Nigerian Navy Logo"
                className="w-7 h-7 object-contain"
              />
              <span className="text-navy-800 font-bold text-sm tracking-tight">NN Mentorship</span>
            </div>
          </div>
          {profile && <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />}
        </header>

        {/* Verification Banners */}
        {profile && profile.verification_status === 'pending' && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Account pending verification.</span> An administrator will review your service details shortly.
              </p>
            </div>
          </div>
        )}
        {profile && profile.verification_status === 'rejected' && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2 text-center">
            <p className="text-xs text-red-700">
              <span className="font-semibold">Verification rejected.</span> Please contact the administrator for assistance.
            </p>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto overflow-x-hidden">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

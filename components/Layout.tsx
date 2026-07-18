"use client";

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Avatar, RoleBadge, Button } from './ui';
import ThemeToggle from './ThemeToggle';
import { api } from '@/lib/api';
import { LayoutDashboard, Search, MessageSquare, UserPlus, Calendar, Target, BookOpen, Newspaper, Library, Shield, User, LogOut, Menu, X, ChevronRight, Bell, Clock, MapPin } from 'lucide-react';

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
  { to: '/dashboard/events', label: 'Events', icon: MapPin, section: 'main' },
  { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar, section: 'main' },
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
  
  // Layout States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [time, setTime] = useState('');
  const [greeting, setGreeting] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      const load = () => {
        api.notifications.list()
          .then(setNotifications)
          .catch(err => console.error("Error loading header notifications:", err));
      };

      load();

      const interval = setInterval(load, 30000);
      return () => clearInterval(interval);
    }
  }, [profile, pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Clock Update Effect (Military Standard 24h)
  const updateClock = useCallback(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setTime(`${hours}:${minutes}:${seconds}`);

    const hr = now.getHours();
    if (hr >= 5 && hr < 12) {
      setGreeting('Good Morning');
    } else if (hr >= 12 && hr < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  useEffect(() => {
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [updateClock]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setSearchQuery('');
    }
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
      <aside className="hidden lg:flex flex-col w-60 sidebar-bg fixed inset-y-0 left-0 z-35 border-r border-navy-100/50">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
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

      {/* Profile Details Right Drawer */}
      <AnimatePresence>
        {profileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileDrawerOpen(false)}
            />
            {/* Slide-out Drawer Panel */}
            <motion.div
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-lifted z-50 border-l border-navy-100 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-navy-100 bg-navy-50/10">
                <span className="text-xs font-bold text-navy-800 uppercase tracking-wider">Account Settings</span>
                <button
                  onClick={() => setProfileDrawerOpen(false)}
                  className="p-1 rounded-md hover:bg-navy-50 text-navy-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Profile Card */}
              <div className="flex flex-col items-center p-6 border-b border-navy-100 text-center bg-navy-50/5">
                <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="lg" />
                <h3 className="font-bold text-navy-900 mt-3 text-sm tracking-tight">{profile?.full_name}</h3>
                <p className="text-[11px] text-navy-400 mt-1 font-medium">{profile?.rank}</p>
                <div className="mt-2.5">
                  <RoleBadge role={profile?.role || 'mentee'} />
                </div>
              </div>

              {/* Drawer Details Info */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-navy-300 tracking-wider block">Email Address</span>
                  <p className="text-navy-700 mt-0.5 font-medium">{profile?.email}</p>
                </div>
                {profile?.service_number && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-navy-300 tracking-wider block">Service Number</span>
                    <p className="text-navy-700 mt-0.5 font-semibold font-mono">{profile.service_number}</p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold text-navy-300 tracking-wider block">Specialization</span>
                  <p className="text-navy-700 mt-0.5 font-medium">{profile?.specialization || 'Not Specified'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-navy-300 tracking-wider block">Command Location</span>
                  <p className="text-navy-700 mt-0.5 font-medium">{profile?.command_location || 'Not Specified'}</p>
                </div>
                {profile?.years_of_service !== undefined && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-navy-300 tracking-wider block">Years of Service</span>
                    <p className="text-navy-700 mt-0.5 font-medium">{profile.years_of_service} Years</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-navy-100 bg-navy-50/15 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between text-xs text-navy-600 px-1 py-1">
                  <span className="font-medium">Dark Theme</span>
                  <ThemeToggle />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProfileDrawerOpen(false);
                    router.push('/dashboard/profile');
                  }}
                  className="w-full text-xs font-semibold"
                >
                  <User className="w-3.5 h-3.5 mr-1.5" /> View Profile Page
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setProfileDrawerOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen min-w-0">
        
        {/* Universal Top Header Bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-2.5 lg:py-4 bg-white border-b border-navy-100/80 sticky top-0 z-20 shadow-soft">
          {mobileSearchOpen ? (
            /* Mobile Search Bar Active State */
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-navy-400 shrink-0" />
              <input
                type="text"
                placeholder="Search mentors, courses, articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-full border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white bg-navy-50/20 text-xs transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-xs text-navy-500 font-semibold px-2 py-1 rounded hover:bg-navy-50 shrink-0 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            /* Default Header State */
            <>
              {/* Left Column (Menu trigger on Mobile, Clock + Greeting on Desktop) */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mobile Menu Icon */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-8 h-8 rounded-md flex items-center justify-center text-navy-500 hover:bg-navy-50 transition-colors shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* Mobile Title */}
                <div className="flex lg:hidden items-center gap-2 shrink-0">
                  <img
                    src="/assets/nigerian-navy-logo.png"
                    alt="Nigerian Navy Logo"
                    className="w-7 h-7 object-contain"
                  />
                  <span className="text-navy-800 font-bold text-sm tracking-tight">NN Mentorship</span>
                </div>

                {/* Desktop Clock & Greetings */}
                <div className="hidden lg:flex items-center gap-3.5 text-xs text-navy-600 font-medium">
                  <div className="flex items-center gap-1.5 bg-navy-50/60 border border-navy-100/50 px-2.5 py-1.5 rounded-lg shadow-sm font-mono font-bold tracking-wider text-navy-800 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-navy-500" />
                    <span>{time}</span>
                  </div>
                  {profile && (
                    <span className="truncate max-w-[200px] text-navy-500">
                      {greeting}, <span className="font-semibold text-navy-800">{(profile.full_name || 'User').split(' ')[0]}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Center Column (Desktop search input) */}
              <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-64 xl:w-80 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search mentors, courses, articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-full border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-navy-400 focus:bg-white bg-navy-50/20 text-xs transition-all"
                />
              </form>

              {/* Right Column (Mobile search button, Bell notifications, Profile avatar trigger) */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Mobile Search Button */}
                <button
                  onClick={() => setMobileSearchOpen(true)}
                  className="md:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-navy-50 text-navy-600 transition-colors"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>

                {/* Notifications Bell Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowNotifDropdown(true)}
                  onMouseLeave={() => setShowNotifDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      router.push('/dashboard/notifications');
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-navy-50 text-navy-600 relative transition-all"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </button>

                  {/* Dropdown panel on hover */}
                  <AnimatePresence>
                    {showNotifDropdown && (
                      <motion.div
                        className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-navy-100 shadow-lifted z-40 p-2 text-xs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex items-center justify-between p-2 border-b border-navy-50 font-bold text-navy-800">
                          <span>Recent Notifications ({unreadCount} unread)</span>
                          <Link
                            href="/dashboard/notifications"
                            onClick={() => setShowNotifDropdown(false)}
                            className="text-[10px] text-navy-500 hover:text-navy-700 underline font-semibold"
                          >
                            View All
                          </Link>
                        </div>
                        <div className="py-1 max-h-60 overflow-y-auto space-y-1">
                          {notifications.length === 0 ? (
                            <div className="text-center p-4 text-navy-400">No notifications</div>
                          ) : (
                            notifications.slice(0, 4).map(n => (
                              <Link
                                key={n.id}
                                href={n.link || '/dashboard'}
                                onClick={async () => {
                                  setShowNotifDropdown(false);
                                  if (!n.read) {
                                    await api.notifications.markRead(n.id);
                                    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                                  }
                                }}
                                className={`block p-2 rounded-lg hover:bg-navy-50 text-navy-700 transition-colors ${!n.read ? 'bg-navy-50/40 font-medium' : ''}`}
                              >
                                <span className="font-semibold block text-navy-900 flex items-center justify-between">
                                  {n.title}
                                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-navy-500" />}
                                </span>
                                {n.message}
                                <span className="block text-[10px] text-navy-400 mt-0.5">
                                  {new Date(n.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                              </Link>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Avatar trigger for Slide-out Drawer */}
                {profile && (
                  <button
                    onClick={() => setProfileDrawerOpen(true)}
                    className="shrink-0 rounded-full ring-2 ring-transparent hover:ring-navy-200 transition-all p-0.5 cursor-pointer active:scale-95"
                  >
                    <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
                  </button>
                )}
              </div>
            </>
          )}
        </header>

        {/* Verification Banners */}
        {profile && profile.verification_status === 'pending' && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 shrink-0">
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Account pending verification.</span> An administrator will review your service details shortly.
              </p>
            </div>
          </div>
        )}
        {profile && profile.verification_status === 'rejected' && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2 text-center shrink-0">
            <p className="text-xs text-red-700">
              <span className="font-semibold">Verification rejected.</span> Please contact the administrator for assistance.
            </p>
          </div>
        )}

        {/* Dynamic Page Content */}
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

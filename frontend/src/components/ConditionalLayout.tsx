'use client';

import AnnouncementBanner from '@/components/AnnouncementBanner';
import FeedbackUpdateBanner from '@/components/FeedbackUpdateBanner';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import StoreBadges from './StoreBadges';
import ReleaseBanner from './ReleaseBanner';
import CGSelector from './CGSelector';
import ServerIndicator from './ServerIndicator';
import { APP_VERSION } from '@/lib/version';
import { canAccessAdmin } from '@/lib/permissions';
import { ChevronDown, Menu, X } from 'lucide-react';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  releaseHighlight?: string;
}

function isTradeTeamCards(pathname: string | null) {
  return Boolean(pathname?.startsWith('/trade-teams') && !pathname.startsWith('/trade-teams/overview'));
}

export default function ConditionalLayout({ children, releaseHighlight }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userLastSeenVersion, setUserLastSeenVersion] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const isAuthPage = pathname?.startsWith('/auth');
  const isPublicPage = pathname === '/privacy' || pathname === '/support';
  const isHelpPage = pathname?.startsWith('/help') || pathname?.startsWith('/release-notes');
  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));
  const isChatRoute = pathname === '/chat';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  useEffect(() => {
    if (!session?.user || isAuthPage || isPublicPage) return;
    let cancelled = false;
    async function loadUnread() {
      try {
        const response = await fetch('/api/v1/chat', { cache: 'no-store' });
        if (!response.ok) return;
        const body = await response.json();
        const total = (body.channels || []).reduce(
          (sum: number, channel: { unread?: number }) => sum + (channel.unread || 0),
          0,
        );
        if (!cancelled) setChatUnread(total);
      } catch {
        if (!cancelled) setChatUnread(0);
      }
    }
    void loadUnread();
    const onUnread = (event: Event) => {
      const total = (event as CustomEvent<number>).detail;
      if (typeof total === 'number') setChatUnread(total);
    };
    window.addEventListener('ldc-chat-unread', onUnread);
    async function loadAvailable() {
      try {
        const response = await fetch('/api/v1/work-items/available-count', { cache: 'no-store' });
        if (!response.ok) return;
        const body = await response.json();
        if (!cancelled) setAvailableCount(typeof body.count === 'number' ? body.count : 0);
      } catch {
        if (!cancelled) setAvailableCount(0);
      }
    }
    void loadAvailable();
    const timer = window.setInterval(() => {
      void loadUnread();
      void loadAvailable();
    }, 20000);
    return () => {
      cancelled = true;
      window.removeEventListener('ldc-chat-unread', onUnread);
      window.clearInterval(timer);
    };
  }, [session?.user?.email, isAuthPage, isPublicPage]);

  // Fetch user's last seen release version
  useEffect(() => {
    if (session?.user?.email && !isAuthPage && !isPublicPage && !isHelpPage) {
      fetch('/api/v1/user/profile')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.success && data.user) {
            setUserLastSeenVersion(data.user.lastSeenReleaseVersion || null);
          }
        })
        .catch(() => {
          // Silently fail - banner just won't show
        });
    }
  }, [session?.user?.email, isAuthPage, isPublicPage, isHelpPage]);

  if (isAuthPage || isPublicPage || isHelpPage) {
    return <>{children}</>;
  }

  const navClass = (active: boolean | undefined) =>
    active ? 'text-blue-600 font-medium' : 'text-gray-900 hover:text-blue-600 font-medium';

  return (
    <div className={isChatRoute ? 'flex h-dvh flex-col overflow-hidden bg-gray-50' : 'min-h-screen bg-gray-50'}>
      <ReleaseBanner 
        currentVersion={APP_VERSION}
        userLastSeenVersion={userLastSeenVersion}
        releaseHighlight={releaseHighlight}
      />
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="LDC Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                LDC Tools
              </h1>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex min-w-0 items-center gap-4">
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link href="/" className={navClass(pathname === '/')}>
                  Dashboard
                </Link>
                <Link href="/my-work" className={navClass(pathname === '/my-work')}>
                  My Work
                </Link>
                <Link href="/trade-teams/overview" className={navClass(pathname?.startsWith('/trade-teams/overview'))}>
                  Directory
                </Link>
                <Link href="/work" className={navClass(pathname === '/work')}>
                  <span className="inline-flex items-center gap-1.5">
                    Work
                    {availableCount > 0 ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-900">{availableCount}</span>
                    ) : null}
                  </span>
                </Link>
                <Link href="/chat" className={navClass(pathname === '/chat')}>
                  <span className="inline-flex items-center gap-1.5">
                    Chat
                    {chatUnread > 0 ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-900">{chatUnread}</span>
                    ) : null}
                  </span>
                </Link>
                <Link href="/projects" className={navClass(pathname === '/projects')}>
                  Projects
                </Link>
                <Link href="/processes" className={navClass(pathname === '/processes')}>
                  Processes
                </Link>
                <Link href="/references" className={navClass(pathname === '/references')}>
                  References
                </Link>
                <Link
                  href="/trade-teams"
                  className={navClass(isTradeTeamCards(pathname))}
                >
                  Trade Teams
                </Link>

                {canAccessAdmin(session) && (
                  <Link href="/admin" className={navClass(pathname?.startsWith('/admin'))}>
                    Admin
                  </Link>
                )}

                <span className="text-gray-300">|</span>

                {/* Help Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === 'help' ? null : 'help');
                    }}
                    className="text-gray-600 hover:text-blue-600 font-medium flex items-center space-x-1"
                  >
                    <span>Help</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {openDropdown === 'help' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link href="/mobile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Mobile app
                      </Link>
                      <Link href="/help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Help Center
                      </Link>
                      <Link href="/help/my-feedback" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Feedback
                      </Link>
                      <Link href="/release-notes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Release Notes
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
              <div className="border-l border-gray-300 pl-6 flex items-center space-x-4">
                <CGSelector />
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 lg:hidden overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              <Link 
                href="/" 
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/my-work"
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Work
              </Link>
              <Link 
                href="/trade-teams/overview" 
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Directory
              </Link>
              <Link
                href="/work"
                className="flex items-center justify-between px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Work</span>
                {availableCount > 0 ? (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-900">{availableCount}</span>
                ) : null}
              </Link>
              <Link
                href="/chat"
                className="flex items-center justify-between px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Chat</span>
                {chatUnread > 0 ? (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-900">{chatUnread}</span>
                ) : null}
              </Link>
              <Link
                href="/projects"
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Projects
              </Link>
              <Link
                href="/processes"
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Processes
              </Link>
              <Link
                href="/references"
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                References
              </Link>
              <Link 
                href="/trade-teams" 
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Trade Teams
              </Link>

              {/* Admin Section */}
              {canAccessAdmin(session) && (
                <div className="pt-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </div>
                  <Link 
                    href="/admin" 
                    className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Control Center
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Accounts
                  </Link>
                </div>
              )}

              {/* Help Section */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Help & Support
                </div>
                <Link
                  href="/mobile"
                  className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mobile app
                </Link>
                <Link 
                  href="/help" 
                  className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ❓ Help Center
                </Link>
                <Link 
                  href="/help/my-feedback" 
                  className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  💬 My Feedback
                </Link>
                <Link 
                  href="/help/feedback" 
                  className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  💡 Send Feedback
                </Link>
                <Link 
                  href="/release-notes" 
                  className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📢 Release Notes
                </Link>
              </div>

              {/* CG Selector for SUPER_ADMIN */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Construction Group
                </div>
                <div className="px-4 py-2">
                  <CGSelector />
                </div>
              </div>

              {/* Sign Out */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="px-4">
                  <SignOutButton />
                </div>
              </div>
            </nav>
          </div>
        </>
      )}

      <FeedbackUpdateBanner />
      <main className={isChatRoute ? 'mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-3 py-3 sm:px-6 lg:px-8' : isAdminRoute ? 'min-w-0' : 'max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8 lg:px-8'}>
        {isChatRoute ? null : (
          <div className={isAdminRoute ? 'px-4 pt-4 sm:px-6 lg:px-8' : undefined}>
            <AnnouncementBanner />
          </div>
        )}
        {children}
      </main>
      {isAdminRoute || isChatRoute ? null : (
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                <p>LDC Tools v{APP_VERSION}</p>
              </div>
              <ServerIndicator />
            </div>
            <div className="flex flex-col items-center gap-3 sm:items-end">
              <StoreBadges />
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
                <Link href="/help/feedback" className="text-gray-600 hover:text-blue-600 whitespace-nowrap">
                  💡 Send Feedback
                </Link>
                <Link href="/help" className="text-gray-600 hover:text-blue-600 whitespace-nowrap">
                  Help Center
                </Link>
                <Link href="/release-notes" className="text-gray-600 hover:text-blue-600 whitespace-nowrap">
                  Release Notes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}

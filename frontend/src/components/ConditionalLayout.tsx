'use client';

import AnnouncementBanner from '@/components/AnnouncementBanner';
import FeedbackUpdateBanner from '@/components/FeedbackUpdateBanner';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
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
  const isAuthPage = pathname?.startsWith('/auth');
  const isHelpPage = pathname?.startsWith('/help') || pathname?.startsWith('/release-notes');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Fetch user's last seen release version
  useEffect(() => {
    if (session?.user?.email && !isAuthPage && !isHelpPage) {
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
  }, [session?.user?.email, isAuthPage, isHelpPage]);

  if (isAuthPage || isHelpPage) {
    return <>{children}</>;
  }

  const navClass = (active: boolean | undefined) =>
    active ? 'text-blue-600 font-medium' : 'text-gray-900 hover:text-blue-600 font-medium';

  return (
    <div className="min-h-screen bg-gray-50">
      <ReleaseBanner 
        currentVersion={APP_VERSION}
        userLastSeenVersion={userLastSeenVersion}
        releaseHighlight={releaseHighlight}
      />
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="LDC Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                LDC Tools
              </h1>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <nav className="flex space-x-6">
                <Link href="/" className={navClass(pathname === '/')}>
                  Dashboard
                </Link>
                <Link href="/trade-teams/overview" className={navClass(pathname?.startsWith('/trade-teams/overview'))}>
                  Directory
                </Link>
                <Link href="/work" className={navClass(pathname === '/work')}>
                  Work
                </Link>
                <Link href="/projects" className={navClass(pathname === '/projects')}>
                  Projects
                </Link>
                <Link href="/processes" className={navClass(pathname === '/processes')}>
                  Processes
                </Link>
                <Link
                  href="/trade-teams"
                  className={navClass(isTradeTeamCards(pathname))}
                >
                  Trade Teams
                </Link>

                {/* Admin Dropdown */}
                {canAccessAdmin(session) && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === 'admin' ? null : 'admin');
                      }}
                      className="text-gray-700 hover:text-blue-600 font-medium flex items-center space-x-1"
                    >
                      <span>Admin</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {openDropdown === 'admin' && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                        <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Admin Dashboard
                        </Link>
                      </div>
                    )}
                  </div>
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
                href="/trade-teams/overview" 
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Directory
              </Link>
              <Link
                href="/work"
                className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Work
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
                    🔐 Admin Dashboard
                  </Link>
                </div>
              )}

              {/* Help Section */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Help & Support
                </div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnnouncementBanner />
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                <p>LDC Tools v{APP_VERSION}</p>
              </div>
              <ServerIndicator />
            </div>
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
      </footer>
    </div>
  );
}

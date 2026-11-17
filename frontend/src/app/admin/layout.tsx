'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Shield, Users, Mail, Activity, BarChart, FileText, Settings, MessageSquare, Bell, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toast-provider';

type AdminModule = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

function AdminNav({
  modules,
  pathname,
  onNavigate,
}: {
  modules: AdminModule[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = pathname === module.href;

        return (
          <Link
            key={module.name}
            href={module.href}
            title={module.description}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex items-center rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-colors min-h-[40px] ${
              isActive
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon
              className={`mr-3 h-4 w-4 shrink-0 ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
              }`}
            />
            <span className="truncate">{module.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [environment, setEnvironment] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('green')) {
      setEnvironment('GREEN');
    } else if (hostname.includes('blue')) {
      setEnvironment('BLUE');
    } else if (hostname === 'ldctools.com' || hostname === 'www.ldctools.com') {
      setEnvironment('PRODUCTION');
    } else {
      setEnvironment('DEVELOPMENT');
    }
  }, []);

  const adminModules = useMemo<AdminModule[]>(() => [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Shield,
      description: 'Admin overview and quick actions'
    },
    {
      name: 'Accounts',
      href: '/admin/users',
      icon: Users,
      description: 'Sign-in accounts, roles, and invitations'
    },
    {
      name: 'Email Configuration',
      href: '/admin/email',
      icon: Mail,
      description: 'Configure Gmail and email templates'
    },
    {
      name: 'Announcements',
      href: '/admin/announcements',
      icon: Bell,
      description: 'Manage site-wide and CG announcements'
    },
    {
      name: 'Health Monitor',
      href: '/admin/health',
      icon: Activity,
      description: 'System health and performance metrics'
    },
    {
      name: 'API Status',
      href: '/admin/api',
      icon: BarChart,
      description: 'API monitoring and performance'
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit',
      icon: FileText,
      description: 'Activity logs and compliance reports'
    },
    {
      name: 'Feedback Management',
      href: '/admin/feedback',
      icon: MessageSquare,
      description: 'User feedback and bug reports'
    },
    {
      name: 'System Operations',
      href: '/admin/system',
      icon: Settings,
      description: 'Backup, restore, and maintenance'
    }
  ], []);

  const environmentClass =
    environment === 'GREEN' ? 'bg-green-100 text-green-800' :
    environment === 'BLUE' ? 'bg-blue-100 text-blue-800' :
    environment === 'PRODUCTION' ? 'bg-purple-100 text-purple-800' :
    'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Shield className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">Admin Control Center</h1>
              <p className="hidden text-xs text-gray-500 sm:block">LDC Tools Administration</p>
            </div>
          </div>
          {environment ? (
            <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${environmentClass}`}>
              <span className="hidden sm:inline">{environment} Environment</span>
              <span className="sm:hidden">{environment}</span>
            </span>
          ) : null}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">Admin Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3">
          <AdminNav modules={adminModules} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Quick links</p>
            <Link href="/help" onClick={() => setSidebarOpen(false)} className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Help Center</Link>
            <Link href="/release-notes" onClick={() => setSidebarOpen(false)} className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Release Notes</Link>
          </div>
        </div>
      </div>

      <div className="flex">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white lg:block">
          <div className="flex h-full flex-col p-3">
            <AdminNav modules={adminModules} pathname={pathname} />
            <div className="mt-auto border-t border-gray-200 pt-3">
              <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Quick links</p>
              <Link href="/help" className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Help Center</Link>
              <Link href="/release-notes" className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Release Notes</Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </div>
    </div>
  );
}

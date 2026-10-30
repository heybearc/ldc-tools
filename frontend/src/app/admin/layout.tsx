'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Shield, Users, Mail, Activity, BarChart, FileText, Settings, MessageSquare, Bell, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toast-provider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [environment, setEnvironment] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Detect environment from hostname
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

  const adminModules = useMemo(() => [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Shield,
      description: 'Admin overview and quick actions'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      description: 'Manage users, roles, and invitations'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] min-w-[44px]"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Admin Control Center</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">LDC Tools Administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {environment && (
                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  environment === 'GREEN' ? 'bg-green-100 text-green-800' :
                  environment === 'BLUE' ? 'bg-blue-100 text-blue-800' :
                  environment === 'PRODUCTION' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  <span className="hidden sm:inline">{environment} Environment</span>
                  <span className="sm:hidden">{environment}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">Admin Menu</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] min-w-[44px]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="space-y-1">
            {adminModules.map((module) => {
              const Icon = module.icon;
              const isActive = pathname === module.href;
              
              return (
                <Link
                  key={module.name}
                  href={module.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <div>
                    <div className="font-medium">{module.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{module.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Quick Links - Mobile */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link 
                href="/help" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center text-xs text-blue-700 hover:text-blue-900 transition-colors min-h-[44px]"
              >
                <span className="mr-2">📚</span>
                Help Center
              </Link>
              <Link 
                href="/release-notes" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center text-xs text-blue-700 hover:text-blue-900 transition-colors min-h-[44px]"
              >
                <span className="mr-2">📋</span>
                Release Notes
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-8">
          {/* Admin Navigation Sidebar - Desktop Only */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <nav className="space-y-2">
              {adminModules.map((module) => {
                const Icon = module.icon;
                const isActive = pathname === module.href;
                
                return (
                  <Link
                    key={module.name}
                    href={module.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{module.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Links */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link 
                  href="/help" 
                  className="flex items-center text-xs text-blue-700 hover:text-blue-900 transition-colors"
                >
                  <span className="mr-2">📚</span>
                  Help Center
                </Link>
                <Link 
                  href="/release-notes" 
                  className="flex items-center text-xs text-blue-700 hover:text-blue-900 transition-colors"
                >
                  <span className="mr-2">📋</span>
                  Release Notes
                </Link>
              </div>
            </div>

          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <ToastProvider>{children}</ToastProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

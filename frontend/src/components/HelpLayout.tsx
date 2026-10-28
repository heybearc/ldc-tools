'use client'

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut, useSession, SessionProvider } from 'next-auth/react'
import Link from 'next/link'
import { APP_VERSION } from '@/lib/version'

interface HelpLayoutProps {
  children: ReactNode
  title?: string
}

function HelpLayoutContent({ children, title }: HelpLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const version = APP_VERSION

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Top Navigation Bar with Gradient */}
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <img src="/logo.svg" alt="LDC Logo" className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {title || 'LDC Tools'}
                  </h1>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Navigation Links */}
              <Link
                href="/help"
                className={`text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/help' ? 'bg-white/20 text-white' : ''
                }`}
              >
                📚 Help Center
              </Link>
              <Link
                href="/release-notes"
                className={`text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/release-notes' ? 'bg-white/20 text-white' : ''
                }`}
              >
                📋 Release Notes
              </Link>

              {/* User Menu */}
              <div className="flex items-center space-x-3 border-l border-white/20 pl-4 ml-2">
                {session?.user?.name && (
                  <span className="text-sm text-white/90 hidden md:inline">
                    {session.user.name}
                  </span>
                )}
                
                {/* Back to App Button */}
                <Link
                  href={session?.user?.role === 'SUPER_ADMIN' ? '/admin' : '/'}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md"
                >
                  ← Back to App
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <img src="/logo.svg" alt="LDC Logo" className="h-8 w-8" />
              <span className="text-lg font-semibold text-gray-900">LDC Tools</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Trade leadership directory</p>
            <p className="text-xs text-gray-500 mb-4">Version {version}</p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <Link href="/help" className="text-blue-600 hover:text-blue-800 font-medium">📚 Help Center</Link>
              <span className="text-gray-300">•</span>
              <Link href="/release-notes" className="text-blue-600 hover:text-blue-800 font-medium">📋 Release Notes</Link>
              <span className="text-gray-300">•</span>
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">🏠 Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function HelpLayout(props: HelpLayoutProps) {
  return (
    <SessionProvider>
      <HelpLayoutContent {...props} />
    </SessionProvider>
  )
}

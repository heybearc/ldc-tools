import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from '../components/AuthProvider'
import ConditionalLayout from '../components/ConditionalLayout'
import { getLatestReleaseHighlight } from '@/lib/releaseNotes'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LDC Tools',
  description: 'Personnel contact and project management system for LDC Region 01.12',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the latest release highlight from RELEASE_NOTES.md
  const releaseHighlight = getLatestReleaseHighlight();

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ConditionalLayout releaseHighlight={releaseHighlight}>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  )
}

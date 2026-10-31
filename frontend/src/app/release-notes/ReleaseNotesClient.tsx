'use client'
import { useState } from 'react'
import Link from 'next/link'
import { APP_VERSION } from '@/lib/version'
import type { Release } from './page'

interface ReleaseNotesClientProps {
  releases: Release[]
}

export default function ReleaseNotesClient({ releases }: ReleaseNotesClientProps) {
  const [selectedVersion, setSelectedVersion] = useState(releases[0]?.version || '')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '1.20-1.27': true, // Latest group expanded by default
  })

  const selectedRelease = releases.find(r => r.version === selectedVersion) || releases[0]

  // Group releases by major version ranges
  const groupReleases = () => {
    const groups: Record<string, Release[]> = {
      '1.20-1.27': [],
      '1.10-1.19': [],
      '1.0-1.9': [],
    }

    releases.forEach(release => {
      const version = parseFloat(release.version)
      if (version >= 1.20) {
        groups['1.20-1.27'].push(release)
      } else if (version >= 1.10) {
        groups['1.10-1.19'].push(release)
      } else {
        groups['1.0-1.9'].push(release)
      }
    })

    return groups
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))
  }

  const releaseGroups = groupReleases()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Release Notes</h1>
              <span className="text-sm text-gray-500">v{APP_VERSION}</span>
            </div>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Sidebar Navigation with Collapsible Groups */}
          <aside className="w-full md:w-64 md:flex-shrink-0">
            <div className="md:sticky md:top-24 bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-[40vh] md:max-h-[calc(100vh-120px)] overflow-y-auto">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 px-2">Versions</h2>
              <nav className="space-y-2">
                {Object.entries(releaseGroups).map(([groupName, groupReleases]) => (
                  groupReleases.length > 0 && (
                    <div key={groupName}>
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(groupName)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <span>v{groupName}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedGroups[groupName] ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Group Items */}
                      {expandedGroups[groupName] && (
                        <div className="mt-1 space-y-1 ml-2">
                          {groupReleases.map((release) => (
                            <button
                              key={release.version}
                              onClick={() => setSelectedVersion(release.version)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedVersion === release.version
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>v{release.version}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  release.type === 'major' ? 'bg-red-100 text-red-700' :
                                  release.type === 'minor' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {release.type}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{release.date}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {selectedRelease && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Release Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-gray-900">v{selectedRelease.version}</h2>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedRelease.type === 'major' ? 'bg-red-100 text-red-700' :
                          selectedRelease.type === 'minor' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {selectedRelease.type.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedRelease.title}</h3>
                      <p className="text-gray-600">{selectedRelease.description}</p>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">{selectedRelease.date}</span>
                  </div>
                </div>

                {/* Markdown Content */}
                <div className="p-6">
                  <div 
                    className="prose prose-blue max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700"
                    dangerouslySetInnerHTML={{ __html: selectedRelease.content }}
                  />
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-8 bg-blue-50 rounded-lg border border-blue-100 p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Have questions about a release or need assistance? We're here to help.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/help"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                    >
                      Visit Help Center
                    </Link>
                    <span className="text-gray-300">•</span>
                    <Link
                      href="/feedback"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                    >
                      Send Feedback
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

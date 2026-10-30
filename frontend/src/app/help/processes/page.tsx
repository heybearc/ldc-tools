import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProcessesHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Processes">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Processes</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Processes</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">What is a process?</h2>
            <p className="text-blue-800 mb-0">
              A checklist for the construction group you are signed in to. Another group does not see it.
            </p>
          </div>

          <h2>Save a process</h2>
          <p>
            Personnel can add a process. Give it a name, then add each step with a title and detail.
            An explanation and a reference link are optional.
          </p>

          <h2>Start a process</h2>
          <p>
            Choose Start. Pick a project when the steps belong on one. Each step becomes a task on the work list, with its explanation.
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

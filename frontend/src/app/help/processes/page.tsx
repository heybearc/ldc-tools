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
              A reusable template for the construction group you are signed in to. A draft cannot create work. Publishing it lets the team use it. Starting a published template copies the tasks onto one work item.
            </p>
          </div>

          <h2>Save a draft</h2>
          <p>
            Personnel can add a process. It stays a draft until you choose Publish. Give it a name and a purpose. Each task has a title. Instructions and a reference link are optional.
            Standalone work is not tied to a project. Project work asks for the project when you start it.
            How often can be one time, daily, weekly, every two weeks, monthly, quarterly, yearly, or a custom number of days, weeks, or months.
            Edit changes the template. Saving does not publish or unpublish it. Work already started keeps the tasks it copied. Return to draft takes a published template out of use.
          </p>

          <h2>Use a published process</h2>
          <p>
            Add a standalone process to Work, or add a project process after you choose the project.
            Work lists it as one claimable item. The tasks stay inside it. Claiming it assigns the whole process.
            The assignee can check off each task, mark the process Done, or return it to the pool.
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

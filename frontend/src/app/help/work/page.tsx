import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function WorkHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Work">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Work</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Work</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">What is the work list?</h2>
            <p className="text-blue-800 mb-0">
              Tasks for the construction group you are signed in to. You do not see another group&apos;s work.
            </p>
          </div>

          <h2>Add a task</h2>
          <p>
            Personnel Contact, Assistant, and Support can add work. Open Work, choose Add work, and enter a title and detail.
            Timing is a deadline, a date on a project, or a repeat of monthly or yearly. You can assign someone in this group, and you can mark the task claimable.
          </p>

          <h2>Claim a task</h2>
          <p>
            When a claimable task has no assignee, anyone signed in to this construction group can choose Claim. That assigns the task to you.
          </p>

          <h2>Finish a task</h2>
          <p>
            The assignee, or Personnel, can mark the task Done. Done tasks stay on the list under Done.
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

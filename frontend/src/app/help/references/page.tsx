import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ReferencesHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="References">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">References</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">References</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">Where are the team links?</h2>
            <p className="text-blue-800 mb-0">
              References is the shared list for the construction group you are signed in to. Open it from the header, or from More in the phone app.
            </p>
          </div>

          <h2>Open a link</h2>
          <p>
            Everyone signed in to the group can search the list and open a link. Categories group forms, documents, and sites. A blank category is listed as General.
          </p>
          <h2>Add or change a link</h2>
          <p>
            Personnel Contact, Assistant, and Support can add, edit, or remove a link. A title and a web address are required. A category and a short note are optional.
            A link on a task, or a web address in chat, stays on that item. It does not appear here unless someone adds it.
          </p>
          <p>
            <Link href="/references" className="font-semibold">Open References</Link>
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

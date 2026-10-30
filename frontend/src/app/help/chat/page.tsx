import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ChatHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Chat">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Chat</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Chat</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">Who can you message?</h2>
            <p className="text-blue-800 mb-0">
              People signed in to the same construction group. Another group does not see these chats.
            </p>
          </div>

          <h2>Team chat</h2>
          <p>
            Open Chat. The Team conversation is there for everyone in this group. Type a message and choose Send.
          </p>

          <h2>A direct message</h2>
          <p>
            Choose one teammate and start a conversation with that person. It stays between the two of you.
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

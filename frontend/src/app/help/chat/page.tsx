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
              The Personnel team in this construction group. Directory names are not in chat. Another group does not see these chats.
            </p>
          </div>

          <h2>Team chat</h2>
          <p>
            Open Chat and choose Team chat. A message there goes to the Personnel team in this construction group. On a phone, the list stays up until you choose a conversation. The phone app has the same team room and direct messages. Type a message and choose Send. Choose Mark unread to keep a conversation marked until you are ready, or Mark read to clear it. The Chat link shows how many conversations are still unread. The phone app can also show an alert, a badge, and a sound for a new chat message or an announcement. Allow alerts when the phone asks.
          </p>

          <h2>A direct message</h2>
          <p>
            Choose New chat. Search by name or email, or choose a person from the list. That conversation stays between the two of you. The Personnel team stays out of the conversation list until you start a chat. Turn on notifications in the browser when you want this computer to be told about a new message. Each phone and computer does this once.
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

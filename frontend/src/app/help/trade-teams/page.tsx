import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TradeTeamsHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Trade Teams">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Trade Teams</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">👥 Trade Teams</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">What are Trade Teams?</h2>
            <p className="text-blue-800 mb-0">
              A trade team is a specialty, such as Electrical. Each team has crews. The directory lists the oversight roles on those teams and crews: overseer, assistant, and support.
            </p>
          </div>

          <h2>Directory</h2>
          <p>
            Open Directory in the main menu. Search by trade, person, or role. Construction group, Personnel, and ancillary region people are listed above the trades.
            Click a person to edit their name, email, phone, photo, trade, crew, role, or dates. Drag the photo so the face sits in the circle, then save. That crop is what the directory and trade team cards show. Add person creates a new oversight entry.
            Sisters can only be Support.
            An end date deactivates that assignment. The person stays listed until someone else in the same role is added with a start date.
          </p>

          <h2>Structure</h2>
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <p className="mb-2"><strong>Trade Team</strong> → The specialty (for example, Electrical)</p>
            <p className="mb-0 ml-4">↳ <strong>Crew</strong> → A crew under that team, with its own overseer, assistant, and support</p>
          </div>

          <h2>Trade team cards</h2>
          <ol>
            <li>Click <strong>Trade Teams</strong> in the main navigation</li>
            <li>Each card is one trade team. It shows the overseer and how many crews it has.</li>
            <li>Open a team to see its crews and the people in each oversight role. Click a name to edit it. The directory has an Open team link on each trade.</li>
          </ol>
          <p>Add or edit a person from the Directory. The cards are for the team and crew structure.</p>

          <h2>➕ Creating a New Trade Team</h2>
          <p><em>Requires: Super Admin or Zone Overseer role</em></p>
          <ol>
            <li>Go to <strong>Trade Teams</strong></li>
            <li>Click <strong>Add Trade Team</strong></li>
            <li>Fill in the required information:
              <ul>
                <li><strong>Team Name</strong> - e.g., "Electrical", "Plumbing", "Carpentry"</li>
                <li><strong>Description</strong> - Brief description of the team's focus</li>
              </ul>
            </li>
            <li>Click <strong>Create Team</strong></li>
          </ol>

          <h2>👷 Managing Crews</h2>
          <h3>Adding a Crew to a Team</h3>
          <ol>
            <li>Open the Trade Team you want to add a crew to</li>
            <li>Click <strong>+ Add Crew</strong></li>
            <li>Enter the crew details:
              <ul>
                <li><strong>Crew Name</strong> - e.g., "Crew A", "Morning Shift"</li>
                <li><strong>Description</strong> - Optional notes about the crew</li>
              </ul>
            </li>
            <li>Click <strong>Create Crew</strong></li>
          </ol>

          <h3>Editing a Crew</h3>
          <ol>
            <li>Click on the crew you want to edit</li>
            <li>Click the <strong>Edit</strong> button</li>
            <li>Make your changes</li>
            <li>Click <strong>Save Changes</strong></li>
          </ol>

          <h2>Changing who is listed</h2>
          <p>On the Directory, use <strong>Add person</strong> or open someone already listed. You can move them across trades, crews, and roles. Sisters can only be Support.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mt-0 mb-3">Related</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/help/getting-started" className="text-blue-600 hover:text-blue-800">
                Getting Started
              </Link>
              <Link href="/help" className="text-blue-600 hover:text-blue-800">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HelpLayout>
  )
}

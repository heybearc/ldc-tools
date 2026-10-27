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
              Trade Teams are groups of skilled volunteers organized by their construction specialty (electrical, plumbing, carpentry, etc.). Each team contains multiple crews that work together on projects.
            </p>
          </div>

          <h2>Directory</h2>
          <p>
            The home page is the Trade Leadership Directory. Search by trade, person, or role.
            Click a person to edit their name, email, phone, trade, crew, role, or dates. Add person creates a new oversight entry.
            Sisters can only be Support.
            An end date deactivates that assignment. The person stays listed until someone else in the same role is added with a start date.
          </p>

          <h2>📋 Understanding the Structure</h2>
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <p className="mb-2"><strong>Trade Team</strong> → The main category (e.g., "Electrical Team")</p>
            <p className="mb-2 ml-4">↳ <strong>Crew</strong> → A working group within the team (e.g., "Electrical Crew A")</p>
            <p className="mb-0 ml-8">↳ <strong>Members</strong> → Individual volunteers assigned to the crew</p>
          </div>

          <h2>👀 Viewing Trade Teams</h2>
          <h3>How to Access</h3>
          <ol>
            <li>Click <strong>Trade Teams</strong> in the main navigation</li>
            <li>You'll see a list of all trade teams</li>
            <li>Click on any team to see its details and crews</li>
          </ol>

          <h3>What You'll See</h3>
          <ul>
            <li><strong>Team Name</strong> - The trade specialty</li>
            <li><strong>Description</strong> - What the team does</li>
            <li><strong>Crew Count</strong> - Number of crews in the team</li>
            <li><strong>Member Count</strong> - Total volunteers in all crews</li>
            <li><strong>Status</strong> - Active or Inactive</li>
          </ul>

          <h2>➕ Creating a New Trade Team</h2>
          <p><em>Requires: Super Admin or Zone Overseer role</em></p>
          <ol>
            <li>Go to <strong>Trade Teams</strong></li>
            <li>Click the <strong>+ New Trade Team</strong> button</li>
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

          <h2>👤 Managing Team Members</h2>
          <h3>Adding Members to a Crew</h3>
          <ol>
            <li>Open the crew you want to add members to</li>
            <li>Click <strong>+ Add Member</strong></li>
            <li>Search for the volunteer by name or email</li>
            <li>Select the volunteer from the results</li>
            <li>Click <strong>Add to Crew</strong></li>
          </ol>

          <h3>Removing Members</h3>
          <ol>
            <li>Open the crew</li>
            <li>Find the member you want to remove</li>
            <li>Click the <strong>Remove</strong> button next to their name</li>
            <li>Confirm the removal</li>
          </ol>

          <h2>🔍 Searching and Filtering</h2>
          <ul>
            <li><strong>Search Box</strong> - Type to find teams by name</li>
            <li><strong>Status Filter</strong> - Show Active, Inactive, or All teams</li>
            <li><strong>Sort Options</strong> - Sort by name, member count, or date created</li>
          </ul>

          <h2>📊 Team Reports</h2>
          <p>View team statistics and reports:</p>
          <ul>
            <li><strong>Member Count</strong> - Total volunteers per team</li>
            <li><strong>Active Projects</strong> - Projects the team is assigned to</li>
            <li><strong>Availability</strong> - Team capacity overview</li>
          </ul>

          <h2>❓ Frequently Asked Questions</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-gray-900 mt-0">Can a volunteer be in multiple crews?</h4>
            <p className="text-gray-600 mb-0">Yes, a volunteer can be assigned to multiple crews across different trade teams based on their skills.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-gray-900 mt-0">What happens when I deactivate a team?</h4>
            <p className="text-gray-600 mb-0">Deactivating a team hides it from active lists but preserves all data. Members remain in the system and can be reassigned.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-gray-900 mt-0">How do I move a member to a different crew?</h4>
            <p className="text-gray-600 mb-0">Remove them from the current crew and add them to the new crew. Their volunteer record stays the same.</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mt-0 mb-3">💡 Related Topics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/help/volunteers" className="text-blue-600 hover:text-blue-800">
                🙋 Volunteer Management
              </Link>
              <Link href="/help/projects" className="text-blue-600 hover:text-blue-800">
                📋 Project Management
              </Link>
              <Link href="/help/getting-started" className="text-blue-600 hover:text-blue-800">
                🚀 Getting Started
              </Link>
              <Link href="/help" className="text-blue-600 hover:text-blue-800">
                📚 Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HelpLayout>
  )
}

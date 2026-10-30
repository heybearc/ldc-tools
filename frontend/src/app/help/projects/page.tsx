import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProjectsHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Projects">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Projects</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Projects</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">What is the projects list?</h2>
            <p className="text-blue-800 mb-0">
              Projects for the construction group you are signed in to. You do not see another group&apos;s projects.
            </p>
          </div>

          <h2>Add a project</h2>
          <p>
            Personnel and a super admin can add a project for this construction group. Open Projects, choose Add project, enter a name, and choose Save project. Number and location are optional.
          </p>

          <h2>See a project</h2>
          <p>
            Open Projects. Each row shows the name, status, number, location, and dates when those are on file.
            A Builder Assistant link appears when the project has one.
          </p>

          <h2>Add a date</h2>
          <p>
            Personnel can add dated work on a project, such as meeting prep. Enter a title, detail, and date, then choose Add date.
            That date stays on the project and also appears on the work list.
          </p>

          <h2>Assign Personnel</h2>
          <p>
            Construction group oversight can add Personnel to a project. Choose a person under Add Personnel, then choose Assign.
            Choose the × next to a name to remove that person. Crews, budget, and congregations are not on this list.
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

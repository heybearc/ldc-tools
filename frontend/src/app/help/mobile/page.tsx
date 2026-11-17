import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MobileHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Mobile app">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Mobile app</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mobile app</h1>

        <div className="prose prose-lg max-w-none">
          <p>
            The website has the install links for the phone and tablet app. Sign in on the website first, then open Mobile app.
          </p>
          <h2>Install it</h2>
          <ol>
            <li>Open Help and choose Mobile app, or open it from the dashboard.</li>
            <li>On an iPhone or iPad, choose Install from App Store. Accept the test in TestFlight, then install LDC Tools.</li>
            <li>On an Android phone, choose Install from Google Play. Sign in with the Google account that was added to the test, then install LDC Tools.</li>
            <li>Open the app and sign in with the same LDC Tools account. Leave the server at ldctools.com.</li>
          </ol>
          <p>
            Downloading the app does not create an account. An administrator creates that account first.
          </p>
          <p>
            <Link href="/mobile">Open the install page</Link>
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}

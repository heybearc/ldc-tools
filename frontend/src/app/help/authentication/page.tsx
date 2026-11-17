import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AuthenticationPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Login & Security">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Login & Security</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔐 Login & Security</h1>

        <div className="prose prose-lg max-w-none">
          {/* Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">Secure Authentication</h2>
            <p className="text-blue-800 mb-0">
              LDC Tools uses NextAuth v4 with industry-standard security practices to keep your account safe.
            </p>
          </div>

          {/* How to Log In */}
          <h2>🚪 How to Log In</h2>
          
          <h3>Step 1: Navigate to Login Page</h3>
          <p>Go to: <code>https://ldctools.com</code></p>

          <h3>Step 2: Enter Credentials</h3>
          <ul>
            <li><strong>Email:</strong> Your assigned email address</li>
            <li><strong>Password:</strong> Your secure password</li>
          </ul>

          <h3>Step 3: Click "Sign In"</h3>
          <p>You'll be redirected to the dashboard automatically.</p>

          {/* Session Management */}
          <h2>⏱️ Session Management</h2>

          <h3>Session Duration</h3>
          <ul>
            <li><strong>Length:</strong> 24 hours</li>
            <li><strong>Auto-Renewal:</strong> No (you'll need to log in again)</li>
            <li><strong>Expiration:</strong> Automatic after 24 hours</li>
          </ul>

          <h3>What Happens When Your Session Expires?</h3>
          <ol>
            <li>You'll be automatically redirected to the login page</li>
            <li>Simply log in again to continue</li>
            <li>Your work is saved (don't worry!)</li>
          </ol>

          {/* How to Log Out */}
          <h2>🚪 How to Log Out</h2>
          <ol>
            <li>Click your name in the top right corner</li>
            <li>Click "Sign Out"</li>
            <li>You'll be redirected to the login page</li>
          </ol>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
            <p className="font-semibold text-yellow-900 mb-2">⚠️ Important</p>
            <p className="text-yellow-800 mb-0">
              Always log out when using a shared or public computer!
            </p>
          </div>

          {/* Security Features */}
          <h2>🔒 Security Features</h2>

          <h3>Password Security</h3>
          <ul>
            <li><strong>Encryption:</strong> Passwords are encrypted with bcrypt (10 rounds)</li>
            <li><strong>Never Stored in Plain Text:</strong> Your password is never visible to anyone</li>
            <li><strong>Secure Transmission:</strong> HTTPS encryption for all data</li>
          </ul>

          <h3>Session Security</h3>
          <ul>
            <li><strong>JWT Tokens:</strong> Industry-standard JSON Web Tokens</li>
            <li><strong>HttpOnly Cookies:</strong> Protected from JavaScript access</li>
            <li><strong>Automatic Expiration:</strong> Sessions expire after 24 hours</li>
          </ul>

          <h3>Role-Based Access</h3>
          <ul>
            <li><strong>Your Role:</strong> {session.user?.role || 'Not assigned'}</li>
            <li><strong>Permissions:</strong> Automatically controlled by your role</li>
            <li><strong>Secure Access:</strong> You can only access features you're authorized for</li>
          </ul>

          {/* Best Practices */}
          <h2>✅ Security Best Practices</h2>

          <div className="space-y-4 my-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mt-0 mb-2">✅ DO</h4>
              <ul className="mb-0 space-y-1">
                <li>Use a strong, unique password</li>
                <li>Log out when finished (especially on shared computers)</li>
                <li>Keep your password confidential</li>
                <li>Use secure networks (avoid public WiFi)</li>
                <li>Update your password if compromised</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mt-0 mb-2">❌ DON'T</h4>
              <ul className="mb-0 space-y-1">
                <li>Share your password with anyone</li>
                <li>Use the same password for multiple sites</li>
                <li>Leave your session open on public computers</li>
                <li>Write your password down where others can see it</li>
                <li>Log in on untrusted devices</li>
              </ul>
            </div>
          </div>

          {/* Troubleshooting */}
          <h2>🔧 Troubleshooting Login Issues</h2>

          <h3>Problem: "Invalid email or password"</h3>
          <p><strong>Solutions:</strong></p>
          <ul>
            <li>Double-check your email address (no typos)</li>
            <li>Verify your password is correct</li>
            <li>Contact your administrator for password reset</li>
            <li>Try clearing your browser cookies</li>
          </ul>

          <h3>Problem: Session expired unexpectedly</h3>
          <p><strong>Solutions:</strong></p>
          <ul>
            <li>Your 24-hour session has ended - simply log in again</li>
            <li>Clear browser cache and cookies</li>
            <li>Try a different browser</li>
          </ul>

          <h3>Problem: Can't access certain features</h3>
          <p><strong>Solutions:</strong></p>
          <ul>
            <li>Check your role - you may not have permission</li>
            <li>Contact your administrator to update your role</li>
            <li>Verify you're logged in correctly</li>
          </ul>

          {/* Password Reset */}
          <h2>🔑 Password Reset</h2>
          <p>If you've forgotten your password:</p>
          <ol>
            <li>On the sign-in screen, choose <strong>Forgot password?</strong></li>
            <li>Enter the email on your account</li>
            <li>Open the reset link in that inbox. It expires in one hour</li>
            <li>Choose a new password, then sign in</li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <p className="font-semibold text-blue-900 mb-2">The reset link is the proof</p>
            <p className="text-blue-800 mb-0">
              The sign-in screen never lets someone type a new password directly. Only the person who can open the email can change it.
            </p>
          </div>

          {/* Browser Compatibility */}
          <h2>🌐 Browser Compatibility</h2>
          <p>For best security and performance, use:</p>
          <ul>
            <li>✅ Chrome (recommended)</li>
            <li>✅ Firefox</li>
            <li>✅ Safari</li>
            <li>✅ Edge</li>
            <li>❌ Internet Explorer (not supported)</li>
          </ul>

          {/* Need Help */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mt-0 mb-3">💬 Need More Help?</h3>
            <p className="mb-4">Check out these resources:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/help/getting-started" className="text-blue-600 hover:text-blue-800">
                🚀 Getting Started
              </Link>
              <Link href="/help/troubleshooting" className="text-blue-600 hover:text-blue-800">
                🔧 Troubleshooting
              </Link>
              <Link href="/release-notes" className="text-blue-600 hover:text-blue-800">
                📋 Release Notes
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

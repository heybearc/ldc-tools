import type { Metadata } from 'next';
import Link from 'next/link';
import SupportForm from './SupportForm';

export const metadata: Metadata = {
  title: 'Support — LDC Tools',
  description: 'Request access to the invite-only LDC Tools app or ask for account help.',
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-blue-800">LDC Tools</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Support</h1>
        <div className="mt-4 space-y-3 text-gray-700 leading-6">
          <p>
            LDC Tools is invite-only. Downloading the app does not create an account.
            If you need access, or you already have an account and cannot sign in, send a note here.
            An administrator replies by email.
          </p>
          <p>
            Signed-in people can delete their own sign-in from My Work in the app.
            Read the <Link href="/privacy" className="font-semibold text-blue-800">privacy policy</Link>.
          </p>
        </div>
        <div className="mt-6">
          <SupportForm />
        </div>
      </article>
    </main>
  );
}

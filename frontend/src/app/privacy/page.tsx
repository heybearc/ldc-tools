import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy policy — LDC Tools',
  description: 'How the LDC Tools app handles account, directory, and chat information.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-blue-800">LDC Tools</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Privacy policy</h1>
        <p className="mt-2 text-sm text-gray-500">Effective November 5, 2026</p>

        <div className="mt-6 space-y-4 text-gray-700 leading-6">
          <p>
            LDC Tools is an invite-only app for a construction group. There is no public signup.
            An administrator creates your account and sends you a sign-in. The app and this site
            are operated at ldctools.com.
          </p>
          <h2 className="pt-2 text-xl font-bold text-gray-900">Information the app uses</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Your name, email address, role, and sign-in. The password is stored only as a hash.</li>
            <li>A sign-in token kept on your device in secure storage so you stay signed in.</li>
            <li>Work assigned to you, projects, and the dates your group keeps for those projects.</li>
            <li>Directory details your group has entered: names, roles, email addresses, phone numbers, and profile photos.</li>
            <li>Chat messages you send and receive with people in your group.</li>
          </ul>
          <p>
            The app does not ask for your location, contacts, camera, or photo library. It does not
            show ads and it does not use a third-party analytics or advertising SDK.
          </p>
          <h2 className="pt-2 text-xl font-bold text-gray-900">Who can see it</h2>
          <p>
            Signed-in members of your construction group can see the directory, project information,
            and group chat. Direct messages are visible to the people in that conversation.
            Administrators of the group can manage accounts. We do not sell this information and we
            do not share it with advertisers.
          </p>
          <h2 className="pt-2 text-xl font-bold text-gray-900">How long it is kept</h2>
          <p>
            Account, directory, work, and chat records stay while the construction group uses LDC Tools.
            Signing out removes the token from that device. Deleting your account turns off your sign-in
            and removes your password. Crew and directory records the group already keeps remain with the group.
          </p>
          <h2 className="pt-2 text-xl font-bold text-gray-900">Chat</h2>
          <p>
            You can report a message and block a person in the app. Reports are sent to the group
            administrators. Blocking hides that person&apos;s messages and stops their chat notifications
            on your account.
          </p>
          <h2 className="pt-2 text-xl font-bold text-gray-900">Children</h2>
          <p>LDC Tools is for invited adults in a construction group. It is not directed at children.</p>
          <h2 className="pt-2 text-xl font-bold text-gray-900">Contact</h2>
          <p>
            To request access, ask a question, or ask for help with your account, use the{' '}
            <Link href="/support" className="font-semibold text-blue-800">support page</Link>.
          </p>
        </div>
      </article>
    </main>
  );
}

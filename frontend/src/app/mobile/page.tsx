import { Smartphone } from 'lucide-react'
import { ANDROID_INSTALL_URL, IOS_INSTALL_URL } from '@/lib/mobile-install'

const stores = [
  {
    name: 'iPhone and iPad',
    store: 'App Store',
    href: IOS_INSTALL_URL,
    steps: [
      'Open this on the iPhone or iPad.',
      'Install TestFlight if Apple asks, then accept the LDC Tools test.',
      'Install the app and sign in with your LDC Tools account.',
    ],
  },
  {
    name: 'Android',
    store: 'Google Play',
    href: ANDROID_INSTALL_URL,
    steps: [
      'Open this on the Android phone.',
      'Sign in with the Google account that was added to the test, then accept it.',
      'Install the app and sign in with your LDC Tools account.',
    ],
  },
]

export default function MobileInstallPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mobile app</h1>
        <p className="mt-2 max-w-2xl text-base text-gray-600 sm:text-lg">
          Install LDC Tools to test it on a phone or tablet. Sign in there with the same account you use on this site.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stores.map((store) => (
          <section key={store.name} className="flex flex-col rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-600 p-3">
                <Smartphone className="h-6 w-6 text-white" aria-hidden />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">{store.name}</h2>
                <p className="text-sm text-gray-500">{store.store}</p>
              </div>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-gray-700">
              {store.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mt-6">
              <a
                href={store.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-md transition-opacity hover:opacity-80"
              >
                <img
                  src={store.name === 'Android' ? '/store/google-play.png' : '/store/app-store.svg'}
                  alt={store.name === 'Android' ? 'Get it on Google Play' : 'Download on the App Store'}
                  className="h-10 w-auto"
                />
              </a>
            </div>
          </section>
        ))}
      </div>

      <p className="text-sm text-gray-600">
        Downloading the app does not create an account. Leave the server at ldctools.com when you sign in.
      </p>
    </div>
  )
}

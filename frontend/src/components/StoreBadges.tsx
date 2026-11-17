import { ANDROID_INSTALL_URL, IOS_INSTALL_URL } from '@/lib/mobile-install'

const badges = [
  {
    href: IOS_INSTALL_URL,
    src: '/store/app-store.svg',
    alt: 'Download on the App Store',
  },
  {
    href: ANDROID_INSTALL_URL,
    src: '/store/google-play.png',
    alt: 'Get it on Google Play',
  },
]

export default function StoreBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {badges.map((badge) => (
        <a
          key={badge.alt}
          href={badge.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-md transition-opacity hover:opacity-80"
        >
          <img src={badge.src} alt={badge.alt} className="h-10 w-auto" />
        </a>
      ))}
    </div>
  )
}

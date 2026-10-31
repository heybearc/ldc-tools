import { Suspense } from 'react'
import SignInForm from './SignInForm'

// Modern Next.js 15 App Router pattern
export default function SignInPage() {
  return (
    <div className="p-5 sm:p-8 bg-white rounded-lg shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <svg width="96" height="96" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="95" fill="#1e40af" stroke="#1e3a8a" strokeWidth="3"/>
            <defs>
              <path id="archPath" d="M 30,100 A 70,70 0 0,1 170,100" />
            </defs>
            <text fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="white" letterSpacing="2">
              <textPath href="#archPath" startOffset="50%" textAnchor="middle">
                LDC TOOLS
              </textPath>
            </text>
            <rect x="50" y="95" width="100" height="55" fill="#e8d4b8" stroke="#c4a57b" strokeWidth="2"/>
            <rect x="45" y="90" width="110" height="8" fill="#9ca3af" stroke="#6b7280" strokeWidth="1.5"/>
            <rect x="45" y="97" width="110" height="2" fill="#6b7280" opacity="0.3"/>
            <rect x="65" y="105" width="25" height="45" fill="#d4bfa0" stroke="#c4a57b" strokeWidth="1.5"/>
            <rect x="68" y="110" width="8" height="35" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
            <rect x="79" y="110" width="8" height="35" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
            <rect x="100" y="105" width="20" height="15" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.5"/>
            <rect x="125" y="105" width="20" height="15" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.5"/>
            <rect x="130" y="125" width="12" height="8" fill="#4f46e5" stroke="#4338ca" strokeWidth="1"/>
            <text x="136" y="131" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" fill="white" textAnchor="middle">JW</text>
            <rect x="50" y="145" width="100" height="5" fill="#dc2626"/>
            <g stroke="#f59e0b" strokeWidth="2" fill="none">
              <line x1="155" y1="95" x2="155" y2="150"/>
              <line x1="162" y1="95" x2="162" y2="150"/>
              <line x1="155" y1="105" x2="162" y2="105"/>
              <line x1="155" y1="120" x2="162" y2="120"/>
              <line x1="155" y1="135" x2="162" y2="135"/>
            </g>
            <g transform="translate(35, 145)">
              <ellipse cx="0" cy="5" rx="7" ry="2.5" fill="#fbbf24"/>
              <path d="M-7 5 L0 -2 L7 5 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
            </g>
            <rect x="165" y="145" width="15" height="8" fill="#dc2626" stroke="#991b1b" strokeWidth="1"/>
            <rect x="170" y="143" width="5" height="2" fill="#6b7280"/>
            <g transform="translate(55, 150)">
              <path d="M0 0 L-3 8 L3 8 Z" fill="#f97316" stroke="#ea580c" strokeWidth="1"/>
              <rect x="-3.5" y="8" width="7" height="2" fill="#1f2937"/>
            </g>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Sign in to LDC Tools
        </h2>
      </div>
      
      <Suspense fallback={
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </div>
  )
}

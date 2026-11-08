import { Suspense } from 'react'
import SignInForm from './SignInForm'

export default function SignInPage() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="bg-[#1e3a8a] px-8 pb-6 pt-8 text-center text-white">
        <img src="/logo.svg" alt="" className="mx-auto h-24 w-24 rounded-full bg-white p-1" />
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">LDC Tools</p>
        <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-blue-100">
          Work, projects, directory, and chat for your construction group.
        </p>
      </div>
      <div className="px-8 py-8">
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
    </div>
  )
}

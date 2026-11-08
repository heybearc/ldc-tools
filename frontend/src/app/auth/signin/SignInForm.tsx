'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

// NextAuth v4 Authentication
export default function SignInForm() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const callbackUrl = searchParams?.get('callbackUrl') || '/'

  async function handleSubmit(formData: FormData) {
    setError('')
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      // Try NextAuth v4 first
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        startTransition(() => {
          router.push(callbackUrl)
          router.refresh()
        })
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          disabled={isPending}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Enter your password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
          disabled={isPending}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full min-h-[44px] py-2 px-4 rounded-md text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 transition-colors ${
          isPending 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-[#1e40af] hover:bg-[#1e3a8a]'
        }`}
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>
      
    </form>
  )
}

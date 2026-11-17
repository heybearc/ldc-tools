'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

// NextAuth v4 Authentication
export default function SignInForm() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<'signin' | 'reset'>('signin')
  const [isPending, startTransition] = useTransition()
  const [resetting, setResetting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  const signedOutMessage = searchParams?.get('message') || ''

  async function handleReset(formData: FormData) {
    setError('')
    setNotice('')
    setResetting(true)
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.get('email') }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'Could not send a reset email. Try again in a few minutes.')
        return
      }
      setNotice(data.message || 'If an account exists for that email, a reset link is on its way.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    if (mode === 'reset') {
      await handleReset(formData)
      return
    }
    setError('')
    setNotice('')
    
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
          disabled={isPending || resetting}
        />
      </div>

      {mode === 'reset' && (
        <p className="text-sm text-gray-600">
          We email a one-time link. The new password is chosen after you open that email, so someone who only knows the address cannot change it.
        </p>
      )}

      {mode === 'signin' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              className="text-sm font-medium text-blue-800 hover:text-blue-950"
              onClick={() => {
                setMode('reset')
                setError('')
                setNotice('')
              }}
            >
              Forgot password?
            </button>
          </div>
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
      )}

      {signedOutMessage && !error && !notice && (
        <div className="text-green-800 text-sm text-center bg-green-50 p-3 rounded-md">
          {signedOutMessage}
        </div>
      )}

      {notice && (
        <div className="text-green-800 text-sm text-center bg-green-50 p-3 rounded-md">
          {notice}
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || resetting}
        className={`w-full min-h-[44px] py-2 px-4 rounded-md text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 transition-colors ${
          isPending || resetting
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-[#1e40af] hover:bg-[#1e3a8a]'
        }`}
      >
        {mode === 'reset'
          ? (resetting ? 'Sending reset link...' : 'Email reset link')
          : (isPending ? 'Signing in...' : 'Sign in')}
      </button>

      {mode === 'reset' && (
        <button
          type="button"
          className="w-full text-sm font-medium text-blue-800 hover:text-blue-950"
          onClick={() => {
            setMode('signin')
            setError('')
            setNotice('')
          }}
        >
          Back to sign in
        </button>
      )}
      
    </form>
  )
}

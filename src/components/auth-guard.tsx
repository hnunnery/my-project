'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading, wait

    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render children (will redirect)
  if (status === 'unauthenticated') {
    return null
  }

  // If authenticated, render children
  return <>{children}</>
}

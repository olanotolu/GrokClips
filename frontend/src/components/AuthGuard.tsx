import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal } from './AuthModal'

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, show auth modal
  if (requireAuth && !user) {
    return (
      <>
        <AuthModal
          isOpen={true}
          onClose={() => {/* AuthGuard doesn't handle closing - app does */}}
          initialMode="signin"
        />
        {/* Show a blurred version of the main content in background */}
        <div className="h-screen w-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome to GrokClips</h2>
            <p className="text-white/60 mb-6">Sign in to start exploring amazing articles</p>
            <div className="text-sm text-white/60">
              Use the modal above to sign in or create an account
            </div>
          </div>
        </div>
      </>
    )
  }

  // User is authenticated or auth is not required
  return <>{children}</>
}

import { useState } from 'react'
import { X, Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { InlineLoader } from './SkeletonCard'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)

  const { signIn, signUp } = useAuth()

  // Real-time validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setEmail(email)
    setEmailValid(validateEmail(email))
    setError('') // Clear error when user starts typing
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    setPassword(password)
    setPasswordValid(validatePassword(password))
    setError('') // Clear error when user starts typing
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Check your email for the confirmation link!')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          onClose()
          resetForm()
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-md relative overflow-hidden">
        <div className="relative z-10 p-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 active:scale-95 touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === 'signin'
                ? 'Sign in to your GrokClips account'
                : 'Join GrokClips and start exploring'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                Email
                {email && (
                  emailValid ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )
                )}
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  emailValid ? 'text-green-400' : email ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your@email.com"
                  className={`w-full bg-black/50 border text-white px-4 py-4 pl-12 pr-12 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-base ${
                    emailValid
                      ? 'border-green-500 focus:ring-green-500/50 focus:border-green-500'
                      : email
                        ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                        : 'border-gray-700 focus:ring-white/50 focus:border-white/50'
                  }`}
                  style={{ minHeight: '48px' }}
                  required
                />
                {email && emailValid && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                )}
              </div>
              {email && !emailValid && (
                <p className="text-red-400 text-xs mt-1">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                Password
                {password && (
                  passwordValid ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )
                )}
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  passwordValid ? 'text-green-400' : password ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={`w-full bg-black/50 border text-white px-4 py-4 pl-12 pr-16 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-base ${
                    passwordValid
                      ? 'border-green-500 focus:ring-green-500/50 focus:border-green-500'
                      : password
                        ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                        : 'border-gray-700 focus:ring-white/50 focus:border-white/50'
                  }`}
                  style={{ minHeight: '48px' }}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {password && passwordValid && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {password && !passwordValid && (
                <p className="text-red-400 text-xs mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-gray-700 text-white px-4 py-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-base"
                    style={{ minHeight: '48px' }}
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !emailValid || !passwordValid || (mode === 'signup' && password !== confirmPassword)}
              className={`w-full font-semibold py-4 rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation ${
                emailValid && passwordValid && (mode === 'signin' || password === confirmPassword)
                  ? 'bg-white text-black hover:bg-gray-200 hover:scale-105'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
              style={{ minHeight: '48px' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <InlineLoader size="sm" className="border-black border-t-transparent" />
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'
              }
            </button>
          </div>

          {mode === 'signin' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  const email = prompt('Enter your email address:')
                  if (email) {
                    // TODO: Implement password reset
                    alert('Password reset functionality coming soon!')
                  }
                }}
                className="text-gray-500 hover:text-gray-400 transition-colors text-xs"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

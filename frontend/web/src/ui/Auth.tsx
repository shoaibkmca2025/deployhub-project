import React, { useState, useEffect } from 'react'
import { apiPost, testConnection } from './api'

export default function Auth({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('signup')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      const result = await testConnection()
      setConnectionStatus(result.success ? 'connected' : 'disconnected')
    }
    
    checkConnection()
    
    // Check if already authenticated
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token is still valid by making a test request to a protected endpoint
      const serverOrigin = (import.meta as any).env?.VITE_SERVER_ORIGIN || 
        (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'http://localhost:4000'
          : `${location.protocol}//${location.hostname}:4000`)
      
      fetch(`${serverOrigin}/api/deployments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          if (response.ok) {
            onAuthed()
          } else {
            // Token is invalid or expired, clear it
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        })
        .catch(() => {
          // Server not reachable, clear auth
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
    }
  }, [onAuthed])

  useEffect(() => {
    // Calculate password strength
    if (password.length === 0) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (password.length >= 6) strength += 1
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
    setPasswordStrength(strength)
  }, [password])

  async function submit() {
    try {
      setError('')
      setLoading(true)
      
      // Basic validation
      if (!email || !password) {
        setError('Please fill in all fields')
        return
      }
      
      if (mode === 'signup' && password.length < 6) {
        setError('Password must be at least 6 characters long')
        return
      }
      
      // Test connection first
      const connectionTest = await testConnection()
      if (!connectionTest.success) {
        setError(`Cannot connect to server at ${connectionTest.serverOrigin}. Please check if the backend server is running.`)
        return
      }
      
      const res = await apiPost(mode === 'signup' ? '/api/signup' : '/api/login', { email, password })
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      onAuthed()
    } catch (e: any) {
      console.error('Authentication error:', e)
      setError(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      submit()
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'text-red-400'
    if (passwordStrength <= 4) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 4) return 'Medium'
    return 'Strong'
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="glass-effect rounded-xl p-8 border border-cyan-400/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-amber-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-900 font-bold text-2xl">DH</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">DeployHub</h1>
            <p className="text-gray-400">Deploy applications on your own hardware</p>
            
            {/* Connection Status */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' : 
                connectionStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
              }`}></div>
              <span className={`text-sm ${
                connectionStatus === 'connected' ? 'text-green-400' : 
                connectionStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Connected to server' : 
                 connectionStatus === 'checking' ? 'Checking connection...' : 'Server offline'}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none text-white placeholder-gray-400"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none text-white placeholder-gray-400"
                disabled={loading}
              />
              {mode === 'signup' && password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Password strength:</span>
                    <span className={getPasswordStrengthColor()}>{getPasswordStrengthText()}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength <= 2 ? 'bg-red-400' : 
                        passwordStrength <= 4 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${(passwordStrength / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || !email || !password}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>

            <div className="text-center">
              <button
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                disabled={loading}
              >
                {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


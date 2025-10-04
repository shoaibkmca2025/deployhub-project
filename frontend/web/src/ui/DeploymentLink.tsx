import React, { useState } from 'react'
import { apiPost } from './api'

interface DeploymentLinkProps {
  repoUrl: string
  branch?: string
  buildCommand?: string
  startCommand?: string
  env?: Record<string, string>
  onClose: () => void
}

export default function DeploymentLink({ 
  repoUrl, 
  branch = 'main', 
  buildCommand = 'npm install', 
  startCommand = 'npm start', 
  env = {},
  onClose 
}: DeploymentLinkProps) {
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generateLink() {
    try {
      setLoading(true)
      setError('')
      
      const response = await apiPost('/api/generate-link', {
        repoUrl,
        branch,
        buildCommand,
        startCommand,
        env
      })
      
      setGeneratedLink(response.deploymentUrl)
    } catch (e: any) {
      setError(e.message || 'Failed to generate deployment link')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = generatedLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({
        title: 'DeployHub Deployment Link',
        text: `Deploy ${repoUrl} on DeployHub`,
        url: generatedLink
      })
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-effect rounded-xl p-8 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Generate Deployment Link</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Repository Info */}
          <div className="p-4 bg-slate-800 rounded-lg">
            <h3 className="font-semibold mb-2">Repository Configuration</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">Repository:</span> {repoUrl}</div>
              <div><span className="text-gray-400">Branch:</span> {branch}</div>
              <div><span className="text-gray-400">Build Command:</span> {buildCommand}</div>
              <div><span className="text-gray-400">Start Command:</span> {startCommand}</div>
              {Object.keys(env).length > 0 && (
                <div>
                  <span className="text-gray-400">Environment Variables:</span>
                  <div className="ml-4 mt-1">
                    {Object.entries(env).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        {key}={value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generate Link Section */}
          {!generatedLink ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Generate a shareable link that allows anyone to deploy this repository 
                with the configured settings. The link will be valid for 24 hours.
              </p>
              
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={generateLink}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Link...' : 'Generate Deployment Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 font-semibold">Link Generated Successfully!</span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Share this link with anyone to deploy the repository instantly.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Deployment Link
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={shareLink}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Share Link
                </button>
                <button
                  onClick={() => {
                    setGeneratedLink('')
                    setError('')
                  }}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  Generate New
                </button>
              </div>

              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm">
                    <p className="text-amber-400 font-semibold mb-1">Important Notes:</p>
                    <ul className="text-gray-300 space-y-1">
                      <li>• This link expires in 24 hours</li>
                      <li>• Anyone with the link can deploy this repository</li>
                      <li>• The deployment will use the configured settings above</li>
                      <li>• Make sure the repository is public or accessible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

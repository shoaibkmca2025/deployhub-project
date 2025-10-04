import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet, apiPost, serverOrigin } from './api'

export default function DeployPage() {
  const { linkId } = useParams<{ linkId: string }>()
  const [config, setConfig] = useState<any>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    if (!linkId) {
      setError('Invalid deployment link')
      setLoading(false)
      return
    }

    loadDeploymentConfig()
  }, [linkId])

  async function loadDeploymentConfig() {
    try {
      const response = await fetch(`${serverOrigin}/api/deploy/${linkId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load deployment configuration')
      }
      
      setConfig(data.config)
      setAgents(data.agents)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function deploy() {
    if (!selectedAgent) {
      setError('Please select an agent')
      return
    }

    try {
      setDeploying(true)
      setError('')
      
      const response = await apiPost('/api/deploy', {
        agentId: selectedAgent,
        repoUrl: config.repoUrl,
        branch: config.branch,
        buildCommand: config.buildCommand,
        startCommand: config.startCommand,
        env: config.env
      })
      
      setLogs(prev => [...prev, `[${new Date().toISOString()}] Deployment started successfully!`])
      setLogs(prev => [...prev, `[${new Date().toISOString()}] Deployment ID: ${response.deployment.id}`])
      
      // Simulate deployment progress
      setTimeout(() => {
        setLogs(prev => [...prev, `[${new Date().toISOString()}] Deployment completed!`])
        setDeploying(false)
      }, 3000)
      
    } catch (e: any) {
      setError(e.message || 'Deployment failed')
      setDeploying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading deployment configuration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center">
        <div className="glass-effect rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Deployment Link Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Go to DeployHub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-amber-400 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">DH</span>
              </div>
              <span className="text-xl font-bold">DeployHub</span>
            </div>
            <div className="text-sm text-gray-400">Quick Deploy</div>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">Quick Deploy</h1>
            <p className="text-xl text-gray-300">Deploy this repository with one click</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Repository Info */}
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Repository Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Repository</label>
                  <p className="text-white font-mono text-sm break-all">{config.repoUrl}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Branch</label>
                  <p className="text-white">{config.branch}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Build Command</label>
                  <p className="text-white font-mono text-sm">{config.buildCommand}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Start Command</label>
                  <p className="text-white font-mono text-sm">{config.startCommand}</p>
                </div>
                {Object.keys(config.env || {}).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Environment Variables</label>
                    <div className="space-y-1">
                      {Object.entries(config.env).map(([key, value]) => (
                        <div key={key} className="text-white font-mono text-sm">
                          {key}={String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Deployment Controls */}
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Deploy Now</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Agent</label>
                  <select
                    value={selectedAgent}
                    onChange={e => setSelectedAgent(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"
                    disabled={deploying}
                  >
                    <option value="">Choose an agent...</option>
                    {agents.filter(a => a.status === 'online').map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.specs?.cpuCount || 0} CPU, {agent.specs?.memory?.totalMb || 0}MB)
                      </option>
                    ))}
                  </select>
                </div>

                {agents.filter(a => a.status === 'online').length === 0 && (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-400 text-sm">
                      No agents are currently online. Please wait for an agent to come online or contact the administrator.
                    </p>
                  </div>
                )}

                <button
                  onClick={deploy}
                  disabled={!selectedAgent || deploying || agents.filter(a => a.status === 'online').length === 0}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deploying ? 'Deploying...' : 'Deploy Repository'}
                </button>
              </div>

              {/* Logs */}
              {logs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Deployment Logs</h3>
                  <div className="bg-slate-800 p-4 rounded-lg h-48 overflow-y-auto">
                    <pre className="text-green-400 text-sm font-mono">
                      {logs.join('\n')}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

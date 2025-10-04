import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import Auth from './Auth'
import { apiDelete, apiGet, apiPost, apiPut, serverOrigin } from './api'
import EnvEditor from './EnvEditor'

type Agent = {
  id: string
  name: string
  status: 'online' | 'offline'
  specs?: any
  lastSeen?: number
}

type Deployment = {
  id: string
  name: string
  repoUrl: string
  status: 'running' | 'building' | 'stopped' | 'succeeded' | 'failed'
  agentId: string
  logs: string[]
  env: Record<string, string>
  buildCommand?: string
  startCommand?: string
  createdAt: number
  updatedAt: number
}

export default function App() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null)
  const [logLines, setLogLines] = useState<string[]>([])
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem('token'))
  const [user, setUser] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'hardware' | 'logs'>('overview')
  
  // Deployment modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [buildCommand, setBuildCommand] = useState('')
  const [startCommand, setStartCommand] = useState('')
  const [targetAgents, setTargetAgents] = useState<string[]>([])
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null)
  
  // Environment editor state
  const [envOpen, setEnvOpen] = useState(false)
  const [envTarget, setEnvTarget] = useState<Deployment | null>(null)
  
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Load user data
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Test server connection first
    const testConnection = async () => {
      try {
        const response = await fetch(`${serverOrigin}/api/status`)
        if (response.ok) {
          setConnectionStatus('connected')
          setError('')
        } else {
          setConnectionStatus('disconnected')
          setError('Server is not responding properly')
        }
      } catch (error) {
        setConnectionStatus('disconnected')
        setError('Cannot connect to server. Please check if the server is running.')
      }
    }

    testConnection()

    const socket = io(serverOrigin, { 
      transports: ['websocket', 'polling'], 
      query: { kind: 'dashboard' },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    })
    
    socketRef.current = socket
    
    socket.on('connect', () => {
      setConnectionStatus('connected')
      setError('')
    })
    
    socket.on('disconnect', () => {
      setConnectionStatus('disconnected')
    })
    
    socket.on('connect_error', (error) => {
      setConnectionStatus('disconnected')
      setError('WebSocket connection failed. Please check if the server is running.')
    })
    
    socket.on('dashboard:agents', (list: Agent[]) => {
      setAgents(list)
      setError('')
    })
    
    socket.on('dashboard:deployment-log', ({ deploymentId, line }: any) => {
      setLogLines((prev) => selectedDeployment === deploymentId ? [...prev, line] : prev)
    })
    
    socket.on('dashboard:deployment-status', ({ deploymentId, status }: any) => {
      if (selectedDeployment === deploymentId) {
        setLogLines((prev) => [...prev, `[${new Date().toISOString()}] [dashboard] Status: ${status}`])
      }
      // Refresh deployments when status changes
      if (authed) {
        refreshDeployments()
      }
    })
    
    return () => { 
      socket.disconnect() 
    }
  }, [selectedDeployment, authed])

  const onlineAgents = useMemo(() => agents.filter(a => a.status === 'online'), [agents])
  const runningDeployments = useMemo(() => deployments.filter(d => d.status === 'running' || d.status === 'succeeded'), [deployments])
  const successRate = useMemo(() => {
    const total = deployments.length
    const successful = deployments.filter(d => d.status === 'succeeded').length
    return total > 0 ? Math.round((successful / total) * 100) : 0
  }, [deployments])

  async function refreshDeployments() {
    if (!authed) return
    try {
      const data = await apiGet('/api/deployments')
      setDeployments(data.deployments)
    } catch (e: any) {
      if (e.message.includes('unauthorized') || e.message.includes('Invalid token')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuthed(false)
        setError('Session expired. Please log in again.')
      } else {
        setError('Failed to load deployments')
      }
    }
  }

  async function createDeployment() {
    if (!repoUrl || targetAgents.length === 0) {
      setError('Please select at least one agent and provide a repository URL')
      return
    }
    
    // Validate GitHub URL
    const githubUrlRegex = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(\.git)?$/
    if (!githubUrlRegex.test(repoUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      // Create deployment for each selected agent
      await Promise.all(targetAgents.map(agentId => 
        apiPost('/api/deploy', { 
          agentId, 
          repoUrl, 
          branch,
          buildCommand: buildCommand || undefined,
          startCommand: startCommand || undefined,
          env: envVars
        })
      ))
      
      setModalOpen(false)
      setRepoUrl('')
      setBranch('main')
      setBuildCommand('')
      setStartCommand('')
      setTargetAgents([])
      setEnvVars({})
      setAiSuggestion(null)
      
      await refreshDeployments()
    } catch (e: any) {
      setError(e.message || 'Failed to create deployment')
    } finally {
      setLoading(false)
    }
  }

  async function act(deploymentId: string, action: 'start'|'stop'|'restart') {
    try {
      setLoading(true)
      await apiPost(`/api/deployments/${deploymentId}/action`, { action })
      await refreshDeployments()
    } catch (e: any) {
      if (e.message.includes('unauthorized') || e.message.includes('Invalid token')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuthed(false)
        setError('Session expired. Please log in again.')
      } else {
        setError(`Failed to ${action} deployment: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function removeDeployment(deploymentId: string) {
    try {
      setLoading(true)
      await apiDelete(`/api/deployments/${deploymentId}`)
      if (selectedDeployment === deploymentId) setSelectedDeployment(null)
      await refreshDeployments()
    } catch (e: any) {
      if (e.message.includes('unauthorized') || e.message.includes('Invalid token')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuthed(false)
        setError('Session expired. Please log in again.')
      } else {
        setError(`Failed to delete deployment: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  function openEnv(dep: Deployment) {
    setEnvTarget(dep)
    setEnvOpen(true)
  }

  async function saveEnv(env: Record<string,string>) {
    if (!envTarget) return
    await apiPut(`/api/deployments/${envTarget.id}/env`, { env })
    await refreshDeployments()
  }

  async function aiSuggest() {
    if (!repoUrl) { 
      setError('Please enter a GitHub repository URL first')
      return 
    }
    try {
      const res = await apiPost('/api/ai/suggest', { repoUrl })
      setAiSuggestion(res.suggestion)
      if (res.suggestion.buildCommand) setBuildCommand(res.suggestion.buildCommand)
      if (res.suggestion.startCommand) setStartCommand(res.suggestion.startCommand)
    } catch (e: any) {
      setAiSuggestion({ error: e.message || 'Failed to fetch suggestion' })
    }
  }

  function addEnvVar() {
    const key = prompt('Environment variable name:')
    const value = prompt('Environment variable value:')
    if (key && value) {
      setEnvVars(prev => ({ ...prev, [key]: value }))
    }
  }

  function removeEnvVar(key: string) {
    setEnvVars(prev => {
      const newEnv = { ...prev }
      delete newEnv[key]
      return newEnv
    })
  }

  function logHints(lines: string[]): string[] {
    const l = lines.join('\n').toLowerCase()
    const hints: string[] = []
    if (l.includes('eaddrinuse')) hints.push('Port in use: try changing port or stop previous process.')
    if (l.includes('command not found') || l.includes('npm: not found')) hints.push('Missing runtime: ensure Node.js/npm installed on agent.')
    if (l.includes('permission denied')) hints.push('Permission issue: check file permissions or run without sudo-sensitive steps.')
    if (l.includes('fatal: could not read from remote repository')) hints.push('Git auth required: use public repo or provide read access.')
    if (hints.length === 0) hints.push('No obvious errors detected.')
    return hints
  }

  // Clear any invalid tokens on component mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch(`${serverOrigin}/api/status`)
        .then(response => {
          if (!response.ok) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setAuthed(false)
          }
        })
        .catch(() => {
          // Server not reachable, but don't clear auth yet
        })
    }
  }, [])

  if (!authed) return <Auth onAuthed={()=>{ setAuthed(true); refreshDeployments(); }} />

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-amber-400 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">DH</span>
              </div>
              <span className="text-xl font-bold">DeployHub</span>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('deployments')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'deployments' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
              >
                Deployments
              </button>
              <button 
                onClick={() => setActiveTab('hardware')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'hardware' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
              >
                Hardware
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'logs' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                }`}
              >
                Logs
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm text-gray-400">
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              {user && <div className="text-sm text-gray-400">Welcome, {user.email}</div>}
              <button 
                onClick={()=>{ 
                  localStorage.removeItem('token'); 
                  localStorage.removeItem('user'); 
                  setAuthed(false); 
                  setError('');
                }} 
                className="px-3 py-1 text-sm border border-gray-600 rounded hover:border-gray-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="fixed top-20 left-4 right-4 z-40 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-effect rounded-xl p-8 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <span className="text-white">Processing...</span>
          </div>
        </div>
      )}

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-6">DeployHub Dashboard</h1>
                <p className="text-xl text-gray-300">Deploy applications on your own hardware</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <Metric label="Active Deployments" value={String(runningDeployments.length)} color="text-cyan-400"/>
                <Metric label="Connected Devices" value={String(onlineAgents.length)} color="text-amber-400"/>
                <Metric label="Success Rate" value={`${successRate}%`} color="text-green-400"/>
                <Metric label="Total Builds" value={String(deployments.length)} color="text-purple-400"/>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={() => setModalOpen(true)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all"
                    >
                      New Deployment
                    </button>
                    <button 
                      onClick={() => setActiveTab('hardware')}
                      className="w-full px-6 py-3 border border-amber-400 text-amber-400 rounded-lg hover:bg-amber-400 hover:text-slate-900 transition-all"
                    >
                      Manage Hardware
                    </button>
                    <button 
                      onClick={() => setActiveTab('deployments')}
                      className="w-full px-6 py-3 border border-green-400 text-green-400 rounded-lg hover:bg-green-400 hover:text-slate-900 transition-all"
                    >
                      View Deployments
                    </button>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Server Status</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {connectionStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Online Agents</span>
                      <span className="text-cyan-400">{onlineAgents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Running Deployments</span>
                      <span className="text-green-400">{runningDeployments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Server URL</span>
                      <span className="text-xs text-gray-400">{serverOrigin}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Deployments Tab */}
          {activeTab === 'deployments' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Deployments</h2>
                <button 
                  onClick={() => setModalOpen(true)}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700"
                >
                  New Deployment
                </button>
              </div>
              
              <div className="space-y-4">
                {deployments.map(d => (
                  <div key={d.id} className="glass-effect rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{d.name}</h3>
                        <p className="text-sm text-gray-400">{d.repoUrl}</p>
                        <p className="text-xs text-gray-500">Branch: {d.branch || 'main'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          d.status === 'succeeded' || d.status === 'running' ? 'bg-green-500/20 text-green-400' : 
                          d.status === 'building' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {d.status}
                        </span>
                        <button 
                          onClick={() => setSelectedDeployment(d.id)}
                          className="px-3 py-1 text-xs border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-400 hover:text-slate-900"
                        >
                          View Logs
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => act(d.id, 'start')} 
                        className="px-3 py-1 text-xs border border-green-400 text-green-400 rounded hover:bg-green-400 hover:text-slate-900"
                      >
                        Start
                      </button>
                      <button 
                        onClick={() => act(d.id, 'stop')} 
                        className="px-3 py-1 text-xs border border-red-400 text-red-400 rounded hover:bg-red-400 hover:text-slate-900"
                      >
                        Stop
                      </button>
                      <button 
                        onClick={() => act(d.id, 'restart')} 
                        className="px-3 py-1 text-xs border border-amber-400 text-amber-400 rounded hover:bg-amber-400 hover:text-slate-900"
                      >
                        Restart
                      </button>
                      <button 
                        onClick={() => openEnv(d)} 
                        className="px-3 py-1 text-xs border border-purple-400 text-purple-400 rounded hover:bg-purple-400 hover:text-slate-900"
                      >
                        Environment
                      </button>
                      <button 
                        onClick={() => removeDeployment(d.id)} 
                        className="px-3 py-1 text-xs border border-red-600 text-red-400 rounded hover:bg-red-600 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {deployments.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-lg mb-4">No deployments yet</p>
                    <button 
                      onClick={() => setModalOpen(true)}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700"
                    >
                      Create Your First Deployment
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Hardware Status</h2>
                <button 
                  onClick={() => refreshDeployments()}
                  className="px-4 py-2 text-cyan-400 hover:text-cyan-300 border border-cyan-400 rounded-lg"
                >
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map(agent => (
                  <div key={agent.id} className="glass-effect rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <p className="text-sm text-gray-400">
                          {agent.specs?.cpuCount || 0} CPU cores, {agent.specs?.memory?.totalMb || 0}MB RAM
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        agent.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Status</span>
                        <span className={agent.status === 'online' ? 'text-green-400' : 'text-red-400'}>
                          {agent.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">CPU Cores</span>
                        <span className="text-cyan-400">{agent.specs?.cpuCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Memory</span>
                        <span className="text-amber-400">{agent.specs?.memory?.totalMb || 0}MB</span>
                      </div>
                      {agent.lastSeen && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Last Seen</span>
                          <span className="text-gray-400">
                            {new Date(agent.lastSeen).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {agents.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <p className="text-lg mb-4">No agents connected</p>
                    <p className="text-sm">Install the DeployHub agent on your devices to get started</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Deployment Logs</h2>
                <div className="flex items-center gap-4">
                  <select 
                    value={selectedDeployment || ''} 
                    onChange={(e) => setSelectedDeployment(e.target.value || null)}
                    className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="">Select a deployment</option>
                    {deployments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setLogLines([])}
                    className="px-4 py-2 text-red-400 hover:text-red-300 border border-red-400 rounded-lg"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>
              
              <div className="glass-effect rounded-xl p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Live Logs</h3>
                  {selectedDeployment ? (
                    <p className="text-sm text-gray-400">
                      Showing logs for: {deployments.find(d => d.id === selectedDeployment)?.name}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Select a deployment to view its logs</p>
                  )}
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4 h-96 overflow-y-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    {logLines.length > 0 ? logLines.join('\n') : 'No logs available'}
                  </pre>
                </div>
                
                {logLines.length > 0 && (
                  <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Hints</h4>
                    <ul className="text-sm space-y-1">
                      {logHints(logLines).map((hint, i) => (
                        <li key={i} className="text-gray-300">• {hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* New Deployment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-effect rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">New Deployment</h2>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Repository Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Repository Configuration</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub Repository URL</label>
                    <input 
                      type="text"
                      value={repoUrl} 
                      onChange={e => setRepoUrl(e.target.value)} 
                      placeholder="https://github.com/username/repository" 
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Branch</label>
                    <input 
                      type="text"
                      value={branch} 
                      onChange={e => setBranch(e.target.value)} 
                      placeholder="main" 
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={aiSuggest}
                    className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
                  >
                    AI Suggest Configuration
                  </button>
                  
                  {aiSuggestion && (
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Suggestion</h4>
                      {'error' in aiSuggestion ? (
                        <div className="text-red-400 text-sm">{aiSuggestion.error}</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Runtime: <span className="text-cyan-400">{aiSuggestion.runtime}</span></div>
                          <div>Port: <span className="text-amber-400">{aiSuggestion.port}</span></div>
                          <div className="col-span-2">Build: <code className="text-xs text-gray-300">{aiSuggestion.buildCommand || 'n/a'}</code></div>
                          <div className="col-span-2">Start: <code className="text-xs text-gray-300">{aiSuggestion.startCommand}</code></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Build Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Build Configuration</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">Build Command</label>
                    <input 
                      type="text"
                      value={buildCommand} 
                      onChange={e => setBuildCommand(e.target.value)} 
                      placeholder="npm install && npm run build" 
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Command</label>
                    <input 
                      type="text"
                      value={startCommand} 
                      onChange={e => setStartCommand(e.target.value)} 
                      placeholder="npm start" 
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Target Agents */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Target Devices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {onlineAgents.map(agent => (
                      <label key={agent.id} className="flex items-center gap-2 p-3 rounded-lg border border-slate-600 hover:border-cyan-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetAgents.includes(agent.id)}
                          onChange={(e) => {
                            setTargetAgents(prev => 
                              e.target.checked 
                                ? [...prev, agent.id] 
                                : prev.filter(id => id !== agent.id)
                            )
                          }}
                          className="text-cyan-400 focus:ring-cyan-400"
                        />
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-gray-400">
                            {agent.specs?.cpuCount || 0} CPU, {agent.specs?.memory?.totalMb || 0}MB
                          </div>
                        </div>
                      </label>
                    ))}
                    {onlineAgents.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-400">
                        No agents online. Please connect some devices first.
                      </div>
                    )}
                  </div>
                </div>

                {/* Environment Variables */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Environment Variables</h3>
                    <button 
                      onClick={addEnvVar}
                      className="px-3 py-1 text-sm border border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-slate-900"
                    >
                      Add Variable
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(envVars).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <input 
                          type="text" 
                          value={key} 
                          readOnly
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-400"
                        />
                        <input 
                          type="text" 
                          value={value} 
                          readOnly
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-400"
                        />
                        <button 
                          onClick={() => removeEnvVar(key)}
                          className="px-3 py-2 text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {Object.keys(envVars).length === 0 && (
                      <p className="text-gray-400 text-sm">No environment variables added</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-600">
                  <button 
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={createDeployment}
                    disabled={!repoUrl || targetAgents.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Deployment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <EnvEditor open={envOpen} initialEnv={envTarget?.env || {}} onClose={()=>setEnvOpen(false)} onSave={saveEnv} />
    </div>
  )
}

function Metric({ label, value, color }: {label: string, value: string, color: string}) {
  return (
    <div className="metric-card p-6 rounded-xl border border-cyan-400/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-lg">●</span>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
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
}

export default function App() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [repoUrl, setRepoUrl] = useState('')
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null)
  const [logLines, setLogLines] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [deployments, setDeployments] = useState<any[]>([])
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem('token'))
  const [envOpen, setEnvOpen] = useState(false)
  const [envTarget, setEnvTarget] = useState<any | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

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

  async function deploy(agentId: string) {
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL')
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
      const data = await apiPost('/api/deploy', { agentId, repoUrl })
      setSelectedDeployment(data.deployment.id)
      setLogLines((prev) => [...prev, `[${new Date().toISOString()}] [dashboard] Deployment ${data.deployment.id} started...`])
      await refreshDeployments()
    } catch (e: any) {
      setError(e.message || 'Failed to start deployment')
    } finally {
      setLoading(false)
    }
  }

  const onlineAgents = useMemo(() => agents.filter(a => a.status === 'online'), [agents])

  async function refreshDeployments() {
    if (!authed) return
    try {
      const data = await apiGet('/api/deployments')
      setDeployments(data.deployments)
    } catch (e: any) {
      if (e.message.includes('unauthorized') || e.message.includes('Invalid token')) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuthed(false)
        setError('Session expired. Please log in again.')
      } else {
        setError('Failed to load deployments')
      }
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

  function openEnv(dep: any) {
    setEnvTarget(dep)
    setEnvOpen(true)
  }

  async function saveEnv(env: Record<string,string>) {
    if (!envTarget) return
    await apiPut(`/api/deployments/${envTarget.id}/env`, { env })
    await refreshDeployments()
  }

  async function aiSuggest() {
    if (!repoUrl) { alert('Enter GitHub repo URL'); return }
    try {
      const res = await apiPost('/api/ai/suggest', { repoUrl })
      setAiSuggestion(res.suggestion)
    } catch (e: any) {
      setAiSuggestion({ error: e.message || 'Failed to fetch suggestion' })
    }
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
      // Test if token is valid by making a simple request
      fetch(`${serverOrigin}/api/status`)
        .then(response => {
          if (!response.ok) {
            // Clear invalid data
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
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-amber-400 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">DH</span>
              </div>
              <span className="text-xl font-bold">DeployHub</span>
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
              <div className="text-sm text-gray-400">Server: {serverOrigin}</div>
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
              <button 
                onClick={()=>{ 
                  localStorage.clear();
                  setAuthed(false);
                  setError('');
                  window.location.reload();
                }} 
                className="px-3 py-1 text-sm border border-red-600 text-red-400 rounded hover:border-red-400"
                title="Clear all data and restart"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">DeployHub Dashboard</h1>
            <p className="text-xl text-gray-300">Deploy applications on your own hardware</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Metric label="Active Deployments" value={String(deployments.filter(d=>d.status==='running' || d.status==='succeeded').length)} color="text-cyan-400"/>
            <Metric label="Connected Devices" value={String(onlineAgents.length)} color="text-amber-400"/>
            <Metric label="Success Rate" value={`${Math.round((deployments.filter(d=>d.status==='succeeded').length / Math.max(1, deployments.length))*100)}%`} color="text-green-400"/>
            <Metric label="Total Builds" value={String(deployments.length)} color="text-amber-400"/>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Agents & Deployments</h2>
            </div>
            
            <div className="space-y-6">
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Connected Agents</h3>
                <div className="space-y-3">
                  {agents.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-sm text-gray-400">{a.specs?.cpuCount || 0} CPU, {a.specs?.memory?.totalMb || 0}MB</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${a.status==='online'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{a.status}</span>
                        <button 
                          onClick={() => deploy(a.id)} 
                          disabled={a.status !== 'online' || loading || !repoUrl} 
                          className="px-3 py-1 bg-cyan-500 text-white rounded text-sm disabled:opacity-50 hover:bg-cyan-600 transition-colors"
                        >
                          {loading ? 'Deploying...' : 'Deploy'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {agents.length===0 && <div className="text-gray-400">No agents connected</div>}
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Deployments</h3>
                <div className="space-y-3">
                  {deployments.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <div className="font-medium">{d.name}</div>
                        <div className="text-sm text-gray-400">{d.repoUrl}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${d.status==='succeeded'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{d.status}</span>
                        <button onClick={()=>act(d.id,'start')} className="px-2 py-1 text-xs border rounded">Start</button>
                        <button onClick={()=>act(d.id,'stop')} className="px-2 py-1 text-xs border rounded">Stop</button>
                        <button onClick={()=>act(d.id,'restart')} className="px-2 py-1 text-xs border rounded">Restart</button>
                        <button onClick={()=>openEnv(d)} className="px-2 py-1 text-xs border rounded">Env</button>
                        <button onClick={()=>removeDeployment(d.id)} className="px-2 py-1 text-xs border rounded text-red-400">Delete</button>
                      </div>
                    </div>
                  ))}
                  {deployments.length===0 && <div className="text-gray-400">No deployments yet</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">New Deployment</h3>
              <div className="space-y-4">
                <input placeholder="https://github.com/user/repo.git" value={repoUrl} onChange={e=>setRepoUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                <button onClick={aiSuggest} className="w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30">AI Suggest</button>
                {aiSuggestion && (
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">AI Suggestion</div>
                    {'error' in aiSuggestion ? (
                      <div className="text-red-400 text-sm">{aiSuggestion.error}</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Runtime: <b>{aiSuggestion.runtime}</b></div>
                        <div>Port: <b>{aiSuggestion.port}</b></div>
                        <div>Build: <code className="text-xs">{aiSuggestion.build || 'n/a'}</code></div>
                        <div>Start: <code className="text-xs">{aiSuggestion.start}</code></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Logs</h3>
              <pre className="bg-slate-800 p-3 rounded-lg text-sm h-48 overflow-auto text-green-400">{logLines.join('\n')}</pre>
              <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">AI Hints</div>
                <ul className="text-sm space-y-1">
                  {logHints(logLines).map((h,i)=> <li key={i}>{h}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EnvEditor open={envOpen} initialEnv={envTarget?.env || {}} onClose={()=>setEnvOpen(false)} onSave={saveEnv} />
    </div>
  )
}

function Metric({ label, value, color }:{label:string, value:string, color:string}){
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


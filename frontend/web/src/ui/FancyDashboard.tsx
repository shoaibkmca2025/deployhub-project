import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { apiGet, apiPost, apiDelete, serverOrigin } from './api'

type Agent = { id: string; name: string; status: 'online'|'offline'; specs?: any }

export default function FancyDashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [deployments, setDeployments] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [repoUrl, setRepoUrl] = useState('https://github.com/user/repo.git')
  const [targetAgents, setTargetAgents] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const authed = !!localStorage.getItem('token')

  useEffect(() => {
    const socket = io(serverOrigin, { transports: ['websocket'], query: { kind: 'dashboard' } })
    socketRef.current = socket
    socket.on('dashboard:agents', (list: Agent[]) => setAgents(list))
    socket.on('dashboard:deployment-status', () => refreshDeployments())
    socket.on('dashboard:deployment-log', () => {})
    refreshDeployments()
    return () => { socket.disconnect() }
  }, [])

  const onlineAgents = useMemo(() => agents.filter(a => a.status === 'online'), [agents])

  async function refreshDeployments() {
    const data = await apiGet('/api/deployments')
    setDeployments(data.deployments)
  }

  async function createDeployment() {
    if (!repoUrl || targetAgents.length === 0) return alert('Select one or more agents and provide a repo URL')
    try {
      await Promise.all(targetAgents.map(agentId => apiPost('/api/deploy', { agentId, repoUrl })))
    } catch (e: any) {
      alert(e.message || 'Failed to create deployment (are you logged in?)')
      return
    }
    setModalOpen(false)
    await refreshDeployments()
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center p-6">
        <div className="glass-effect rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to DeployHub</h2>
          <p className="text-gray-400 mb-6">Please create an account or log in to access the dashboard.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700">Create account</Link>
            <Link to="/" className="px-6 py-2 border border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-slate-900">Login</Link>
          </div>
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
            <div className="flex items-center gap-4 text-sm">
              <Link to="/" className="text-gray-300 hover:text-cyan-400">Dashboard</Link>
              <Link to="/hardware" className="text-gray-300 hover:text-cyan-400">Hardware</Link>
              <Link to="/deployments" className="text-gray-300 hover:text-cyan-400">Deployments</Link>
              <span className="text-gray-400">Server: {serverOrigin}</span>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6">Deploy on Your Hardware</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">Transform your devices into a CI/CD platform.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={()=>setModalOpen(true)} className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all">New Deployment</button>
              <a href="#agents" className="px-8 py-3 border border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-slate-900 transition-all">Connected Hardware</a>
            </div>
          </div>

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
              <h2 className="text-2xl font-bold">Active Deployments</h2>
              <button onClick={refreshDeployments} className="text-cyan-400 hover:text-cyan-300">Refresh</button>
            </div>
            <div className="space-y-4">
              {deployments.map((d:any) => (
                <div key={d.id} className="deployment-card glass-effect rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-sm text-gray-400">{d.repoUrl}</div>
                    </div>
                    <div className={`badge ${d.status==='succeeded' || d.status==='running' ? 'online' : 'offline'}`}>{d.status}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Link to="/deployments" className="px-2 py-1 border rounded hover:border-cyan-400">View Logs</Link>
                    <button onClick={()=>apiPost(`/api/deployments/${d.id}/action`, { action: 'start' }).then(refreshDeployments)} className="px-2 py-1 border rounded hover:border-gray-400">Start</button>
                    <button onClick={()=>apiPost(`/api/deployments/${d.id}/action`, { action: 'stop' }).then(refreshDeployments)} className="px-2 py-1 border rounded hover:border-gray-400">Stop</button>
                    <button onClick={()=>apiPost(`/api/deployments/${d.id}/action`, { action: 'restart' }).then(refreshDeployments)} className="px-2 py-1 border rounded hover:border-gray-400">Restart</button>
                    <button onClick={()=>apiDelete(`/api/deployments/${d.id}`).then(refreshDeployments)} className="px-2 py-1 border rounded hover:border-red-400 text-red-300">Delete</button>
                  </div>
                </div>
              ))}
              {deployments.length===0 && <div className="text-gray-400">No deployments yet.</div>}
            </div>
          </div>
          <div className="space-y-8" id="agents">
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Hardware Status</h3>
              <div className="space-y-3">
                {agents.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-sm text-gray-400">{a.specs?.cpuCount||0} CPU, {a.specs?.memory?.totalMb||0}MB</div>
                    </div>
                    <span className={`badge ${a.status}`}>{a.status}</span>
                  </div>
                ))}
                {agents.length===0 && <div className="text-gray-400">No agents connected.</div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-effect rounded-xl p-8 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">New Deployment</h2>
                <button onClick={()=>setModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub Repository</label>
                  <input value={repoUrl} onChange={e=>setRepoUrl(e.target.value)} placeholder="https://github.com/user/repo.git" className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Devices</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {onlineAgents.map(a => (
                      <label key={a.id} className="flex items-center gap-2 p-2 rounded border border-slate-600 hover:border-cyan-400">
                        <input
                          type="checkbox"
                          checked={targetAgents.includes(a.id)}
                          onChange={(e)=>{
                            setTargetAgents(prev => e.target.checked ? [...prev, a.id] : prev.filter(id=>id!==a.id))
                          }}
                        />
                        <span>{a.name}</span>
                      </label>
                    ))}
                    {onlineAgents.length===0 && <div className="text-gray-400">No agents online</div>}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={()=>setModalOpen(false)} className="px-6 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button onClick={createDeployment} className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700">Create Deployment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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



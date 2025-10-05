import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { serverOrigin, apiGet, apiPost } from './api'

type Agent = { id: string; name: string; status: 'online'|'offline'; specs?: any }

export default function Hardware() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [loading, setLoading] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    console.log('Hardware: Connecting to server:', serverOrigin)
    
    // Fallback: Try to get agents via REST API first
    const fetchAgents = async () => {
      try {
        const response = await apiGet('/api/agents')
        console.log('Hardware: Fetched agents via API:', response.agents)
        setAgents(response.agents || [])
      } catch (error) {
        console.error('Hardware: Failed to fetch agents via API:', error)
      }
    }
    
    fetchAgents()
    
    const socket = io(serverOrigin, { transports: ['websocket'], query: { kind: 'dashboard' } })
    socketRef.current = socket
    
    socket.on('connect', () => {
      console.log('Hardware: Socket connected')
      setConnectionStatus('connected')
    })
    
    socket.on('disconnect', () => {
      console.log('Hardware: Socket disconnected')
      setConnectionStatus('disconnected')
    })
    
    socket.on('dashboard:agents', (list: Agent[]) => {
      console.log('Hardware: Received agents via socket:', list)
      setAgents(list)
    })
    
    socket.on('connect_error', (error) => {
      console.error('Hardware: Connection error:', error)
      setConnectionStatus('disconnected')
    })
    
    return () => { socket.disconnect() }
  }, [])

  const online = useMemo(() => agents.filter(a=>a.status==='online'), [agents])
  
  const toggleDemoAgents = async () => {
    setLoading(true)
    try {
      const hasDemoAgents = agents.some(a => a.id.startsWith('demo-agent-'))
      const action = hasDemoAgents ? 'remove' : 'add'
      const response = await apiPost('/api/demo-agents', { action })
      setAgents(response.agents)
    } catch (error) {
      console.error('Failed to toggle demo agents:', error)
    } finally {
      setLoading(false)
    }
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
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div>Server: {serverOrigin}</div>
              <div className={`flex items-center space-x-1 ${
                connectionStatus === 'connected' ? 'text-green-400' : 
                connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <span>
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Hardware Management</h1>
          <p className="text-xl text-gray-300">Connect and monitor your personal devices.</p>
          <p className="text-sm text-gray-400 mt-2">Updated: {new Date().toLocaleString()}</p>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href={`${serverOrigin}/public/agents/install-windows.ps1`} className="px-8 py-3 border border-amber-400 text-amber-400 font-semibold rounded-lg hover:bg-amber-400 hover:text-slate-900 transition-all">Download Windows Agent</a>
            <a href={`${serverOrigin}/public/agents/install-linux.sh`} className="px-8 py-3 border border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-slate-900 transition-all">Download Linux Agent</a>
            <button 
              onClick={toggleDemoAgents}
              disabled={loading}
              className="px-8 py-3 border border-purple-400 text-purple-400 font-semibold rounded-lg hover:bg-purple-400 hover:text-slate-900 transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : agents.some(a => a.id.startsWith('demo-agent-')) ? 'Remove Demo Agents' : 'Add Demo Agents'}
            </button>
          </div>
          
          {agents.length === 0 && (
            <div className="text-center mb-12 p-8 glass-effect rounded-xl border border-gray-600">
              <h3 className="text-xl font-semibold mb-4">No devices connected yet</h3>
              <p className="text-gray-300 mb-6">
                To see your devices here, you need to install and run the DeployHub agent on your machines.
              </p>
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-400 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-semibold">Download the agent script</p>
                    <p className="text-sm text-gray-400">Click the download buttons above for your operating system</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-400 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-semibold">Run the installation script</p>
                    <p className="text-sm text-gray-400">Execute the downloaded script on your machine</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-400 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-semibold">Your device will appear here</p>
                    <p className="text-sm text-gray-400">Once connected, you can deploy applications to it</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">Want to see how it works? Try the demo:</p>
                <button 
                  onClick={toggleDemoAgents}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Show Demo Devices'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Connected Devices</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span className="text-green-400">●</span>
                  <span>{online.length} Online</span>
                  <span className="text-red-400 ml-4">●</span>
                  <span>{agents.length - online.length} Offline</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.map(a => (
                  <div key={a.id} className="device-card glass-effect rounded-xl p-6 border border-cyan-400/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">{a.name}</div>
                      <span className={`px-2 py-1 text-xs rounded-full ${a.status==='online'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{a.status.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-gray-400">{a.specs?.platform || ''} {a.specs?.arch || ''}</div>
                    <div className="text-sm text-gray-400">{a.specs?.cpuCount || 0} CPU, {a.specs?.memory?.totalMb || 0}MB</div>
                  </div>
                ))}
                {agents.length===0 && <div className="text-gray-400">No devices connected yet.</div>}
              </div>
            </div>
            <div className="space-y-8">
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">System Overview</h3>
                <div className="space-y-3">
                  <Row label="Total Devices" value={String(agents.length)} />
                  <Row label="Online Devices" value={String(online.length)} />
                  <Row label="Total CPU Cores" value={String(agents.reduce((s,a)=>s+(a.specs?.cpuCount||0),0))} />
                  <Row label="Total Memory (MB)" value={String(agents.reduce((s,a)=>s+(a.specs?.memory?.totalMb||0),0))} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Row({label, value}:{label:string, value:string}){
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-2xl font-bold text-cyan-400">{value}</span>
    </div>
  )
}



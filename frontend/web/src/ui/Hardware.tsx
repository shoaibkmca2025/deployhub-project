import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { serverOrigin } from './api'

type Agent = { id: string; name: string; status: 'online'|'offline'; specs?: any }

export default function Hardware() {
  const [agents, setAgents] = useState<Agent[]>([])
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(serverOrigin, { transports: ['websocket'], query: { kind: 'dashboard' } })
    socketRef.current = socket
    socket.on('dashboard:agents', (list: Agent[]) => setAgents(list))
    return () => { socket.disconnect() }
  }, [])

  const online = useMemo(() => agents.filter(a=>a.status==='online'), [agents])

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
            <div className="text-sm text-gray-400">Server: {serverOrigin}</div>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Hardware Management</h1>
          <p className="text-xl text-gray-300">Connect and monitor your personal devices.</p>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href={`${serverOrigin}/public/agents/install-windows.ps1`} className="px-8 py-3 border border-amber-400 text-amber-400 font-semibold rounded-lg hover:bg-amber-400 hover:text-slate-900 transition-all">Download Windows Agent</a>
            <a href={`${serverOrigin}/public/agents/install-linux.sh`} className="px-8 py-3 border border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-slate-900 transition-all">Download Linux Agent</a>
          </div>

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



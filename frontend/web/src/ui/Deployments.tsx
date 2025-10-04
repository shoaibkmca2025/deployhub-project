import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { apiGet, apiPost, apiPut, apiDelete, serverOrigin } from './api'

type Agent = { id: string; name: string; status: 'online'|'offline'; specs?: any }
type Deployment = { 
  id: string; 
  name: string; 
  status: 'running'|'building'|'stopped'|'error'|'succeeded'; 
  agentId: string; 
  repoUrl: string; 
  logs: string[];
  env: Record<string,string>;
  lastDeploy?: string;
  buildTime?: string;
  commits?: number;
  health?: number;
  type?: string;
  buildCommand?: string;
  startCommand?: string;
  port?: number;
}

export default function Deployments() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [projectType, setProjectType] = useState('Auto-detect')
  const [buildCommand, setBuildCommand] = useState('')
  const [startCommand, setStartCommand] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [envVars, setEnvVars] = useState<Array<{key:string,value:string}>>([{key:'',value:''}])
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(serverOrigin, { transports: ['websocket'], query: { kind: 'dashboard' } })
    socketRef.current = socket
    socket.on('dashboard:agents', (list: Agent[]) => setAgents(list))
    socket.on('dashboard:deployment-status', () => refreshDeployments())
    socket.on('dashboard:deployment-log', ({ deploymentId, line }: any) => {
      setDeployments(prev => prev.map(d => 
        d.id === deploymentId ? { ...d, logs: [...d.logs, line] } : d
      ))
    })
    refreshDeployments()
    return () => { socket.disconnect() }
  }, [])

  const onlineAgents = useMemo(() => agents.filter(a => a.status === 'online'), [agents])

  async function refreshDeployments() {
    const data = await apiGet('/api/deployments')
    setDeployments(data.deployments)
  }

  async function createDeployment() {
    if (!repoUrl || !selectedAgent) return alert('Fill in all required fields')
    try {
      const env = envVars.reduce((acc, {key,value}) => key ? {...acc, [key]:value} : acc, {})
      await apiPost('/api/deploy', { agentId: selectedAgent, repoUrl })
      setModalOpen(false)
      await refreshDeployments()
    } catch (e: any) {
      alert(e.message || 'Failed to create deployment')
    }
  }

  async function act(deploymentId: string, action: 'start'|'stop'|'restart') {
    await apiPost(`/api/deployments/${deploymentId}/action`, { action })
    await refreshDeployments()
  }

  async function removeDeployment(deploymentId: string) {
    await apiDelete(`/api/deployments/${deploymentId}`)
    await refreshDeployments()
  }

  function analyzeRepo() {
    if (!repoUrl) return alert('Enter repository URL')
    // Simulate AI analysis
    if (repoUrl.includes('react') || repoUrl.includes('next')) {
      setProjectType('React')
      setBuildCommand('npm run build')
      setStartCommand('npm start')
    } else if (repoUrl.includes('node') || repoUrl.includes('express')) {
      setProjectType('Node.js')
      setBuildCommand('npm install')
      setStartCommand('npm start')
    } else if (repoUrl.includes('python') || repoUrl.includes('flask')) {
      setProjectType('Python')
      setBuildCommand('pip install -r requirements.txt')
      setStartCommand('python app.py')
    }
    setCurrentStep(1)
  }

  function addEnvVar() {
    setEnvVars(prev => [...prev, {key:'',value:''}])
  }

  function removeEnvVar(index: number) {
    setEnvVars(prev => prev.filter((_,i) => i !== index))
  }

  function updateEnvVar(index: number, field: 'key'|'value', value: string) {
    setEnvVars(prev => prev.map((item, i) => i === index ? {...item, [field]: value} : item))
  }

  function viewLogs(deployment: Deployment) {
    setSelectedDeployment(deployment)
    setLogsModalOpen(true)
  }

  const runningDeployments = deployments.filter(d => d.status === 'running' || d.status === 'succeeded').length
  const buildingDeployments = deployments.filter(d => d.status === 'building').length
  const failedDeployments = deployments.filter(d => d.status === 'error').length

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
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">Deployment Management</h1>
            <p className="text-xl text-gray-300">Create, monitor, and manage your application deployments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button onClick={()=>setModalOpen(true)} className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all">New Deployment</button>
            <button className="px-8 py-3 border border-amber-400 text-amber-400 font-semibold rounded-lg hover:bg-amber-400 hover:text-slate-900 transition-all">Bulk Actions</button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">All Deployments</h2>
              <div className="flex items-center space-x-4">
                <select className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none">
                  <option>All Status</option>
                  <option>Running</option>
                  <option>Building</option>
                  <option>Stopped</option>
                  <option>Error</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              {deployments.map(d => (
                <div key={d.id} className="deployment-card glass-effect rounded-xl p-6 border border-cyan-400/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${d.status==='running'?'bg-green-400':d.status==='building'?'bg-amber-400':'bg-gray-400'}`}></div>
                      <div>
                        <h3 className="font-semibold text-lg">{d.name}</h3>
                        <p className="text-sm text-gray-400">{d.repoUrl}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${d.status==='succeeded'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={()=>viewLogs(d)} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors" title="View Logs">
                        📋
                      </button>
                      <button onClick={()=>act(d.id,'restart')} className="p-2 text-gray-400 hover:text-amber-400 transition-colors" title="Restart">
                        🔄
                      </button>
                      <button onClick={()=>act(d.id,'stop')} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Stop">
                        ⏹️
                      </button>
                      <button onClick={()=>removeDeployment(d.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Agent</span>
                      <p className="font-medium">{agents.find(a=>a.id===d.agentId)?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Status</span>
                      <p className="font-medium">{d.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Logs</span>
                      <p className="font-medium">{d.logs.length} lines</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Health</span>
                      <p className="font-medium text-green-400">98%</p>
                    </div>
                  </div>
                </div>
              ))}
              {deployments.length===0 && <div className="text-gray-400">No deployments yet</div>}
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Deployment Stats</h3>
              <div className="space-y-4">
                <Row label="Total Deployments" value={String(deployments.length)} />
                <Row label="Running" value={String(runningDeployments)} />
                <Row label="Building" value={String(buildingDeployments)} />
                <Row label="Failed" value={String(failedDeployments)} />
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-slate-800 rounded-lg border border-amber-400/20">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-300">Consider implementing health checks for better monitoring.</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border border-cyan-400/20">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-300">Build times can be optimized with proper caching strategies.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Deployment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-effect rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">New Deployment</h2>
                <button onClick={()=>setModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              
              <div className="space-y-8">
                {/* Step 1: Repository */}
                <div className={`deployment-step p-6 rounded-lg border ${currentStep >= 0 ? 'border-cyan-400/20' : 'border-slate-600'}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${currentStep >= 0 ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-white'}`}>1</span>
                    Connect Repository
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">GitHub Repository URL</label>
                      <input value={repoUrl} onChange={e=>setRepoUrl(e.target.value)} placeholder="https://github.com/username/repository" className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Branch</label>
                      <input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="main" className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                    </div>
                    <button onClick={analyzeRepo} className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">Analyze Repository</button>
                  </div>
                </div>

                {/* Step 2: Configuration */}
                <div className={`deployment-step p-6 rounded-lg border ${currentStep >= 1 ? 'border-cyan-400/20' : 'border-slate-600'}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${currentStep >= 1 ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-white'}`}>2</span>
                    Configure Build
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Project Type</label>
                      <select value={projectType} onChange={e=>setProjectType(e.target.value)} className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none">
                        <option>Auto-detect</option>
                        <option>Node.js</option>
                        <option>Python</option>
                        <option>React</option>
                        <option>Vue.js</option>
                        <option>Static Site</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Build Command</label>
                      <input value={buildCommand} onChange={e=>setBuildCommand(e.target.value)} placeholder="npm run build" className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Command</label>
                      <input value={startCommand} onChange={e=>setStartCommand(e.target.value)} placeholder="npm start" className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                    </div>
                  </div>
                </div>

                {/* Step 3: Target Device */}
                <div className={`deployment-step p-6 rounded-lg border ${currentStep >= 2 ? 'border-cyan-400/20' : 'border-slate-600'}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${currentStep >= 2 ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-white'}`}>3</span>
                    Select Target Device
                  </h3>
                  <div className="space-y-3">
                    {onlineAgents.map(a => (
                      <label key={a.id} className="flex items-center space-x-3 p-4 bg-slate-800 rounded-lg border border-slate-600 cursor-pointer hover:border-cyan-400 transition-colors">
                        <input type="radio" name="device" value={a.id} checked={selectedAgent===a.id} onChange={e=>setSelectedAgent(e.target.value)} className="text-cyan-400 focus:ring-cyan-400"/>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{a.name}</span>
                            <span className="text-green-400 text-sm">●</span>
                          </div>
                          <p className="text-sm text-gray-400">Online and ready</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 4: Environment Variables */}
                <div className={`deployment-step p-6 rounded-lg border ${currentStep >= 3 ? 'border-cyan-400/20' : 'border-slate-600'}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${currentStep >= 3 ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-white'}`}>4</span>
                    Environment Variables
                  </h3>
                  <div className="space-y-3">
                    {envVars.map((env, index) => (
                      <div key={index} className="flex space-x-2">
                        <input value={env.key} onChange={e=>updateEnvVar(index,'key',e.target.value)} placeholder="KEY" className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                        <input value={env.value} onChange={e=>updateEnvVar(index,'value',e.target.value)} placeholder="value" className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none"/>
                        <button onClick={()=>removeEnvVar(index)} className="px-3 py-2 text-red-400 hover:text-red-300 transition-colors">✕</button>
                      </div>
                    ))}
                    <button onClick={addEnvVar} className="px-4 py-2 border border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-slate-900 transition-colors">Add Variable</button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600">
                  <button onClick={()=>setModalOpen(false)} className="px-6 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={createDeployment} className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all">Create Deployment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsModalOpen && selectedDeployment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-effect rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Build Logs - {selectedDeployment.name}</h2>
                <button onClick={()=>setLogsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-lg mb-4 h-96 overflow-y-auto font-mono text-sm">
                {selectedDeployment.logs.map((line, i) => (
                  <div key={i} className="text-green-400 mb-1">{line}</div>
                ))}
                {selectedDeployment.logs.length === 0 && <div className="text-gray-400">No logs available</div>}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">Auto-scroll: ON</button>
                  <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">Clear Logs</button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Build Status:</span>
                  <span className="text-amber-400 text-sm">{selectedDeployment.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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


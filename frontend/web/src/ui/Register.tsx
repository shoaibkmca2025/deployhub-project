import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiPost } from './api'

export default function Register() {
  const [email, setEmail] = useState('user@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit() {
    try {
      setError('')
      const res = await apiPost('/api/signup', { email, password })
      localStorage.setItem('token', res.token)
      navigate('/')
    } catch (e: any) {
      setError(e.message || 'registration failed')
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
        <h3 style={{marginTop:0}}>Create your DeployHub account</h3>
        <div style={{display:'grid', gap:8}}>
          <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="muted" style={{color:'#ff9b9b'}}>{error}</div>}
          <button className="cta" onClick={submit}>Sign up</button>
          <div className="muted">Already have an account? <Link to="/">Login</Link></div>
        </div>
      </div>
    </div>
  )
}


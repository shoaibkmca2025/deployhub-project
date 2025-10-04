const serverOrigin = (import.meta as any).env?.VITE_SERVER_ORIGIN || (() => {
  // If accessing via localhost, use localhost for server
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:4000'
  }
  // If accessing via network IP, use the same IP for server
  return `${location.protocol}//${location.hostname}:4000`
})()

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet(path: string) {
  const res = await fetch(`${serverOrigin}${path}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiPost(path: string, body?: any) {
  const res = await fetch(`${serverOrigin}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiPut(path: string, body?: any) {
  const res = await fetch(`${serverOrigin}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiDelete(path: string) {
  const res = await fetch(`${serverOrigin}${path}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() } })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export { serverOrigin }


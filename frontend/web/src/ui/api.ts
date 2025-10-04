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
  try {
    const res = await fetch(`${serverOrigin}${path}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorJson.message || errorText
      } catch {
        // If not JSON, use the text as is
      }
      throw new Error(errorMessage)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the server is running on ' + serverOrigin)
    }
    throw error
  }
}

export async function apiPost(path: string, body?: any) {
  try {
    const res = await fetch(`${serverOrigin}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: body ? JSON.stringify(body) : undefined })
    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorJson.message || errorText
      } catch {
        // If not JSON, use the text as is
      }
      throw new Error(errorMessage)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the server is running on ' + serverOrigin)
    }
    throw error
  }
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

export async function testConnection() {
  try {
    const response = await fetch(`${serverOrigin}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      serverOrigin
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      serverOrigin
    }
  }
}

export { serverOrigin }


import React, { useEffect, useState } from 'react'

type Props = {
  open: boolean
  initialEnv: Record<string,string>
  onClose: () => void
  onSave: (env: Record<string,string>) => Promise<void>
}

export default function EnvEditor({ open, initialEnv, onClose, onSave }: Props) {
  const [kv, setKv] = useState<Array<{key: string, value: string}>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const entries = Object.entries(initialEnv || {}).map(([key,value]) => ({ key, value }))
    setKv(entries.length ? entries : [{ key: '', value: '' }])
  }, [initialEnv, open])

  if (!open) return null

  function update(idx: number, field: 'key'|'value', value: string) {
    setKv(list => list.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  function addRow() { setKv(list => [...list, { key: '', value: '' }]) }
  function removeRow(i: number) { setKv(list => list.filter((_,idx) => idx !== i)) }

  async function save() {
    setSaving(true)
    const env: Record<string,string> = {}
    kv.forEach(({key,value}) => { if (key) env[key] = value })
    await onSave(env)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
      <div className="card" style={{ width: 520, maxWidth: '90vw', background:'#0f1430' }}>
        <h3 style={{marginTop:0}}>Environment Variables</h3>
        <div style={{display:'grid', gap:8}}>
          {kv.map((row, idx) => (
            <div key={idx} style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8}}>
              <input placeholder="KEY" value={row.key} onChange={e=>update(idx,'key',e.target.value)} />
              <input placeholder="value" value={row.value} onChange={e=>update(idx,'value',e.target.value)} />
              <button onClick={()=>removeRow(idx)}>Remove</button>
            </div>
          ))}
          <div>
            <button onClick={addRow}>Add variable</button>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button onClick={onClose}>Cancel</button>
            <button className="cta" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}



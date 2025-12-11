import React, { useState, useEffect } from 'react'

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function normalizeTo100(arr) {
  // Normaliza una lista de números para que sumen 100 y devuelva enteros.
  // Distribuye el redondeo para que la suma final sea exactamente 100.
  const vals = arr.map((v) => Number(v || 0))
  const total = vals.reduce((s, v) => s + v, 0)
  if (total === 0) return vals.map(() => 0)

  const floats = vals.map((v) => (v / total) * 100)
  const floors = floats.map((f) => Math.floor(f))
  let remainder = 100 - floors.reduce((s, v) => s + v, 0)

  // Distribuir el resto según la parte fraccionaria más alta
  const frac = floats.map((f, i) => ({ i, frac: f - floors[i] }))
  frac.sort((a, b) => b.frac - a.frac)
  const result = [...floors]
  for (let k = 0; k < remainder; k++) {
    result[frac[k].i] = result[frac[k].i] + 1
  }
  return result
}

function normalizeToTotal(arr, totalPoints) {
  // Normaliza una lista de números para que sumen totalPoints y devuelva enteros.
  // Distribuye el redondeo para que la suma final sea exactamente totalPoints.
  const vals = arr.map((v) => Number(v || 0))
  const total = vals.reduce((s, v) => s + v, 0)
  if (total === 0) return vals.map(() => 0)

  const factor = totalPoints / total
  const floats = vals.map((v) => v * factor)
  const floors = floats.map((f) => Math.floor(f))
  let remainder = totalPoints - floors.reduce((s, v) => s + v, 0)

  const frac = floats.map((f, i) => ({ i, frac: f - floors[i] }))
  frac.sort((a, b) => b.frac - a.frac)
  const result = [...floors]
  for (let k = 0; k < remainder; k++) {
    result[frac[k].i] = result[frac[k].i] + 1
  }
  return result
}

export default function StakeholderEditor({ stakeholders, environments, onChange }) {
  const [local, setLocal] = useState(() => {
    try {
      const saved = localStorage.getItem('stakeholders_edit')
      if (saved) return JSON.parse(saved)
    } catch { console.warn('localStorage read failed') }
    return deepCopy(stakeholders)
  })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [autoNormalize, setAutoNormalize] = useState(true)

  const selected = local[selectedIdx]

  function pushChange(next) {
    const copy = deepCopy(local)
    copy[selectedIdx] = next
    setLocal(copy)
    onChange && onChange(copy)
  }

  // Auto-save to localStorage whenever local changes
  useEffect(() => {
    try {
      localStorage.setItem('stakeholders_edit', JSON.stringify(local))
    } catch { console.warn('localStorage write failed') }
  }, [local])

  // Ensure parent sees initial state (when loaded from storage)
  useEffect(() => {
    onChange && onChange(local)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addStakeholder() {
    const copy = deepCopy(local)
    copy.push({ stakeholder: `Nuevo ${copy.length + 1}`, total_pct: 100, variables: {} })
    setLocal(copy)
    setSelectedIdx(copy.length - 1)
    onChange && onChange(copy)
  }

  function removeStakeholder(idx) {
    const copy = deepCopy(local)
    copy.splice(idx, 1)
    setLocal(copy)
    setSelectedIdx(Math.max(0, idx - 1))
    onChange && onChange(copy)
  }

  function setStakeholderName(name) {
    const next = deepCopy(selected)
    next.stakeholder = name
    pushChange(next)
  }

  function addVariable(name) {
    const next = deepCopy(selected)
    next.variables = next.variables || {}
    const impacto = {}
    environments.forEach((env) => { impacto[env] = 0 })
    next.variables[name] = { total_pct: 10, impacto_pct: impacto }
    pushChange(next)
  }

  function removeVariable(name) {
    const next = deepCopy(selected)
    delete next.variables[name]
    pushChange(next)
  }

  function setVariableTotal(name, value) {
    const next = deepCopy(selected)
    // forzar entero
    const intVal = Number.isNaN(Number(value)) ? 0 : Math.round(Number(value))
    next.variables[name].total_pct = intVal
    if (autoNormalize) {
      // normalize all variable totals to 100
      const keys = Object.keys(next.variables)
      const vals = keys.map((k) => next.variables[k].total_pct)
      const normalized = normalizeTo100(vals)
      keys.forEach((k, i) => { next.variables[k].total_pct = normalized[i] })
    }
    pushChange(next)
  }

  function setImpact(name, env, value) {
    const next = deepCopy(selected)
    next.variables[name].impacto_pct = next.variables[name].impacto_pct || {}
    const intVal = Number.isNaN(Number(value)) ? 0 : Math.round(Number(value))
    next.variables[name].impacto_pct[env] = intVal
    if (autoNormalize) {
      // normalize impactos for this variable so they sum to 100
      const keys = Object.keys(next.variables[name].impacto_pct || {})
      const vals = keys.map((k) => next.variables[name].impacto_pct[k])
      const totalPoints = Number(next.variables[name].total_pct || 0)
      const normalized = normalizeToTotal(vals, totalPoints)
      keys.forEach((k, i) => { next.variables[name].impacto_pct[k] = normalized[i] })
    }
    pushChange(next)
  }

  function saveAll() {
    onChange && onChange(local)
    // descargar JSON
    try {
      const dataStr = JSON.stringify(local, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'stakeholders.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  function exportCsv() {
    try {
      const header = ['Stakeholder', 'Variable', 'Total pct', ...environments.map((e) => String(e).charAt(0).toUpperCase() + String(e).slice(1))]
      const rows = []
      local.forEach((s) => {
        Object.keys(s.variables || {}).forEach((v) => {
          const total = s.variables[v].total_pct || 0
          const impacts = environments.map((env) => s.variables[v].impacto_pct?.[env] ?? 0)
          rows.push([s.stakeholder, v, total, ...impacts])
        })
      })
      const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'stakeholders.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn('Export CSV failed', err)
    }
  }

  function handleFileUpload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        // Basic validation: array of objects with stakeholder property
        if (!Array.isArray(parsed) || parsed.some((x) => typeof x.stakeholder !== 'string')) {
          alert('JSON inválido: se espera un array de stakeholders')
          return
        }
        setLocal(parsed)
        onChange && onChange(parsed)
  try { localStorage.setItem('stakeholders_edit', JSON.stringify(parsed)) } catch { console.warn('localStorage write failed on file upload') }
      } catch {
        alert('Error parseando JSON')
      }
    }
    reader.readAsText(f)
    // reset input
    e.target.value = null
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Editor de stakeholders</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={addStakeholder}>Agregar stakeholder</button>
        <label style={{ marginLeft: 12 }}><input type="checkbox" checked={autoNormalize} onChange={(e) => setAutoNormalize(e.target.checked)} /> Auto-normalizar</label>
        <button style={{ marginLeft: 12 }} onClick={saveAll}>Guardar</button>
        <button style={{ marginLeft: 8 }} onClick={exportCsv}>Exportar CSV</button>
        <label style={{ marginLeft: 12 }}>
          Cargar JSON: <input type="file" accept="application/json" onChange={(e) => handleFileUpload(e)} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 240 }}>
          <h4>Stakeholders</h4>
          <ol style={{ paddingLeft: 18 }}>
            {local.map((s, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => setSelectedIdx(i)}
                    style={{
                      fontWeight: i === selectedIdx ? 'bold' : 'normal',
                      flex: '1 1 auto',
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={s.stakeholder}
                  >
                    {s.stakeholder}
                  </button>
                  <button onClick={() => removeStakeholder(i)} style={{ flex: '0 0 auto' }}>x</button>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ flex: 1 }}>
          {selected ? (
            <div>
              <div style={{ marginBottom: 8 }}>
                <label>Nombre: </label>
                <input value={selected.stakeholder} onChange={(e) => setStakeholderName(e.target.value)} />
              </div>

              <div>
                <h4>Variables</h4>
                <div style={{ marginBottom: 8 }}>
                  <AddVariableForm onAdd={addVariable} />
                </div>
                <div>
                  {Object.keys(selected.variables || {}).length === 0 && <div>No hay variables</div>}
                  {Object.keys(selected.variables || {}).map((v) => {
                    const varObj = selected.variables[v]
                    const totalPts = Number(varObj.total_pct || 0)
                    const totalActual = Object.keys(varObj.impacto_pct || {}).reduce((s, k) => s + Number(varObj.impacto_pct[k] || 0), 0)
                    const ok = totalActual === totalPts

                    return (
                      <div key={v} style={{ padding: 8, border: '1px solid #eee', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{v}</strong>
                          <button onClick={() => removeVariable(v)}>Eliminar</button>
                        </div>

                        <div style={{ marginTop: 6 }}>
                          <em style={{ color: ok ? 'green' : 'red' }}>total actual de impactos = {totalActual} / {totalPts}</em>
                        </div>

                        <div style={{ marginTop: 6 }}>
                          <label>Total pct: </label>
                          <input type="number" step={1} min={0} value={selected.variables[v].total_pct} onChange={(e) => setVariableTotal(v, e.target.value)} />
                        </div>

                        <div style={{ marginTop: 6 }}>
                          <strong>Impacto por entorno</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
                            {environments.map((env) => (
                              <div key={env}>
                                <label style={{ display: 'block' }}>{String(env).charAt(0).toUpperCase() + String(env).slice(1)}</label>
                                <input type="number" step={1} min={0} value={selected.variables[v].impacto_pct?.[env] ?? 0} onChange={(e) => setImpact(v, env, e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div>Selecciona un stakeholder</div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddVariableForm({ onAdd }) {
  const [name, setName] = useState('')
  return (
    <div>
      <input placeholder="Nombre variable" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => { if (name) { onAdd(name); setName('') } }}>Agregar</button>
    </div>
  )
}

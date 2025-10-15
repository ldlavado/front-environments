import React, { useMemo, useState } from 'react'

export default function TopVariables({ stakeholders }) {
  // construir mapa variable -> total_pct (sum across stakeholders)
  const varsMap = useMemo(() => {
    const map = {}
    stakeholders.forEach((s) => {
      Object.keys(s.variables || {}).forEach((v) => {
        map[v] = (map[v] || 0) + Number(s.variables[v].total_pct || 0)
      })
    })
    return map
  }, [stakeholders])

  const sorted = useMemo(() => Object.entries(varsMap).sort((a, b) => b[1] - a[1]), [varsMap])
  const [selected, setSelected] = useState(sorted[0]?.[0] || '')

  return (
    <div style={{ padding: 12 }}>
      <h2>Top variables (global)</h2>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 360 }}>
          <ol>
            {sorted.map(([k, v]) => (
              <li key={k} style={{ marginBottom: 8 }}>
                <button onClick={() => setSelected(k)} style={{ cursor: 'pointer', background: k === selected ? '#eee' : 'transparent', border: '1px solid #ddd', padding: '6px' }}>{k} — {v}</button>
              </li>
            ))}
          </ol>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Detalle: {selected || 'Selecciona una variable'}</h3>
          {selected && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th style={{ textAlign: 'left', padding: 6 }}>Stakeholder</th><th style={{ padding: 6 }}>Total pct</th></tr>
              </thead>
              <tbody>
                {stakeholders.map((s) => (
                  <tr key={s.stakeholder}><td style={{ padding: 6 }}>{s.stakeholder}</td><td style={{ padding: 6 }}>{s.variables?.[selected]?.total_pct || 0}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

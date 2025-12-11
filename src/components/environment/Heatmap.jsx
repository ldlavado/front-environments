import React, { useMemo } from 'react'
import './Heatmap.css'

function colorFor(value, max) {
  if (max <= 0) return '#fff'
  const ratio = value / max
  const r = Math.round(255 - ratio * 120)
  const g = Math.round(255 - ratio * 200)
  const b = Math.round(255 - ratio * 200)
  return `rgb(${r},${g},${b})`
}

export default function Heatmap({ stakeholders, environments }) {
  const { rows, max } = useMemo(() => {
    let max = 0
    const rows = stakeholders.map((s) => {
      const cells = environments.map((env) => {
        const total = Object.keys(s.variables || {}).reduce((acc, v) => acc + Number((s.variables[v].impacto_pct?.[env] || 0)), 0)
        if (total > max) max = total
        return total
      })
      return { stakeholder: s.stakeholder, cells }
    })
    return { rows, max }
  }, [stakeholders, environments])

  return (
    <section className="card heatmap-card">
      <h2 className="heatmap-title">Heatmap (Stakeholder × Entorno)</h2>
      <table className="heatmap-table">
        <thead>
          <tr>
            <th>Stakeholder</th>
            {environments.map((e) => (
              <th key={e} className="center">{String(e).charAt(0).toUpperCase() + String(e).slice(1)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.stakeholder}>
              <td>{r.stakeholder}</td>
              {r.cells.map((c, i) => (
                <td key={i} className="center" style={{ background: colorFor(c, max) }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

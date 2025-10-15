import React, { useMemo } from 'react'

function dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0) }
function norm(a) { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)) }

export default function SimilarityMatrix({ stakeholders, environments }) {
  const { names, matrix } = useMemo(() => {
    const names = stakeholders.map((s) => s.stakeholder)
    const vectors = stakeholders.map((s) => environments.map((env) => Object.keys(s.variables || {}).reduce((acc, v) => acc + Number((s.variables[v].impacto_pct?.[env] || 0)), 0)))
    const matrix = vectors.map((v1) => vectors.map((v2) => {
      const denom = norm(v1) * norm(v2)
      return denom === 0 ? 0 : +(dot(v1, v2) / denom).toFixed(3)
    }))
    return { names, matrix }
  }, [stakeholders, environments])

  return (
    <div style={{ padding: 12 }}>
      <h2>Similitud entre stakeholders (cosine)</h2>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr><th></th>{names.map((n) => <th key={n} style={{ padding: 6 }}>{n}</th>)}</tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={names[i]}>
              <td style={{ padding: 6, fontWeight: 'bold' }}>{names[i]}</td>
              {row.map((v, j) => (
                <td key={j} style={{ padding: 6, textAlign: 'center' }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

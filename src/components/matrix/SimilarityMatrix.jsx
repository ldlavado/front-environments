import React, { useCallback, useMemo, useRef } from 'react'
import { downloadElementAsPng } from '../../utils/downloadElementAsPng'

function dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0) }
function norm(a) { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)) }

export default function SimilarityMatrix({ stakeholders, environments }) {
  const matrixRef = useRef(null)
  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(matrixRef.current, 'matriz_similitud.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }} data-export-ignore="true">
        <button onClick={handleExportPng} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Guardar PNG</button>
      </div>
    <section ref={matrixRef} className="card" style={{ padding: 12 }}>
      <h2>Similitud entre stakeholders (cosine)</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
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
    </section>
    </div>
  )
}

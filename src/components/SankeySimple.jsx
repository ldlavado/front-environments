import React, { useMemo } from 'react'

export default function SankeySimple({ stakeholders, environments }) {
  const links = useMemo(() => {
    // Construir links variable -> entorno (valor total global por variable y entorno)
    const varMap = {}
    stakeholders.forEach((s) => {
      Object.keys(s.variables || {}).forEach((v) => {
        const imp = s.variables[v].impacto_pct || {}
        environments.forEach((env) => {
          varMap[v] = varMap[v] || {}
          varMap[v][env] = (varMap[v][env] || 0) + Number(imp[env] || 0)
        })
      })
    })
    return varMap
  }, [stakeholders, environments])

  return (
    <div style={{ padding: 12 }}>
      <h2>Sankey (simplificado — textual)</h2>
      <p>Representación simplificada: para cada variable se muestran los entornos y su contribución total.</p>
      <div>
        {Object.keys(links).map((v) => (
          <div key={v} style={{ marginBottom: 8 }}>
            <strong>{v}</strong>
            <ul>
              {environments.map((env) => (
                <li key={env}>{String(env).charAt(0).toUpperCase() + String(env).slice(1)}: {links[v][env] || 0}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

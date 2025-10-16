import React, { useMemo, useState } from 'react'

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  // very small CSV parser: split lines, split by comma respecting quotes
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  return lines.map((line) => {
    const out = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQ = !inQ
        }
      } else if (ch === ',' && !inQ) {
        out.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    out.push(cur)
    return out.map((c) => c.trim())
  })
}

export default function ExcelView({ stakeholders, environments, onImport }) {
  const [filter, setFilter] = useState('')

  // rows: [stakeholder, variable, total_pct, ...impacts]
  const rows = useMemo(() => {
    const out = []
    stakeholders.forEach((s) => {
      Object.keys(s.variables || {}).forEach((v) => {
        const total = s.variables[v].total_pct || 0
        const impacts = environments.map((env) => s.variables[v].impacto_pct?.[env] ?? 0)
        out.push([s.stakeholder, v, total, ...impacts])
      })
    })
    return out
  }, [stakeholders, environments])

  const filtered = rows.filter((r) => r.join(' ').toLowerCase().includes(filter.toLowerCase()))

  function exportCsv() {
    const header = ['Stakeholder', 'Variable', 'Total pct', ...environments.map((e) => String(e).charAt(0).toUpperCase() + String(e).slice(1))]
    downloadCSV('stakeholders.csv', [header, ...filtered])
  }

  async function handleFile(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const text = await f.text()
    const parsed = parseCSV(text)
    if (parsed.length < 2) return
    const header = parsed[0].map((h) => h.toLowerCase())
    const envIndices = environments.map((env) => header.findIndex((h) => h.includes(env.toLowerCase())))
    // build stakeholders map
    const map = {}
    for (let i = 1; i < parsed.length; i++) {
      const row = parsed[i]
      const sh = row[header.findIndex((h) => h.includes('stakeholder'))] || row[0]
      const varName = row[header.findIndex((h) => h.includes('variable'))] || row[1]
      const total = Number(row[header.findIndex((h) => h.includes('total'))] || row[2]) || 0
      if (!map[sh]) map[sh] = { stakeholder: sh, variables: {} }
      const impacto_pct = {}
      environments.forEach((env, idx) => {
        const hi = envIndices[idx]
        impacto_pct[env] = hi >= 0 ? Number(row[hi]) || 0 : 0
      })
      map[sh].variables[varName] = { total_pct: total, impacto_pct }
    }
    const out = Object.values(map)
    if (onImport) onImport(out)
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Vista tipo Excel</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Filtro: </label>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginRight: 12 }} />
        <button onClick={exportCsv}>Exportar CSV</button>
        <label style={{ marginLeft: 12 }}>
          Importar CSV: <input type="file" accept=".csv" onChange={handleFile} />
        </label>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: 6 }}>Stakeholder</th>
              <th style={{ border: '1px solid #ddd', padding: 6 }}>Variable</th>
              <th style={{ border: '1px solid #ddd', padding: 6 }}>Total pct</th>
              {environments.map((e) => (
                <th key={e} style={{ border: '1px solid #ddd', padding: 6 }}>{String(e).charAt(0).toUpperCase() + String(e).slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} style={{ border: '1px solid #eee', padding: 6 }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

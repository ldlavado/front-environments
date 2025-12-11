import React, { useEffect, useMemo, useState } from 'react'

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  // add UTF-8 BOM for Excel compatibility with accents
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
  const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' })
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
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ index: 0, dir: 'asc' }) // index in row, 'asc' | 'desc'
  const [importInfo, setImportInfo] = useState(null)
  const [colFilters, setColFilters] = useState({}) // { colIndex: value }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // debounce filter input
  useEffect(() => {
    const t = setTimeout(() => setFilter(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

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

  // unique values per column for dropdowns (computed on unfiltered rows to provide full set)
  const headers = useMemo(() => ['Stakeholder', 'Variable', 'Total pct', ...environments.map((e) => String(e).charAt(0).toUpperCase() + String(e).slice(1))], [environments])
  const uniqueByCol = useMemo(() => {
    const maps = headers.map(() => new Set())
    rows.forEach((r) => r.forEach((val, idx) => maps[idx].add(String(val))))
    return maps.map((s) => Array.from(s).sort((a, b) => a.localeCompare(b)))
  }, [rows, headers])

  const filtered = rows
    .filter((r) => r.join(' ').toLowerCase().includes(filter.toLowerCase()))
    .filter((r) => {
      // apply per-column filters
      return Object.entries(colFilters).every(([idxStr, val]) => {
        const idx = Number(idxStr)
        if (!val) return true
        return String(r[idx]) === String(val)
      })
    })
    .sort((a, b) => {
      const { index, dir } = sort
      const av = a[index], bv = b[index]
      const na = Number(av), nb = Number(bv)
      let cmp
      if (!Number.isNaN(na) && !Number.isNaN(nb)) cmp = na - nb
      else cmp = String(av).localeCompare(String(bv))
      return dir === 'asc' ? cmp : -cmp
    })

  // pagination
  const totalRows = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

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
    setImportInfo({ stakeholders: out.length, variables: out.reduce((acc, s) => acc + Object.keys(s.variables||{}).length, 0) })
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Vista tipo Excel</h2>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="excel-filter">Filtro: </label>
        <input id="excel-filter" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" style={{ marginRight: 12 }} />
        <button onClick={exportCsv}>Exportar CSV</button>
        <label style={{ marginLeft: 12 }}>
          Importar CSV: <input type="file" accept=".csv" onChange={handleFile} />
        </label>
        {importInfo && (
          <span style={{ marginLeft: 12, color: 'var(--muted)' }}>
            Importados: {importInfo.stakeholders} stakeholders, {importInfo.variables} variables
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: 'var(--surface)' }}>
              {headers.map((h, idx) => (
                <th
                  key={h}
                  onClick={() => setSort((prev) => ({ index: idx, dir: prev.index === idx && prev.dir === 'asc' ? 'desc' : 'asc' }))}
                  style={{ border: '1px solid var(--border)', padding: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  title="Ordenar"
                >
                  {h} {sort.index === idx ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
            <tr style={{ position: 'sticky', top: 34, background: 'var(--card-bg)' }}>
              {headers.map((h, idx) => (
                <th key={`f-${h}`} style={{ border: '1px solid var(--border)', padding: 4 }}>
                  <select
                    value={colFilters[idx] || ''}
                    onChange={(e) => { setColFilters((prev) => ({ ...prev, [idx]: e.target.value })); setPage(1) }}
                    style={{ width: '100%' }}
                  >
                    <option value="">(Todos)</option>
                    {uniqueByCol[idx].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 ? 'transparent' : 'var(--highlight-bg)' }}>
                {r.map((c, j) => {
                  const isNum = j >= 2
                  const val = isNum && typeof c === 'number' ? c : Number(c)
                  const show = isNum && !Number.isNaN(val) ? val : c
                  return (
                    <td key={j} style={{ border: '1px solid var(--border)', padding: 6, textAlign: isNum ? 'right' : 'left' }}>{show}</td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>Anterior</button>
        <span>Página {safePage} de {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>Siguiente</button>
        <span style={{ marginLeft: 12 }}>Filas por página:</span>
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{totalRows} filas</span>
      </div>
    </div>
  )
}

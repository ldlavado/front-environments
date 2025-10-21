import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function MpcMatrix({ data }) {
  const defaultData = useMemo(() => ({
    matriz: 'MPC',
    descripcion: 'Matriz de Perfil Competitivo',
    competidores: [],
    escala: { peso: '0.0–1.0 (suma 1.0)', calificacion: '1–4', nota: 'Total ponderado por competidor = sum(peso_i * calif_i)' },
    factores: [],
    totales_ponderados: [],
  }), [])

  const [d, setD] = useState(() => {
    try { const saved = localStorage.getItem('mpc_data'); if (saved) return JSON.parse(saved) } catch { /* ignore */ }
    return data || defaultData
  })
  const fileRef = useRef(null)

  useEffect(() => {
    let cancel = false
    if (!data) {
      ;(async () => {
        try {
          const res = await fetch('/mpc.json', { cache: 'no-store' })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const json = await res.json()
          if (!cancel && json && typeof json === 'object') setD(json)
        } catch {
          // ignore
        }
      })()
    }
    return () => { cancel = true }
  }, [data])

  useEffect(() => {
    try { localStorage.setItem('mpc_data', JSON.stringify(d)) } catch { /* ignore */ }
  }, [d])

  const competitorIds = useMemo(() => (d.competidores || []).map(c => c.id), [d])
  const competitorNames = useMemo(() => Object.fromEntries((d.competidores || []).map(c => [c.id, c.nombre])), [d])

  const calcTotals = useMemo(() => {
    const totals = {}
    ;(d.factores || []).forEach((f) => {
      const peso = Number(f.peso) || 0
      const cals = f.calificaciones || {}
      competitorIds.forEach(cid => {
        const cal = Number(cals[cid]) || 0
        totals[cid] = (totals[cid] || 0) + peso * cal
      })
    })
    return totals
  }, [d, competitorIds])

  const styles = {
    tableWrap: {
      background: getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#0b1220',
      color: getComputedStyle(document.documentElement).getPropertyValue('--card-fg') || '#e5e7eb',
      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`,
      borderRadius: 10,
      padding: 12,
      boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', borderBottom: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`, padding: '8px 6px', fontWeight: 700 },
    td: { borderBottom: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`, padding: '8px 6px', verticalAlign: 'top' },
    controls: { display: 'flex', gap: 8, margin: '8px 0 14px' }
  }

  const pick = () => fileRef.current?.click()
  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (!json || typeof json !== 'object') throw new Error('JSON inválido')
      setD(json)
    } catch (err) {
      alert('No se pudo importar el JSON de MPC: ' + err.message)
    } finally { e.target.value = '' }
  }
  const onExport = () => {
    try {
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mpc.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar el JSON: ' + err.message)
    }
  }
  const onReset = async () => {
    try { localStorage.removeItem('mpc_data') } catch { /* ignore */ }
    try {
      const res = await fetch('/mpc.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      setD(json)
    } catch {
      setD(defaultData)
    }
  }

  const updatePeso = (id, value) => {
    setD(prev => ({
      ...prev,
      factores: (prev.factores || []).map(f => f.id === id ? { ...f, peso: Math.max(0, Math.min(1, Number(value) || 0)) } : f)
    }))
  }
  const updateCal = (fid, cid, value) => {
    setD(prev => ({
      ...prev,
      factores: (prev.factores || []).map(f => {
        if (f.id !== fid) return f
        const calificaciones = { ...(f.calificaciones || {}), [cid]: Math.max(1, Math.min(4, Number(value) || 0)) }
        return { ...f, calificaciones }
      })
    }))
  }

  const sumPeso = useMemo(() => (d.factores || []).reduce((a,f)=> a + (Number(f.peso)||0), 0), [d])

  return (
    <div>
      <h2 style={{ margin: '12px 0 8px' }}>Matriz MPC</h2>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>{d.descripcion}</div>

      <div style={{ ...styles.controls }}>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onFileChange} />
        <button onClick={pick} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Importar JSON</button>
        <button onClick={onExport} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar JSON</button>
        <button onClick={onReset} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Restaurar por defecto</button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Factor</th>
              <th style={styles.th}>Peso</th>
              {competitorIds.map(cid => (
                <th key={cid} style={styles.th}>Calif {competitorNames[cid] || cid}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(d.factores || []).map((f) => (
              <tr key={f.id}>
                <td style={styles.td}>{f.nombre}</td>
                <td style={styles.td}>
                  <input type="number" min={0} max={1} step={0.01} value={(Number(f.peso) || 0).toString()} onChange={(e)=>updatePeso(f.id, e.target.value)} style={{ width: 80 }} />
                </td>
                {competitorIds.map(cid => (
                  <td key={cid} style={styles.td}>
                    <input type="number" min={1} max={4} step={1} value={(Number((f.calificaciones||{})[cid]) || 0).toString()} onChange={(e)=>updateCal(f.id, cid, e.target.value)} style={{ width: 80 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={styles.td}><strong>Totales</strong></td>
              <td style={styles.td}>
                <strong>{sumPeso.toFixed(2)}</strong>
                {Math.abs(sumPeso - 1) > 0.01 && (
                  <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>
                    (Δ {((sumPeso - 1) > 0 ? '+' : '') + (sumPeso - 1).toFixed(2)})
                  </span>
                )}
                {Math.abs(sumPeso - 1) <= 0.01 && (
                  <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 700 }}>
                    Pesos OK
                  </span>
                )}
              </td>
              {competitorIds.map(cid => (
                <td key={cid} style={styles.td}><strong>{(calcTotals[cid] || 0).toFixed(2)}</strong></td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginTop: 10, opacity: 0.8 }}>
        Nota: La suma de pesos debe aproximar 1.0. Los totales ponderados por competidor se recalculan desde los factores.
      </div>
    </div>
  )
}

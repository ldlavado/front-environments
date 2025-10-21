import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function MefeMatrix({ data }) {
  const defaultData = useMemo(() => ({
    matriz: 'MEFE',
    descripcion: 'Matriz de Evaluación de Factores Externos',
    escala: {
      peso: '0.0–1.0 (suma 1.0)',
      calificacion: '1–4 (1=respuesta pobre, 4=respuesta superior)',
      formula_ponderado: 'peso * calificacion',
    },
    factores: [],
    total: 0,
  }), [])

  const [d, setD] = useState(() => {
    try {
      const saved = localStorage.getItem('mefe_data')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return data || defaultData
  })
  const [sumPeso, setSumPeso] = useState(0)
  const [sumPonderado, setSumPonderado] = useState(0)
  const fileRef = useRef(null)

  // Load from public/mefe.json if no external data is passed
  useEffect(() => {
    let cancel = false
    if (!data) {
      ;(async () => {
        try {
          const res = await fetch('/mefe.json', { cache: 'no-store' })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const json = await res.json()
          if (!cancel && json && typeof json === 'object') {
            setD(prev => ({
              matriz: json.matriz || prev.matriz,
              descripcion: json.descripcion || prev.descripcion,
              escala: json.escala || prev.escala,
              factores: Array.isArray(json.factores) ? json.factores : prev.factores,
              total: typeof json.total === 'number' ? json.total : prev.total,
            }))
          }
        } catch {
          // keep defaults
        }
      })()
    }
    return () => { cancel = true }
  }, [data])

  // recompute sums
  useEffect(() => {
    const factores = d.factores || []
    const sPeso = factores.reduce((acc, f) => acc + (Number(f.peso) || 0), 0)
    const sPond = factores.reduce((acc, f) => acc + ((Number(f.peso) || 0) * (Number(f.calificacion) || 0)), 0)
    setSumPeso(Number(sPeso.toFixed(2)))
    setSumPonderado(Number(sPond.toFixed(2)))
    try { localStorage.setItem('mefe_data', JSON.stringify(d)) } catch { /* ignore */ }
  }, [d])

  const styles = {
    tableWrap: {
      background: getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#0b1220',
      color: getComputedStyle(document.documentElement).getPropertyValue('--card-fg') || '#e5e7eb',
      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`,
      borderRadius: 10,
      padding: 12,
      boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      borderBottom: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`,
      padding: '8px 6px',
      fontWeight: 700,
    },
    td: {
      borderBottom: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`,
      padding: '8px 6px',
      verticalAlign: 'top',
    },
    chip: (type) => ({
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: 6,
      fontSize: 12,
      background: type === 'oportunidad' ? 'rgba(59,130,246,0.25)' : 'rgba(234,179,8,0.25)',
      color: type === 'oportunidad' ? '#60a5fa' : '#f59e0b',
      fontWeight: 700,
      textTransform: 'capitalize',
    }),
    controls: {
      display: 'flex', gap: 8, margin: '8px 0 14px'
    }
  }

  // Import/Export handlers
  const handlePickFile = () => fileRef.current?.click()
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (!json || typeof json !== 'object') throw new Error('JSON inválido')
      const next = {
        matriz: json.matriz || d.matriz,
        descripcion: json.descripcion || d.descripcion,
        escala: json.escala || d.escala,
        factores: Array.isArray(json.factores) ? json.factores : d.factores,
        total: typeof json.total === 'number' ? json.total : d.total,
      }
      setD(next)
    } catch (err) {
      alert('No se pudo importar el JSON de MEFE: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }
  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mefe.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar el JSON: ' + err.message)
    }
  }

  const handleResetDefaults = async () => {
    try { localStorage.removeItem('mefe_data') } catch { /* ignore */ }
    try {
      const res = await fetch('/mefe.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      setD(json)
    } catch {
      setD(defaultData)
    }
  }

  const updateFactor = (id, field, value) => {
    setD(prev => {
      const factores = (prev.factores || []).map(f => {
        if (f.id !== id) return f
        let v = value
        if (field === 'peso') v = Math.max(0, Math.min(1, Number(value) || 0))
        if (field === 'calificacion') v = Math.max(1, Math.min(4, Number(value) || 0))
        const next = { ...f, [field]: v }
        const pond = (Number(next.peso) || 0) * (Number(next.calificacion) || 0)
        return { ...next, ponderado: Number(pond.toFixed(2)) }
      })
      return { ...prev, factores }
    })
  }

  return (
    <div>
      <h2 style={{ margin: '12px 0 8px' }}>Matriz MEFE</h2>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>{d.descripcion}</div>

      <div style={{ ...styles.controls }}>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleFileChange} />
        <button onClick={handlePickFile} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Importar JSON</button>
        <button onClick={handleExport} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar JSON</button>
        <button onClick={handleResetDefaults} title="Restaurar desde public/mefe.json" style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Restaurar por defecto</button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Tipo</th>
              <th style={styles.th}>Origen</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Peso</th>
              <th style={styles.th}>Calificación</th>
              <th style={styles.th}>Ponderado</th>
            </tr>
          </thead>
          <tbody>
            {(d.factores || []).map((f) => {
              const ponderado = (Number(f.peso) || 0) * (Number(f.calificacion) || 0)
              return (
                <tr key={f.id}>
                  <td style={styles.td}>{f.id}</td>
                  <td style={styles.td}><span style={styles.chip(f.tipo)}>{f.tipo}</span></td>
                  <td style={styles.td}>{f.origen || ''}</td>
                  <td style={styles.td}>{f.nombre}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={(Number(f.peso) || 0).toString()}
                      onChange={(e) => updateFactor(f.id, 'peso', e.target.value)}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      step={1}
                      value={(Number(f.calificacion) || 0).toString()}
                      onChange={(e) => updateFactor(f.id, 'calificacion', e.target.value)}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td style={styles.td}>{ponderado.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={styles.td} colSpan={4}><strong>Totales</strong></td>
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
              <td style={styles.td}></td>
              <td style={styles.td}><strong>{sumPonderado.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginTop: 10, opacity: 0.8 }}>
        Nota: La suma de pesos debe aproximar 1.0. El total ponderado es guía e idealmente coincide con "total" del JSON ({typeof d.total === 'number' ? d.total.toFixed(2) : 'N/A'}).
      </div>
    </div>
  )
}

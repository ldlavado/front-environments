import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'

// Simple 2x2 DOFA matrix visualization
// Props:
// - data: { fortalezas: {id,texto}[], oportunidades:[], debilidades:[], amenazas:[] }
// If not provided, uses an embedded default dataset.
export default function DofaMatrix({ data }) {
  const defaultData = useMemo(() => ({
    matriz: 'DOFA',
    descripcion: 'Listado cualitativo de Fortalezas, Oportunidades, Debilidades y Amenazas',
    fortalezas: [
      { id: 'FI-01', texto: 'Equipo TI con experiencia en IoT/IA para PdM' },
      { id: 'FI-02', texto: 'Arquitectura cloud con buenas prácticas DevOps' },
      { id: 'FI-03', texto: 'Gobierno de datos y trazabilidad básica' },
    ],
    oportunidades: [
      { id: 'FE-OP-01', texto: 'Política de datos e interoperabilidad (MinTIC)' },
      { id: 'FE-OP-02', texto: 'SLA alto y redundancia multi-región (Proveedor Cloud)' },
      { id: 'FE-OP-03', texto: 'Incentivos a eficiencia energética' },
    ],
    debilidades: [
      { id: 'FI-04', texto: 'Madurez limitada en gestión del cambio' },
      { id: 'FI-05', texto: 'Brecha en métricas de negocio consolidadas' },
      { id: 'FI-06', texto: 'Onboarding de usuarios finales incipiente' },
    ],
    amenazas: [
      { id: 'FE-AM-01', texto: 'Restricciones/demoras presupuestales' },
      { id: 'FE-AM-02', texto: 'Exigencias de cumplimiento y privacidad' },
      { id: 'FE-AM-03', texto: 'Resistencia al cambio del personal' },
    ],
  }), [])

  const [d, setD] = useState(() => {
    try {
      const saved = localStorage.getItem('dofa_data')
      if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
    return data || defaultData
  })
  const [focus, setFocus] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('matrix_focus')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return parsed?.matrix === 'dofa' ? parsed : null
    } catch {
      return null
    }
  })
  const fileRef = useRef(null)
  const matrixRef = useRef(null)

  // Load from public/dofa.json if no external data is passed
  useEffect(() => {
    let cancel = false
    if (!data) {
      ;(async () => {
        try {
          const res = await fetch('/dofa.json', { cache: 'no-store' })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const json = await res.json()
          if (!cancel && json && typeof json === 'object') {
            setD(prev => ({
              matriz: json.matriz || prev.matriz,
              descripcion: json.descripcion || prev.descripcion,
              fortalezas: Array.isArray(json.fortalezas) ? json.fortalezas : prev.fortalezas,
              oportunidades: Array.isArray(json.oportunidades) ? json.oportunidades : prev.oportunidades,
              debilidades: Array.isArray(json.debilidades) ? json.debilidades : prev.debilidades,
              amenazas: Array.isArray(json.amenazas) ? json.amenazas : prev.amenazas,
            }))
          }
        } catch {
          // swallow and keep defaults
        }
      })()
    }
    return () => { cancel = true }
  }, [data])

  // Persist to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('dofa_data', JSON.stringify(d)) } catch { /* ignore */ }
  }, [d])

  useEffect(() => {
    if (typeof window === 'undefined') return () => {}
    const onFocusChange = () => {
      try {
        const stored = localStorage.getItem('matrix_focus')
        if (!stored) return setFocus(null)
        const parsed = JSON.parse(stored)
        if (parsed?.matrix === 'dofa') setFocus(parsed)
        else setFocus(null)
      } catch {
        setFocus(null)
      }
    }
    window.addEventListener('matrix-focus', onFocusChange)
    window.addEventListener('storage', onFocusChange)
    return () => {
      window.removeEventListener('matrix-focus', onFocusChange)
      window.removeEventListener('storage', onFocusChange)
    }
  }, [])

  const skipNextCleanup = useRef(true)
  useEffect(() => {
    if (typeof window === 'undefined') return () => {}
    return () => {
      if (skipNextCleanup.current) {
        skipNextCleanup.current = false
        return
      }
      try {
        const stored = localStorage.getItem('matrix_focus')
        if (!stored) return
        const parsed = JSON.parse(stored)
        if (parsed?.matrix === 'dofa') {
          localStorage.removeItem('matrix_focus')
          window.dispatchEvent(new Event('matrix-focus'))
        }
      } catch { /* ignore */ }
    }
  }, [])

  const handleResetDefaults = async () => {
  try { localStorage.removeItem('dofa_data') } catch { /* ignore */ }
    try {
      const res = await fetch('/dofa.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      setD(json)
    } catch {
      setD(defaultData)
    }
  }

  // Theme tokens from CSS variables with fallbacks
  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: 'auto auto',
      gap: 12,
    },
    title: { fontWeight: 700, marginBottom: 8 },
    subtitle: { opacity: 0.8, marginBottom: 12 },
    list: { margin: 0, paddingLeft: 18 },
    tag: {
      display: 'inline-block',
      fontSize: 12,
      fontWeight: 700,
      background: getComputedStyle(document.documentElement).getPropertyValue('--highlight-bg') || 'rgba(255,255,255,0.07)',
      padding: '2px 6px',
      borderRadius: 6,
      marginRight: 6,
    }
  }

  // Read MEFI/MEFE from localStorage to compute ponderados and order items
  const mefi = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('mefi_data') || 'null') } catch { return null }
  }, [])
  const mefe = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('mefe_data') || 'null') } catch { return null }
  }, [])

  const getPondMEFI = useCallback((id) => {
    if (!mefi || !Array.isArray(mefi.factores)) return null
    const f = mefi.factores.find(x => x.id === id)
    if (!f) return null
    const pond = (Number(f.peso) || 0) * (Number(f.calificacion) || 0)
    return Number(pond.toFixed(2))
  }, [mefi])
  const getPondMEFE = useCallback((id) => {
    if (!mefe || !Array.isArray(mefe.factores)) return null
    const f = mefe.factores.find(x => x.id === id)
    if (!f) return null
    const pond = (Number(f.peso) || 0) * (Number(f.calificacion) || 0)
    return Number(pond.toFixed(2))
  }, [mefe])

  const Item = ({ id, texto }) => {
    const pond = getPondMEFI(id) ?? getPondMEFE(id)
    const matchesFocus = () => {
      if (!focus || focus?.matrix !== 'dofa') return false
      if (focus.id && focus.id === id) return true
      if (Array.isArray(focus.ids) && focus.ids.includes(id)) return true
      return false
    }
    const isFocused = matchesFocus()
    return (
      <li
        style={{
          marginBottom: 6,
          borderRadius: 8,
          padding: '4px 6px',
          background: isFocused ? 'rgba(59,130,246,0.18)' : 'transparent',
          border: isFocused ? '1px solid rgba(59,130,246,0.45)' : '1px solid transparent',
        }}
      >
        <span style={styles.tag}>{id}</span>
        <span>{texto}</span>
        {pond != null && (
          <span style={{ ...styles.tag, marginLeft: 6 }}>pond: {pond.toFixed ? pond.toFixed(2) : pond}</span>
        )}
      </li>
    )
  }

  // Strategies generation
  const strategies = useMemo(() => {
    // Order by ponderado if available
    const F = (d.fortalezas || []).slice().sort((a,b) => (getPondMEFI(b.id) ?? 0) - (getPondMEFI(a.id) ?? 0))
    const O = (d.oportunidades || []).slice().sort((a,b) => (getPondMEFE(b.id) ?? 0) - (getPondMEFE(a.id) ?? 0))
    const D = (d.debilidades || []).slice().sort((a,b) => (getPondMEFI(b.id) ?? 0) - (getPondMEFI(a.id) ?? 0))
    const A = (d.amenazas || []).slice().sort((a,b) => (getPondMEFE(b.id) ?? 0) - (getPondMEFE(a.id) ?? 0))
    const cross = (left, right) => left.flatMap(l => right.map(r => ({ l, r })))
    return {
      FO: cross(F, O).map(({ l, r }) => ({
        key: `${l.id}-${r.id}`,
        text: `Usar la fortaleza “${l.texto}” para aprovechar la oportunidad “${r.texto}”.`,
        score: ((getPondMEFI(l.id) ?? 0) + (getPondMEFE(r.id) ?? 0)).toFixed(2)
      })),
      FA: cross(F, A).map(({ l, r }) => ({
        key: `${l.id}-${r.id}`,
        text: `Usar la fortaleza “${l.texto}” para mitigar la amenaza “${r.texto}”.`,
        score: ((getPondMEFI(l.id) ?? 0) + (getPondMEFE(r.id) ?? 0)).toFixed(2)
      })),
      DO: cross(D, O).map(({ l, r }) => ({
        key: `${l.id}-${r.id}`,
        text: `Reducir la debilidad “${l.texto}” aprovechando la oportunidad “${r.texto}”.`,
        score: ((getPondMEFI(l.id) ?? 0) + (getPondMEFE(r.id) ?? 0)).toFixed(2)
      })),
      DA: cross(D, A).map(({ l, r }) => ({
        key: `${l.id}-${r.id}`,
        text: `Minimizar el impacto de la amenaza “${r.texto}” sobre la debilidad “${l.texto}”.`,
        score: ((getPondMEFI(l.id) ?? 0) + (getPondMEFE(r.id) ?? 0)).toFixed(2)
      })),
    }
  }, [d, getPondMEFI, getPondMEFE])

  const [showFO, setShowFO] = useState(false)
  const [showFA, setShowFA] = useState(false)
  const [showDO, setShowDO] = useState(false)
  const [showDA, setShowDA] = useState(false)

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
        matriz: json.matriz || 'DOFA',
        descripcion: json.descripcion || d.descripcion,
        fortalezas: Array.isArray(json.fortalezas) ? json.fortalezas : d.fortalezas,
        oportunidades: Array.isArray(json.oportunidades) ? json.oportunidades : d.oportunidades,
        debilidades: Array.isArray(json.debilidades) ? json.debilidades : d.debilidades,
        amenazas: Array.isArray(json.amenazas) ? json.amenazas : d.amenazas,
      }
      setD(next)
    } catch (err) {
      alert('No se pudo importar el JSON de DOFA: ' + err.message)
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
      a.download = 'dofa.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar el JSON: ' + err.message)
    }
  }

  const exportStrategiesCSV = () => {
    try {
      const rows = [['tipo','clave','enunciado','score']]
      const pushRows = (tipo, arr) => {
        arr.forEach((it) => {
          rows.push([tipo, it.key || '', (it.text || '').replaceAll('\n',' ').replaceAll('"','""'), it.score ?? ''])
        })
      }
      pushRows('FO', strategies.FO)
      pushRows('FA', strategies.FA)
      pushRows('DO', strategies.DO)
      pushRows('DA', strategies.DA)
      const csv = rows.map(r => r.map(v => `"${String(v)}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'dofa_estrategias.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar CSV: ' + err.message)
    }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(matrixRef.current, 'matriz_dofa.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  return (
    <div ref={matrixRef}>
      <h2 style={{ margin: '12px 0 8px' }}>Matriz DOFA</h2>
      <div style={{ ...styles.subtitle }}>{d.descripcion}</div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0 14px' }} data-export-ignore="true">
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleFileChange} />
        <button onClick={handlePickFile} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Importar JSON</button>
  <button onClick={handleExport} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar JSON</button>
  <button onClick={handleExportPng} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Guardar PNG</button>
  <button onClick={exportStrategiesCSV} title="Exportar estrategias FO/FA/DO/DA a CSV" style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar estrategias (CSV)</button>
        <button onClick={handleResetDefaults} title="Restaurar desde public/dofa.json" style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Restaurar por defecto</button>
      </div>
      <div style={styles.grid}>
        <section className="card">
          <div style={styles.title}>Fortalezas</div>
          <ul style={styles.list}>
            {(d.fortalezas || []).map((f) => (
              <Item key={f.id} id={f.id} texto={f.texto} />
            ))}
          </ul>
        </section>
        <section className="card">
          <div style={styles.title}>Oportunidades</div>
          <ul style={styles.list}>
            {(d.oportunidades || []).map((o) => (
              <Item key={o.id} id={o.id} texto={o.texto} />
            ))}
          </ul>
        </section>
        <section className="card">
          <div style={styles.title}>Debilidades</div>
          <ul style={styles.list}>
            {(d.debilidades || []).map((de) => (
              <Item key={de.id} id={de.id} texto={de.texto} />
            ))}
          </ul>
        </section>
        <section className="card">
          <div style={styles.title}>Amenazas</div>
          <ul style={styles.list}>
            {(d.amenazas || []).map((a) => (
              <Item key={a.id} id={a.id} texto={a.texto} />
            ))}
          </ul>
        </section>
      </div>

      {/* Strategy combinations */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: '12px 0 8px' }}>Estrategias</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.title}>FO (Fortalezas x Oportunidades)</div>
              <button onClick={() => setShowFO(v => !v)} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>{showFO ? 'Ocultar' : 'Ver'}</button>
            </div>
            {showFO && (
              <ul style={styles.list}>
                {strategies.FO.map((it) => (
                  <li key={it.key} style={{ marginBottom: 6 }}>{it.text} {it.score && <strong style={{ marginLeft: 6 }}>(score: {it.score})</strong>}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.title}>FA (Fortalezas x Amenazas)</div>
              <button onClick={() => setShowFA(v => !v)} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>{showFA ? 'Ocultar' : 'Ver'}</button>
            </div>
            {showFA && (
              <ul style={styles.list}>
                {strategies.FA.map((it) => (
                  <li key={it.key} style={{ marginBottom: 6 }}>{it.text} {it.score && <strong style={{ marginLeft: 6 }}>(score: {it.score})</strong>}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.title}>DO (Debilidades x Oportunidades)</div>
              <button onClick={() => setShowDO(v => !v)} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>{showDO ? 'Ocultar' : 'Ver'}</button>
            </div>
            {showDO && (
              <ul style={styles.list}>
                {strategies.DO.map((it) => (
                  <li key={it.key} style={{ marginBottom: 6 }}>{it.text} {it.score && <strong style={{ marginLeft: 6 }}>(score: {it.score})</strong>}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.title}>DA (Debilidades x Amenazas)</div>
              <button onClick={() => setShowDA(v => !v)} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>{showDA ? 'Ocultar' : 'Ver'}</button>
            </div>
            {showDA && (
              <ul style={styles.list}>
                {strategies.DA.map((it) => (
                  <li key={it.key} style={{ marginBottom: 6 }}>{it.text} {it.score && <strong style={{ marginLeft: 6 }}>(score: {it.score})</strong>}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

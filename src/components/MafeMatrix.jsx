import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'

const MAFE_DATA_VERSION = '2024-10-05'

export default function MafeMatrix({ data }) {
  const defaultData = useMemo(() => ({
    version: MAFE_DATA_VERSION,
    matriz: 'MAFE',
    descripcion: 'Cruzamiento estratégico FO/DO/FA/DA a partir de DOFA',
    estrategias: { FO: [], DO: [], FA: [], DA: [] },
  }), [])

  const [d, setD] = useState(() => {
    try {
      const saved = localStorage.getItem('mafe_data')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (!parsed?.version || parsed.version !== MAFE_DATA_VERSION) throw new Error('mafe desactualizada')
        return parsed
      }
    } catch { /* ignore */ }
    if (data) {
      return {
        version: data.version || MAFE_DATA_VERSION,
        matriz: data.matriz || defaultData.matriz,
        descripcion: data.descripcion || defaultData.descripcion,
        estrategias: data.estrategias || defaultData.estrategias,
      }
    }
    return defaultData
  })
  const fileRef = useRef(null)
  const matrixRef = useRef(null)

  // load from public
  useEffect(() => {
    let cancel = false
    if (!data) {
      ;(async () => {
        try {
          const res = await fetch('/mafe.json', { cache: 'no-store' })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const json = await res.json()
          if (!cancel && json && typeof json === 'object') {
            setD(prev => ({
              version: json.version || prev.version || MAFE_DATA_VERSION,
              matriz: json.matriz || prev.matriz,
              descripcion: json.descripcion || prev.descripcion,
              estrategias: json.estrategias || prev.estrategias,
            }))
          }
        } catch {
          // ignore
        }
      })()
    }
    return () => { cancel = true }
  }, [data])

  // persist
  useEffect(() => {
    try { localStorage.setItem('mafe_data', JSON.stringify(d)) } catch { /* ignore */ }
  }, [d])

  // Read MEFI/MEFE for scoring
  const mefi = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('mefi_data') || 'null') } catch { return null }
  }, [])
  const mefe = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('mefe_data') || 'null') } catch { return null }
  }, [])

  const getPondMEFI = useCallback((id) => {
    if (!mefi || !Array.isArray(mefi.factores)) return 0
    const f = mefi.factores.find(x => x.id === id)
    if (!f) return 0
    return (Number(f.peso) || 0) * (Number(f.calificacion) || 0)
  }, [mefi])
  const getPondMEFE = useCallback((id) => {
    if (!mefe || !Array.isArray(mefe.factores)) return 0
    const f = mefe.factores.find(x => x.id === id)
    if (!f) return 0
    return (Number(f.peso) || 0) * (Number(f.calificacion) || 0)
  }, [mefe])

  const computeScore = useCallback((estr) => {
    // Sum ponderados de todos los IDs involucrados
    const { cruce } = estr
    let sum = 0
    if (cruce?.F) sum += cruce.F.reduce((a, id) => a + getPondMEFI(id), 0)
    if (cruce?.D) sum += cruce.D.reduce((a, id) => a + getPondMEFI(id), 0)
    if (cruce?.O) sum += cruce.O.reduce((a, id) => a + getPondMEFE(id), 0)
    if (cruce?.A) sum += cruce.A.reduce((a, id) => a + getPondMEFE(id), 0)
    return Number(sum.toFixed(2))
  }, [getPondMEFI, getPondMEFE])

  const sections = useMemo(() => ([
    { key: 'FO', title: 'FO (Fortalezas x Oportunidades)' },
    { key: 'DO', title: 'DO (Debilidades x Oportunidades)' },
    { key: 'FA', title: 'FA (Fortalezas x Amenazas)' },
    { key: 'DA', title: 'DA (Debilidades x Amenazas)' },
  ]), [])

  const styles = {
    tag: {
      display: 'inline-block',
      fontSize: 12,
      fontWeight: 700,
      background: getComputedStyle(document.documentElement).getPropertyValue('--highlight-bg') || 'rgba(255,255,255,0.07)',
      padding: '2px 6px',
      borderRadius: 6,
      marginRight: 6,
    },
  }

  const filePick = () => fileRef.current?.click()
  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (!json || typeof json !== 'object') throw new Error('JSON inválido')
      setD({
        version: json.version || d.version || MAFE_DATA_VERSION,
        matriz: json.matriz || 'MAFE',
        descripcion: json.descripcion || d.descripcion,
        estrategias: json.estrategias || d.estrategias,
      })
    } catch (err) {
      alert('No se pudo importar el JSON de MAFE: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }
  const onExport = () => {
    try {
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mafe.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar el JSON: ' + err.message)
    }
  }
  const exportCSV = () => {
    try {
      const rows = [['tipo','id','enunciado','score','F','D','O','A']]
      const all = [
        ...((d.estrategias?.FO)||[]).map(e=>({tipo:'FO',...e})),
        ...((d.estrategias?.DO)||[]).map(e=>({tipo:'DO',...e})),
        ...((d.estrategias?.FA)||[]).map(e=>({tipo:'FA',...e})),
        ...((d.estrategias?.DA)||[]).map(e=>({tipo:'DA',...e})),
      ]
      all.forEach(e => {
        const esc = computeScore(e)
        rows.push([
          e.tipo,
          e.id || '',
          (e.enunciado || '').replaceAll('\n',' ').replaceAll('"','""'),
          esc.toFixed(2),
          (e.cruce?.F||[]).join('|'),
          (e.cruce?.D||[]).join('|'),
          (e.cruce?.O||[]).join('|'),
          (e.cruce?.A||[]).join('|'),
        ])
      })
      const csv = rows.map(r => r.map(v => `"${String(v)}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mafe_estrategias.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar CSV: ' + err.message)
    }
  }

  const onReset = async () => {
    try { localStorage.removeItem('mafe_data') } catch { /* ignore */ }
    try {
      const res = await fetch('/mafe.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      setD(json)
    } catch {
      setD(defaultData)
    }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(matrixRef.current, 'matriz_mafe.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const focusDofaElements = useCallback((cruce) => {
    if (typeof window === 'undefined') return
    const ids = ['F', 'D', 'O', 'A']
      .flatMap((key) => Array.isArray(cruce?.[key]) ? cruce[key] : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean)
    if (!ids.length) return
    const payload = {
      matrix: 'dofa',
      ids: Array.from(new Set(ids)),
      from: 'mafe',
      ts: Date.now(),
    }
    try { localStorage.setItem('matrix_focus', JSON.stringify(payload)) } catch { /* ignore */ }
    if (window.location.hash !== '#dofa') {
      window.location.hash = 'dofa'
    }
    window.dispatchEvent(new Event('matrix-focus'))
    setTimeout(() => window.dispatchEvent(new Event('matrix-focus')), 60)
  }, [])

  return (
    <>
    <div ref={matrixRef}>
      <h2 style={{ margin: '12px 0 8px' }}>Matriz MAFE</h2>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>{d.descripcion}</div>

      <div style={{ display: 'flex', gap: 8, margin: '8px 0 14px' }} data-export-ignore="true">
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onFileChange} />
        <button onClick={filePick} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Importar JSON</button>
  <button onClick={onExport} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar JSON</button>
  <button onClick={handleExportPng} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Guardar PNG</button>
  <button onClick={exportCSV} title="Exportar estrategias a CSV" style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar estrategias (CSV)</button>
        <button onClick={onReset} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Restaurar por defecto</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {sections.map(sec => {
          const arr = (d.estrategias?.[sec.key] || []).map(es => ({ ...es, score: computeScore(es) }))
          arr.sort((a,b) => b.score - a.score)
          return (
            <section key={sec.key} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>{sec.title}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>Total: {arr.length}</div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, marginTop: 8 }}>
                {arr.map((es) => (
                  <li key={es.id} style={{ marginBottom: 8 }}>
                    <span style={styles.tag}>{es.id}</span>
                    <span>{es.enunciado}</span>
                    <span style={{ ...styles.tag, marginLeft: 8 }}>score: {es.score.toFixed(2)}</span>
                    <div style={{ marginTop: 4, opacity: 0.8 }}>
                      {es.cruce?.F && <span style={{ ...styles.tag }}>F: {es.cruce.F.join(', ')}</span>}
                      {es.cruce?.D && <span style={{ ...styles.tag }}>D: {es.cruce.D.join(', ')}</span>}
                      {es.cruce?.O && <span style={{ ...styles.tag }}>O: {es.cruce.O.join(', ')}</span>}
                      {es.cruce?.A && <span style={{ ...styles.tag }}>A: {es.cruce.A.join(', ')}</span>}
                    </div>
                    <button
                      onClick={() => focusDofaElements(es.cruce)}
                      style={{
                        marginTop: 6,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`,
                        cursor: 'pointer',
                        background: 'transparent',
                        color: 'inherit',
                      }}
                      data-export-ignore="true"
                    >
                      Ver en DOFA
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  </>
  )
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function MafeMatrix({ data }) {
  const defaultData = useMemo(() => ({
    matriz: 'MAFE',
    descripcion: 'Cruzamiento estratégico FO/DO/FA/DA a partir de DOFA',
    estrategias: { FO: [], DO: [], FA: [], DA: [] },
  }), [])

  const [d, setD] = useState(() => {
    try {
      const saved = localStorage.getItem('mafe_data')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return data || defaultData
  })
  const fileRef = useRef(null)

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
    modalOverlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
      background: getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#0b1220',
      color: getComputedStyle(document.documentElement).getPropertyValue('--card-fg') || '#e5e7eb',
      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`,
      borderRadius: 10,
      padding: 16,
      width: 'min(680px, 94vw)'
    },
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

  const promoteToMML = (estr) => {
    // Open modal to choose Component or Activity
    setPromo({ open: true, estr })
  }

  // Promotion modal state
  const [promo, setPromo] = useState({ open: false, estr: null })
  const [promoType, setPromoType] = useState('actividad') // 'actividad' | 'componente'
  const [form, setForm] = useState({
    id: '',
    resultado: '',
    descripcion: '',
    indicadores: '', // CSV nombre|meta|MV
    insumos: '',
    supuestos: '',
  })

  useEffect(() => {
    if (!promo.open || !promo.estr) return
    const base = promo.estr
    const seedText = `${base.id ? base.id + ': ' : ''}${base.enunciado}`
    const seedInsumos = []
    if (base.cruce?.F?.length) seedInsumos.push('Apalancar F: ' + base.cruce.F.join(', '))
    if (base.cruce?.D?.length) seedInsumos.push('Mitigar D: ' + base.cruce.D.join(', '))
    if (base.cruce?.O?.length) seedInsumos.push('Aprovechar O: ' + base.cruce.O.join(', '))
    if (base.cruce?.A?.length) seedInsumos.push('Mitigar A: ' + base.cruce.A.join(', '))
    setPromoType('actividad')
    setForm({ id: '', resultado: seedText, descripcion: seedText, indicadores: '', insumos: seedInsumos.join('; '), supuestos: 'Recursos y patrocinios disponibles' })
  }, [promo.open, promo.estr])

  const ensureMML = async () => {
    // Make sure mml_data exists in localStorage, else fetch defaults
    try {
      const raw = localStorage.getItem('mml_data')
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    try {
      const res = await fetch('/mml.json', { cache: 'no-store' })
      const json = await res.json()
      try { localStorage.setItem('mml_data', JSON.stringify(json)) } catch { /* ignore */ }
      return json
    } catch {
      return null
    }
  }

  const parseIndicators = (str) => {
    // Format: name|meta|MV; name2|meta2|MV2
    const arr = (str || '').split(';').map(s => s.trim()).filter(Boolean)
    return arr.map((row, idx) => {
      const [nombre, meta, mv] = row.split('|').map(x => (x || '').trim())
      return { id: `IND-${idx + 1}`, nombre, meta: meta || '', medio_verificacion: mv || '' }
    })
  }

  const onSavePromo = async () => {
    try {
      const mml = await ensureMML()
      if (!mml) {
        alert('No se pudo inicializar MML')
        return
      }
      const next = { ...mml }
      if (promoType === 'componente') {
        const list = Array.isArray(next.componentes) ? [...next.componentes] : []
        const newId = form.id?.trim() || `COMP-${list.length + 1}`
        const item = {
          id: newId,
          resultado: form.resultado || form.descripcion,
          indicadores: parseIndicators(form.indicadores),
          supuestos: (form.supuestos || '').split(';').map(s=>s.trim()).filter(Boolean),
        }
        list.push(item)
        next.componentes = list
        localStorage.setItem('mml_data', JSON.stringify(next))
        alert(`Componente creado: ${newId}`)
      } else {
        const list = Array.isArray(next.actividades) ? [...next.actividades] : []
        const newId = form.id?.trim() || `ACT-${list.length + 1}`
        const item = {
          id: newId,
          descripcion: form.descripcion || form.resultado,
          insumos: (form.insumos || '').split(';').map(s=>s.trim()).filter(Boolean),
          supuestos: (form.supuestos || '').split(';').map(s=>s.trim()).filter(Boolean),
        }
        list.push(item)
        next.actividades = list
        localStorage.setItem('mml_data', JSON.stringify(next))
        alert(`Actividad creada: ${newId}`)
      }
      setPromo({ open: false, estr: null })
    } catch (err) {
      alert('Error al guardar: ' + err.message)
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

  return (
    <>
    <div>
      <h2 style={{ margin: '12px 0 8px' }}>Matriz MAFE</h2>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>{d.descripcion}</div>

      <div style={{ display: 'flex', gap: 8, margin: '8px 0 14px' }}>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onFileChange} />
        <button onClick={filePick} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Importar JSON</button>
  <button onClick={onExport} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar JSON</button>
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
                    <button onClick={() => promoteToMML(es)} style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, cursor: 'pointer' }}>Promover a MML</button>
                    <div style={{ marginTop: 4, opacity: 0.8 }}>
                      {es.cruce?.F && <span style={{ ...styles.tag }}>F: {es.cruce.F.join(', ')}</span>}
                      {es.cruce?.D && <span style={{ ...styles.tag }}>D: {es.cruce.D.join(', ')}</span>}
                      {es.cruce?.O && <span style={{ ...styles.tag }}>O: {es.cruce.O.join(', ')}</span>}
                      {es.cruce?.A && <span style={{ ...styles.tag }}>A: {es.cruce.A.join(', ')}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
    {promo.open && (
      <div style={styles.modalOverlay} role="dialog" aria-modal="true">
        <div style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Promover estrategia a MML</h3>
            <button onClick={() => setPromo({ open: false, estr: null })} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', color: 'inherit', fontSize: 18, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div>
              <label style={{ marginRight: 8 }}>
                <input type="radio" name="ptype" checked={promoType==='actividad'} onChange={()=>setPromoType('actividad')} /> Actividad
              </label>
              <label>
                <input type="radio" name="ptype" checked={promoType==='componente'} onChange={()=>setPromoType('componente')} /> Componente
              </label>
            </div>
            <div>
              <label>ID (opcional):</label>
              <input value={form.id} onChange={(e)=>setForm(f=>({ ...f, id: e.target.value }))} style={{ width: '100%' }} />
            </div>
            {promoType === 'componente' ? (
              <>
                <div>
                  <label>Resultado del componente:</label>
                  <textarea value={form.resultado} onChange={(e)=>setForm(f=>({ ...f, resultado: e.target.value }))} rows={3} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>Indicadores (nombre|meta|MV; ...):</label>
                  <textarea value={form.indicadores} onChange={(e)=>setForm(f=>({ ...f, indicadores: e.target.value }))} rows={2} style={{ width: '100%' }} placeholder="Exactitud F1|≥0.80|Logs de model serving; Cobertura|≥90%|Inventario" />
                </div>
                <div>
                  <label>Supuestos (separa con ;):</label>
                  <input value={form.supuestos} onChange={(e)=>setForm(f=>({ ...f, supuestos: e.target.value }))} style={{ width: '100%' }} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label>Descripción de la actividad:</label>
                  <textarea value={form.descripcion} onChange={(e)=>setForm(f=>({ ...f, descripcion: e.target.value }))} rows={3} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>Insumos (separa con ;):</label>
                  <input value={form.insumos} onChange={(e)=>setForm(f=>({ ...f, insumos: e.target.value }))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>Supuestos (separa con ;):</label>
                  <input value={form.supuestos} onChange={(e)=>setForm(f=>({ ...f, supuestos: e.target.value }))} style={{ width: '100%' }} />
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setPromo({ open: false, estr: null })}>Cancelar</button>
            <button onClick={onSavePromo} style={{ fontWeight: 700 }}>Guardar en MML</button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

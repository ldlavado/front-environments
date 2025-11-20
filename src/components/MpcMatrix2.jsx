import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'

const COMPETITOR_BLUEPRINTS = [
  {
    id: 'cloud-msp',
    nombre: 'Alianza cloud multi-región (Camino A)',
    enfoque: 'Partners AWS/GCP/Azure con SRE 24/7',
    descripcion: 'Replica el Camino A descrito en la MML: topología activa-activa en múltiples regiones cloud y runbooks HA/DR.',
    referencias: ['MML SOL-1', 'MAFE FO-01-P1', 'FA-02-P1'],
    calificaciones: {
      'FI-01': { valor: 4, nota: 'Escuadras IoT/IA y SRE especializadas en FO-01-P1.' },
      'FI-02': { valor: 4, nota: 'Arquitectura DevOps e IaC multi-región (Camino A).' },
      'FI-03': { valor: 3, nota: 'Controles Zero-Trust y trazabilidad (FA-02), pero requiere datos locales.' },
      'FI-04': { valor: 2, nota: 'La gestión del cambio recae en el cliente (DA-01).' },
      'FI-05': { valor: 2, nota: 'Necesita datamarts del cliente para cerrar la brecha MTBF/MTTR (DO-02).' },
      'FI-06': { valor: 2, nota: 'Onboarding de usuarios transferido a equipos internos.' },
    }
  },
  {
    id: 'hybrid-edge',
    nombre: 'Integrador OT/IT híbrido (Camino B)',
    enfoque: 'Edge local + respaldo nube operado por cuadrillas OT/IT',
    descripcion: 'Corresponde al Camino B: infraestructura híbrida con despliegues en sitio y acompañamiento operacional.',
    referencias: ['MML SOL-2', 'MAFE DO-01-P1', 'MAFE DA-01'],
    calificaciones: {
      'FI-01': { valor: 3, nota: 'Equipos OT con experiencia IoT aplican playbooks DO-01.' },
      'FI-02': { valor: 3, nota: 'Integra edge y nube pero con menos automatización multi-región.' },
      'FI-03': { valor: 2, nota: 'Gobierno de datos limitado; depende del cliente para trazabilidad.' },
      'FI-04': { valor: 3, nota: 'Tiene células en campo para gestión del cambio (DA-01).' },
      'FI-05': { valor: 2, nota: 'Apoya captura de KPIs pero no lidera datamarts financieros.' },
      'FI-06': { valor: 3, nota: 'Onboarding presencial y academias OT/IT.' },
    }
  },
  {
    id: 'onprem-activo',
    nombre: 'Operador data center activo-activo (Camino C)',
    enfoque: 'Servicios gestionados on-prem con foco regulatorio',
    descripcion: 'Basado en el Camino C: dos sitios físicos activo-activo y contratos CAPEX/OPEX tradicionales.',
    referencias: ['MML SOL-3', 'FA-01-P1'],
    calificaciones: {
      'FI-01': { valor: 2, nota: 'Limitada experiencia en IA/IoT; prioriza hardware y operación.' },
      'FI-02': { valor: 2, nota: 'DevOps parcial; cambios siguen ciclos tradicionales.' },
      'FI-03': { valor: 4, nota: 'Fuerte en controles y auditoría in situ.' },
      'FI-04': { valor: 2, nota: 'Gestiona el cambio vía procesos contractuales, con poca flexibilidad.' },
      'FI-05': { valor: 3, nota: 'Reportes financieros/TCO incluyen métricas de disponibilidad.' },
      'FI-06': { valor: 2, nota: 'Onboarding depende del cliente; foco principal es infraestructura.' },
    }
  },
  {
    id: 'draas-operador',
    nombre: 'Proveedor DRaaS regional (Camino D)',
    enfoque: 'DRaaS con runbooks asistidos y pago por uso',
    descripcion: 'Sigue el Camino D: servicio DRaaS gestionado con activación bajo demanda y foco en costos.',
    referencias: ['MML SOL-4', 'DA-02-P1'],
    calificaciones: {
      'FI-01': { valor: 3, nota: 'Cuenta con especialistas en failover y runbooks DR.' },
      'FI-02': { valor: 3, nota: 'Automatiza pruebas HA/DR pero depende de plantillas estándar.' },
      'FI-03': { valor: 2, nota: 'Trazabilidad basada en logs del proveedor; limitada personalización.' },
      'FI-04': { valor: 2, nota: 'La gestión del cambio se transfiere al cliente.' },
      'FI-05': { valor: 2, nota: 'Indicadores financieros se concentran en ahorro OPEX, no en MTBF/MTTR.' },
      'FI-06': { valor: 2, nota: 'Enfoque en activaciones técnicas más que en adopción de usuarios.' },
    }
  }
]

const clampScore = (value, min = 1, max = 4) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return min
  return Math.max(min, Math.min(max, num))
}

const readLocalJson = (key) => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const normalizeCalificaciones = (calificaciones = {}) => {
  const entries = Object.entries(calificaciones)
  return entries.reduce((acc, [fid, payload]) => {
    if (payload && typeof payload === 'object') {
      acc[fid] = {
        valor: clampScore(payload.valor ?? payload.score ?? payload.calificacion ?? 0),
        nota: payload.nota ?? payload.justificacion ?? payload.nota ?? ''
      }
    } else {
      acc[fid] = { valor: clampScore(payload ?? 0), nota: '' }
    }
    return acc
  }, {})
}

const buildDefaultCompetitors = () => COMPETITOR_BLUEPRINTS.map((comp) => ({
  ...comp,
  calificaciones: normalizeCalificaciones(comp.calificaciones)
}))

const fetchMatrix = async (path) => {
  try {
    const res = await fetch(path, { cache: 'no-store' })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    return json
  } catch {
    return null
  }
}

const mergeInternalFactors = (dofa, mefi) => {
  const result = []
  if (!dofa && !mefi) return result
  const seen = new Set()
  const mefiMap = new Map((mefi?.factores || []).map((f) => [f.id, f]))

  const pushItem = (item, tipoFallback) => {
    if (!item?.id || seen.has(item.id)) return
    seen.add(item.id)
    const meta = mefiMap.get(item.id)
    const basePeso = Number(meta?.peso ?? item.peso ?? 0)
    result.push({
      id: item.id,
      tipo: tipoFallback || meta?.tipo || 'interno',
      nombre: item.nombre || item.texto || meta?.nombre || item.id,
      descripcion: item.texto || meta?.nombre || '',
      peso: basePeso > 0 ? Number(basePeso) : 0,
      evidencia: meta?.evidencia || [],
    })
  }

  ;(dofa?.fortalezas || []).forEach((f) => pushItem({ ...f, nombre: f.texto }, 'fortaleza'))
  ;(dofa?.debilidades || []).forEach((d) => pushItem({ ...d, nombre: d.texto }, 'debilidad'))

  ;(mefi?.factores || []).forEach((f) => pushItem(f, f.tipo))

  const totalWeight = result.reduce((acc, f) => acc + (Number(f.peso) || 0), 0)
  if (totalWeight <= 0 && result.length) {
    const uniform = Number((1 / result.length).toFixed(3))
    return result.map((f) => ({ ...f, peso: uniform }))
  }
  return result
}

export default function MpcMatrix2() {
  const [dofa, setDofa] = useState(() => readLocalJson('dofa_data'))
  const [mefi, setMefi] = useState(() => readLocalJson('mefi_data'))
  const [competidores, setCompetidores] = useState(() => readLocalJson('mpc2_competitors') || buildDefaultCompetitors())
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)
  const matrixRef = useRef(null)

  useEffect(() => {
    let cancel = false
    if (!dofa) {
      fetchMatrix('/dofa.json').then((json) => {
        if (!cancel && json) setDofa(json)
      })
    }
    return () => { cancel = true }
  }, [dofa])

  useEffect(() => {
    let cancel = false
    if (!mefi) {
      fetchMatrix('/mefi.json').then((json) => {
        if (!cancel && json) setMefi(json)
      })
    }
    return () => { cancel = true }
  }, [mefi])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('mpc2_competitors', JSON.stringify(competidores))
    } catch {
      /* ignore */
    }
  }, [competidores])

  const factors = useMemo(() => mergeInternalFactors(dofa, mefi), [dofa, mefi])
  const sumPeso = useMemo(() => factors.reduce((acc, f) => acc + (Number(f.peso) || 0), 0), [factors])

  const totals = useMemo(() => {
    const output = {}
    factors.forEach((factor) => {
      const peso = Number(factor.peso) || 0
      competidores.forEach((comp) => {
        const score = Number(comp?.calificaciones?.[factor.id]?.valor) || 0
        output[comp.id] = (output[comp.id] || 0) + peso * score
      })
    })
    return output
  }, [factors, competidores])

  const bestCompetitor = useMemo(() => {
    const entries = Object.entries(totals)
    if (!entries.length) return null
    const [id, total] = entries.sort((a, b) => b[1] - a[1])[0]
    const comp = competidores.find((c) => c.id === id)
    if (!comp) return null
    return { ...comp, total }
  }, [totals, competidores])

  const styles = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        border: '#2a2f45',
        highlight: 'rgba(59,130,246,0.15)',
        tableBorder: '#2a2f45'
      }
    }
    const root = getComputedStyle(document.documentElement)
    return {
      border: root.getPropertyValue('--border')?.trim() || '#2a2f45',
      highlight: root.getPropertyValue('--highlight-bg')?.trim() || 'rgba(59,130,246,0.15)',
      tableBorder: root.getPropertyValue('--border')?.trim() || '#2a2f45'
    }
  }, [])

  const updateScore = (compId, factorId, value) => {
    setCompetidores((prev) => prev.map((comp) => {
      if (comp.id !== compId) return comp
      return {
        ...comp,
        calificaciones: {
          ...(comp.calificaciones || {}),
          [factorId]: {
            ...(comp.calificaciones?.[factorId] || {}),
            valor: clampScore(value)
          }
        }
      }
    }))
  }

  const handleExport = () => {
    try {
      const payload = {
        matriz: 'MPC_2',
        actualizado: new Date().toISOString(),
        competidores
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mpc2_competidores.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar el JSON: ' + err.message)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const list = Array.isArray(json?.competidores) ? json.competidores : Array.isArray(json) ? json : null
      if (!list) throw new Error('Estructura esperada: { competidores: [] }')
      const normalized = list.map((comp) => ({
        ...comp,
        calificaciones: normalizeCalificaciones(comp.calificaciones)
      }))
      setCompetidores(normalized)
    } catch (err) {
      alert('No se pudo importar el JSON: ' + err.message)
    } finally {
      event.target.value = ''
      setImporting(false)
    }
  }

  const handleReset = () => setCompetidores(buildDefaultCompetitors())

  const syncMatrices = useCallback(() => {
    const nextDofa = readLocalJson('dofa_data')
    const nextMefi = readLocalJson('mefi_data')
    if (nextDofa) setDofa(nextDofa)
    if (nextMefi) setMefi(nextMefi)
  }, [])

  const handleExportPng = useCallback(async () => {
    if (!matrixRef.current) return
    try {
      await downloadElementAsPng(matrixRef.current, 'mpc2_matriz.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const competitorSummaries = useMemo(() => competidores.map((comp) => {
    const sorted = factors.map((factor) => ({
      factor,
      score: Number(comp?.calificaciones?.[factor.id]?.valor) || 0
    })).sort((a, b) => b.score - a.score)
    return {
      ...comp,
      mejores: sorted.slice(0, 2),
      brechas: sorted.slice(-1)
    }
  }), [competidores, factors])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: '12px 0 8px' }}>Matriz MPC_2 (Competidores vs factores internos)</h2>
        {bestCompetitor && (
          <div style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${styles.border}`, fontSize: 14 }}>
            Mejor posicionamiento actual: <strong>{bestCompetitor.nombre}</strong> ({bestCompetitor.total.toFixed(2)})
          </div>
        )}
      </div>
      <p style={{ opacity: 0.85, marginTop: 0 }}>
        Esta versión toma las fortalezas y debilidades de DOFA/MEFI como factores internos
        y cruza cuatro competidores plausibles identificados a partir de los caminos estratégicos de la MML (Camino A-D).
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 14px' }} data-export-ignore="true">
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileRef.current?.click()} disabled={importing} style={{ border: `1px solid ${styles.border}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
          Importar JSON
        </button>
        <button onClick={handleExport} style={{ border: `1px solid ${styles.border}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
          Exportar JSON
        </button>
        <button onClick={handleExportPng} style={{ border: `1px solid ${styles.border}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
          Guardar PNG
        </button>
        <button onClick={handleReset} style={{ border: `1px solid ${styles.border}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
          Restaurar competidores sugeridos
        </button>
        <button onClick={syncMatrices} style={{ border: `1px solid ${styles.border}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
          Sincronizar DOFA/MEFI locales
        </button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Competidores identificados</div>
        {competitorSummaries.length ? (
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {competitorSummaries.map((comp) => (
              <div key={comp.id} style={{ border: `1px solid ${styles.border}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{comp.nombre}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{comp.enfoque}</div>
                <p style={{ marginTop: 6, marginBottom: 6 }}>{comp.descripcion}</p>
                {comp.referencias?.length ? (
                  <div style={{ fontSize: 12, marginBottom: 6 }}>
                    <strong>Referencias:</strong> {comp.referencias.join(', ')}
                  </div>
                ) : null}
                {comp.mejores?.length ? (
                  <div style={{ fontSize: 12 }}>
                    <strong>Factores fuertes:</strong> {comp.mejores.map((m) => m.factor?.id).join(', ')}
                  </div>
                ) : null}
                {comp.brechas?.length ? (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    <strong>Brecha:</strong> {comp.brechas.map((b) => b.factor?.id).join(', ')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>No hay competidores cargados.</div>
        )}
      </div>

      <div ref={matrixRef}>
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px' }}>Factor interno (DOFA/MEFI)</th>
                <th style={{ textAlign: 'left', borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px' }}>Tipo</th>
                <th style={{ textAlign: 'left', borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px' }}>Peso</th>
                {competidores.map((comp) => (
                  <th key={comp.id} style={{ textAlign: 'left', borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px' }}>
                    {comp.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {factors.map((factor) => (
                <tr key={factor.id}>
                  <td style={{ borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px' }}>
                    <strong>{factor.id}</strong> – {factor.nombre}
                    {factor.descripcion && <div style={{ fontSize: 12, opacity: 0.85 }}>{factor.descripcion}</div>}
                    {Array.isArray(factor.evidencia) && factor.evidencia.length ? (
                      <ul style={{ margin: '4px 0 0 16px', fontSize: 12, opacity: 0.8 }}>
                        {factor.evidencia.slice(0, 2).map((ev, idx) => <li key={idx}>{ev}</li>)}
                      </ul>
                    ) : null}
                  </td>
                  <td style={{ borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px', textTransform: 'capitalize' }}>
                    {factor.tipo}
                  </td>
                  <td style={{ borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px' }}>
                    {Number(factor.peso).toFixed(2)}
                  </td>
                  {competidores.map((comp) => {
                    const entry = comp.calificaciones?.[factor.id] || { valor: 0 }
                    const ponderado = (Number(factor.peso) || 0) * (Number(entry.valor) || 0)
                    return (
                      <td key={`${comp.id}-${factor.id}`} style={{ borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min={1}
                            max={4}
                            step={1}
                            value={entry.valor}
                            onChange={(e) => updateScore(comp.id, factor.id, e.target.value)}
                            style={{ width: 60 }}
                          />
                          <div style={{ fontSize: 12, opacity: 0.75 }}>pond: {ponderado.toFixed(2)}</div>
                        </div>
                        {entry.nota ? (
                          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>{entry.nota}</div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '8px 6px' }}><strong>Totales ponderados</strong></td>
                <td></td>
                <td style={{ padding: '8px 6px' }}>
                  <strong>{sumPeso.toFixed(2)}</strong>
                  {Math.abs(sumPeso - 1) > 0.01 ? (
                    <span style={{ marginLeft: 6, color: '#f97316', fontWeight: 600 }}>Ajusta pesos en MEFI</span>
                  ) : (
                    <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 600 }}>Pesos OK</span>
                  )}
                </td>
                {competidores.map((comp) => (
                  <td key={`${comp.id}-total`} style={{ padding: '8px 6px' }}>
                    <strong>{(totals[comp.id] || 0).toFixed(2)}</strong>
                    {bestCompetitor?.id === comp.id && (
                      <span style={{ marginLeft: 6, fontSize: 12, color: '#16a34a' }}>▲</span>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
          Escala sugerida: 1 = respuesta deficiente frente al factor interno, 4 = respuesta superior.
          Ajusta los valores para reflejar la evidencia de cada competidor. Los pesos se heredan de MEFI.
        </div>
      </div>
    </div>
  )
}

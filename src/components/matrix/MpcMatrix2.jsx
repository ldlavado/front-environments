import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../../utils/downloadElementAsPng'

const COMPETITOR_BLUEPRINTS = [
  {
    id: 'cloud-msp',
    nombre: 'Alianza cloud multi-región (Camino A)',
    enfoque: 'Partners AWS/GCP/Azure con SRE 24/7',
    descripcion: 'Topología activa-activa en múltiples regiones cloud con runbooks HA/DR y automatización.',
    calificaciones: {
      'HA-01': { valor: 4, nota: 'RTO/RPO < 5 min validado trimestralmente.' },
      'HA-02': { valor: 4, nota: 'Regiones múltiples y baja latencia con edge cache.' },
      'HA-03': { valor: 3, nota: 'Plantillas IaC multi-cloud reducen lock-in parcial.' },
      'HA-04': { valor: 3, nota: 'Modelo OPEX alto pero optimizable con reservas.' },
      'HA-05': { valor: 4, nota: 'Controles Zero-Trust y bitácoras auditables.' },
      'HA-06': { valor: 4, nota: 'SRE 24/7 y soporte especializado.' },
      'HA-07': { valor: 3, nota: 'Conectores a datamarts; requiere afinamiento de métricas.' },
    }
  },
  {
    id: 'hybrid-edge',
    nombre: 'Integrador OT/IT híbrido (Camino B)',
    enfoque: 'Edge local + respaldo nube operado por cuadrillas OT/IT',
    descripcion: 'Infraestructura híbrida con despliegues en sitio y acompañamiento operacional.',
    calificaciones: {
      'HA-01': { valor: 3, nota: 'RTO/RPO moderado; failover parcial probado.' },
      'HA-02': { valor: 3, nota: 'Baja latencia en sitio; resiliencia depende de enlaces.' },
      'HA-03': { valor: 3, nota: 'Topologías híbridas reducen lock-in con esfuerzo.' },
      'HA-04': { valor: 3, nota: 'Balance CAPEX/OPEX; costos edge + cloud.' },
      'HA-05': { valor: 3, nota: 'Cumplimiento mixto; trazabilidad en sitio y nube.' },
      'HA-06': { valor: 3, nota: 'Cuadrillas OT/IT y soporte en campo.' },
      'HA-07': { valor: 2, nota: 'Limitada gobernanza de datos centralizada.' },
    }
  },
  {
    id: 'onprem-activo',
    nombre: 'Operador data center activo-activo (Camino C)',
    enfoque: 'Servicios gestionados on-prem con foco regulatorio',
    descripcion: 'Basado en el Camino C: dos sitios físicos activo-activo y contratos CAPEX/OPEX tradicionales.',
    calificaciones: {
      'HA-01': { valor: 3, nota: 'RTO/RPO depende de fibras y replicación síncrona.' },
      'HA-02': { valor: 2, nota: 'Latencia local excelente, sin multi-región.' },
      'HA-03': { valor: 2, nota: 'Alto lock-in a vendor de hardware/colo.' },
      'HA-04': { valor: 2, nota: 'CAPEX elevado y OPEX fijo; eficiencia variable.' },
      'HA-05': { valor: 4, nota: 'Auditoría y compliance fuertes en sitio.' },
      'HA-06': { valor: 3, nota: 'Soporte on-site programado.' },
      'HA-07': { valor: 2, nota: 'Gobierno de datos requiere proyectos extra.' },
    }
  },
  {
    id: 'draas-operador',
    nombre: 'Proveedor DRaaS regional (Camino D)',
    enfoque: 'DRaaS con runbooks asistidos y pago por uso',
    descripcion: 'Servicio DRaaS gestionado con activación bajo demanda y foco en costos.',
    calificaciones: {
      'HA-01': { valor: 3, nota: 'Activaciones planificadas; RTO bajo en escenarios soportados.' },
      'HA-02': { valor: 3, nota: 'Dependencia de conectividad hacia región DR.' },
      'HA-03': { valor: 3, nota: 'Plantillas IaC y portabilidad moderada.' },
      'HA-04': { valor: 4, nota: 'Pago por uso reduce CAPEX.' },
      'HA-05': { valor: 2, nota: 'Trazabilidad basada en logs estándar; menor personalización.' },
      'HA-06': { valor: 3, nota: 'Soporte gestionado enfocado en failover.' },
      'HA-07': { valor: 2, nota: 'Dashboards de métricas limitados; requiere integración.' },
    }
  }
]

const DEFAULT_VARIABLES = [
  { id: 'HA-01', nombre: 'RTO/RPO validado y pruebas HA/DR', descripcion: 'Capacidad de conmutar con RTO/RPO ≤5 min y pruebas trimestrales automatizadas.', peso: 0.20 },
  { id: 'HA-02', nombre: 'Cobertura multi-región y latencia', descripcion: 'Disponibilidad en múltiples regiones y baja latencia hacia sitios críticos/locales.', peso: 0.18 },
  { id: 'HA-03', nombre: 'Portabilidad y lock-in', descripcion: 'Uso de IaC, multi-cloud/edge y contratos que minimicen dependencia del proveedor.', peso: 0.12 },
  { id: 'HA-04', nombre: 'TCO 3 años (CAPEX/OPEX)', descripcion: 'Costo total, elasticidad y opciones de pago por uso/reservas.', peso: 0.14 },
  { id: 'HA-05', nombre: 'Seguridad, compliance y trazabilidad', descripcion: 'Controles Zero-Trust, auditoría y bitácoras alineadas a normativas.', peso: 0.14 },
  { id: 'HA-06', nombre: 'Soporte 24/7 y acompañamiento', descripcion: 'SRE/NOC 24/7, tiempos de respuesta y soporte en campo/edge.', peso: 0.12 },
  { id: 'HA-07', nombre: 'Datos y KPIs (MTBF/MTTR, ESG)', descripcion: 'Capacidad de alimentar datamarts y tableros de confiabilidad/energía.', peso: 0.10 },
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

  const factors = useMemo(() => DEFAULT_VARIABLES, [])
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
        Esta versión cruza variables internas disponibles con cuatro competidores plausibles identificados a partir de los caminos estratégicos de la MML (Camino A-D).
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
          Sincronizar variables locales
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
                <th style={{ textAlign: 'left', borderBottom: `1px solid ${styles.tableBorder}`, padding: '8px 6px' }}>Variable</th>
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
                <td style={{ padding: '8px 6px' }}>
                  <strong>{sumPeso.toFixed(2)}</strong>
                  {Math.abs(sumPeso - 1) > 0.01 ? (
                    <span style={{ marginLeft: 6, color: '#f97316', fontWeight: 600 }}>Ajusta pesos en las variables</span>
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
          Escala sugerida: 1 = respuesta deficiente frente a la variable, 4 = respuesta superior.
          Ajusta los valores para reflejar la evidencia de cada competidor.
        </div>
      </div>
    </div>
  )
}

import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'

const Card = ({ title, children }) => (
  <div className="card" style={{ padding: 16, borderRadius: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
    </div>
    {children}
  </div>
)

const defaultData = {
  meta: {
    nombre: 'Matriz de Trazabilidad de Requisitos — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
    estado: 'Aprobado',
    estabilidad: 'Alto',
    complejidad: 'Medio',
  },
  controlVersion: {
    version: 'FGPR_026_01 V4',
    fecha: '2026-01-15',
    hechoPor: 'PMO',
    revisadoPor: 'Comité',
    aprobadoPor: 'Sponsor',
    motivo: 'Base',
  },
  items: [],
}

const fallbackRequirements = {
  requisitos: {
    funcionales: [
      { stakeholder: 'MinTIC', prioridad: 'Alta', codigo: 'RF-01', requerimiento: 'Interoperabilidad y lineamientos TIC', descripcion: 'Alinear servicios HA/DR a guías TIC, asegurando intercambio de datos y evidencias.' },
      { stakeholder: 'Cliente/Operaciones', prioridad: 'Alta', codigo: 'RF-02', requerimiento: 'Failover/failback automatizado', descripcion: 'Ejecución orquestada de conmutaciones con ventanas controladas y reportes.' },
    ],
    noFuncionales: [
      { stakeholder: 'MinTIC', prioridad: 'Alta', codigo: 'RNF-01', requerimiento: 'Disponibilidad certificable', descripcion: 'SLA ≥99.95% en servicios críticos con evidencia para entes regulatorios.' },
      { stakeholder: 'Proveedor IoT/Cloud', prioridad: 'Alta', codigo: 'RNF-02', requerimiento: 'SLA y tiempos de respuesta', descripcion: 'SRE 24/7 con MTTR <30 min para incidentes P1.' },
    ],
    calidad: [
      { stakeholder: 'MinTIC', prioridad: 'Alta', codigo: 'RC-01', requerimiento: 'Auditoría sin hallazgos críticos', descripcion: 'Evidencias completas y postmortems documentados.' },
    ],
  },
}

const fallbackHitos = [
  { evento: 'Topología multi-región aprobada', fecha: '2026-02-15' },
  { evento: 'Primera región activa-activa en producción', fecha: '2026-04-05' },
  { evento: 'Prueba HA/DR integral (RTO/RPO)', fecha: '2026-05-15' },
  { evento: 'Cierre auditoría de continuidad sin hallazgos', fecha: '2026-06-30' },
]

const readRequirementsDoc = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('requirements_doc_data')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const readProjectCharter = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('project_charter_data')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const readWbsDictionary = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('wbs_dictionary_data')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const buildTraceabilityItems = (req = fallbackRequirements, dic = null) => {
  const all = [
    ...(req.requisitos?.funcionales || []).map((r) => ({ ...r, _type: 'RF' })),
    ...(req.requisitos?.noFuncionales || []).map((r) => ({ ...r, _type: 'RNF' })),
    ...(req.requisitos?.calidad || []).map((r) => ({ ...r, _type: 'RC' })),
  ]
  const wbsMap = new Map()
  ;(dic?.entradas || []).forEach((e) => { wbsMap.set(e.codigo, e) })

  const charter = readProjectCharter()
  const hitos = charter?.hitos || fallbackHitos
  const addDays = (dateStr, days) => {
    const d = new Date(dateStr || hitos[0]?.fecha || '')
    if (Number.isNaN(d.getTime())) return dateStr || hitos[0]?.fecha || ''
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }
  const dateByCode = (code, type, offsetIdx) => {
    const base = code ? code.split('.')[0] : ''
    let baseDate = hitos[0]?.fecha || ''
    if (base === '1') baseDate = hitos[0]?.fecha || baseDate
    else if (base === '2' || base === '3' || base === '4') baseDate = hitos[1]?.fecha || baseDate
    else if (base === '5') baseDate = hitos[2]?.fecha || baseDate
    else if (base === '6') baseDate = hitos[3]?.fecha || baseDate

    // bias by type if no WBS code match
    if (!code) {
      if (type === 'RF') baseDate = hitos[1]?.fecha || baseDate
      if (type === 'RNF') baseDate = hitos[2]?.fecha || baseDate
      if (type === 'RC') baseDate = hitos[3]?.fecha || baseDate
    }
    // spread dates weekly to avoid iguales
    return addDays(baseDate, offsetIdx * 7)
  }

  const counters = { RF: 0, RNF: 0, RC: 0 }

  return all.map((r, idx) => {
    const wbsCode = r.codigo?.startsWith('R') ? r.codigo.replace(/[A-Z]+-?/, '3.') : ''
    const wbsEntry = wbsCode && wbsMap.size ? wbsMap.get(wbsCode) || wbsMap.get(wbsCode.replace('3.', '4.')) || wbsMap.get(wbsCode.replace('3.', '5.')) : null
    const type = r._type || 'RF'
    const offset = counters[type] || 0
    counters[type] = offset + 1
    const fechaCumplimiento = dateByCode(wbsEntry?.codigo || wbsCode, type, offset)
    return {
      codigo: r.codigo || `REQ-${idx + 1}`,
      descripcion: r.requerimiento || r.descripcion || 'Requisito',
      sustento: r.stakeholder || 'Stakeholder',
      propietario: r.stakeholder || 'Stakeholder',
      fuente: 'RequirementsDocumentation',
      prioridad: r.prioridad || 'Media',
      version: '1.0',
      estadoActual: 'AP',
      estabilidad: 'A',
      complejidad: 'M',
      aceptacion: 'Validación en pruebas HA/DR y criterios del plan.',
      necesidades: 'Continuidad, resiliencia y cumplimiento TIC.',
      objetivosProyecto: 'Asegurar RTO/RPO ≤5 min y trazabilidad.',
      alcance: wbsEntry?.objetivo || 'Entregable asociado en WBS.',
      diseno: 'Arquitectura HA/DR activa-activa.',
      desarrollo: 'Runbooks IaC/ops y automatización.',
      estrategiaPrueba: 'Pruebas trimestrales HA/DR.',
      escenarioPrueba: 'Simulación de caída regional y failover.',
      reqAltoNivel: 'Requisito de continuidad y HA/DR.',
      fechaCumplimiento,
    }
  })
}

export default function RequirementsTraceability() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('requirements_traceability_data')
      return raw ? JSON.parse(raw) : defaultData
    } catch {
      return defaultData
    }
  })
  const ref = useRef(null)

  const handleImport = async (evt) => {
    const file = evt.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setData(json)
      try { localStorage.setItem('requirements_traceability_data', JSON.stringify(json)) } catch { /* ignore */ }
    } catch (err) {
      alert('Archivo inválido: ' + err.message)
    } finally {
      evt.target.value = ''
    }
  }

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'matriz_trazabilidad_requisitos.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('requirements_traceability_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'matriz_trazabilidad_requisitos.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const reqDoc = useMemo(() => readRequirementsDoc() || fallbackRequirements, [])
  const wbsDic = useMemo(() => readWbsDictionary(), [])
  const items = useMemo(() => {
    const base = data.items?.length ? data.items : buildTraceabilityItems(reqDoc, wbsDic)
    return base
  }, [data.items, reqDoc, wbsDic])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>Matriz de Trazabilidad de Requisitos</h2>
          <div style={{ opacity: 0.8 }}>
            {data.meta?.nombre || 'Proyecto'} — {data.meta?.siglas} • Estado: {data.meta?.estado} • Estabilidad: {data.meta?.estabilidad} • Complejidad: {data.meta?.complejidad}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }} data-export-ignore="true">
          <button onClick={handleExport} style={btn}>Exportar JSON</button>
          <button onClick={handleExportPng} style={btn}>Guardar PNG</button>
          <button onClick={handleReset} style={btn}>Restaurar base</button>
          <label style={btn}>
            Importar JSON
            <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div ref={ref} style={{ display: 'grid', gap: 12 }}>
        <Card title="Control de versiones">
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div><strong>Versión:</strong> {data.controlVersion?.version}</div>
            <div><strong>Fecha:</strong> {data.controlVersion?.fecha}</div>
            <div><strong>Hecha por:</strong> {data.controlVersion?.hechoPor}</div>
            <div><strong>Revisada por:</strong> {data.controlVersion?.revisadoPor}</div>
            <div><strong>Aprobada por:</strong> {data.controlVersion?.aprobadoPor}</div>
            <div><strong>Motivo:</strong> {data.controlVersion?.motivo}</div>
          </div>
        </Card>

        <Card title="Matriz de trazabilidad">
          <div style={{ overflowX: 'auto', maxHeight: '60vh', border: '1px solid var(--border, #2a2f45)', borderRadius: 10, margin: '0 auto', maxWidth: '1200px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr>
                  <th style={th}>Código</th>
                  <th style={th}>Descripción</th>
                  <th style={th}>Sustento</th>
                  <th style={th}>Propietario/Fuente</th>
                  <th style={th}>Prioridad</th>
                  <th style={th}>Versión</th>
                  <th style={th}>Estado</th>
                  <th style={th}>Estabilidad</th>
                  <th style={th}>Complejidad</th>
                  <th style={th}>Criterio de aceptación</th>
                  <th style={th}>Necesidades / objetivos de negocio</th>
                  <th style={th}>Objetivos del proyecto</th>
                  <th style={th}>Alcance / WBS</th>
                  <th style={th}>Diseño</th>
                  <th style={th}>Desarrollo</th>
                  <th style={th}>Estrategia de prueba</th>
                  <th style={th}>Escenario de prueba</th>
                  <th style={th}>Requisito de alto nivel</th>
                  <th style={th}>Fecha de cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={`${i.codigo}-${idx}`}>
                    <td style={td}>{i.codigo}</td>
                    <td style={td}>{i.descripcion}</td>
                    <td style={td}>{i.sustento}</td>
                    <td style={td}>{i.propietario} / {i.fuente}</td>
                    <td style={td}>{i.prioridad}</td>
                    <td style={td}>{i.version}</td>
                    <td style={td}>{i.estadoActual}</td>
                    <td style={td}>{i.estabilidad}</td>
                    <td style={td}>{i.complejidad}</td>
                    <td style={td}>{i.aceptacion}</td>
                    <td style={td}>{i.necesidades}</td>
                    <td style={td}>{i.objetivosProyecto}</td>
                    <td style={td}>{i.alcance}</td>
                    <td style={td}>{i.diseno}</td>
                    <td style={td}>{i.desarrollo}</td>
                    <td style={td}>{i.estrategiaPrueba}</td>
                    <td style={td}>{i.escenarioPrueba}</td>
                    <td style={td}>{i.reqAltoNivel}</td>
                    <td style={td}>{i.fechaCumplimiento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

const th = { textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', whiteSpace: 'nowrap' }
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top', fontSize: 13 }
const btn = { border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }

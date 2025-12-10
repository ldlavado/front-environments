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
    nombre: 'Diccionario WBS — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
  },
  version: { version: '1.0', fecha: '2026-01-15', hechoPor: 'PMO', revisadoPor: 'Comité', aprobadoPor: 'Sponsor', motivo: 'Base' },
  especificacion:
    'Especificación de paquetes de trabajo del WBS: definir objetivo, descripción, entregables y responsabilidades para cada PDT.',
  entradas: [
    {
      codigo: '1.0',
      objetivo: 'Gestión y documentación de requisitos',
      descripcion: 'Levantamiento, refinamiento y aprobación de requisitos funcionales, no funcionales y de calidad.',
      entregable: 'Documentación de Requisitos aprobada',
      responsable: 'PMO + Cliente/Operaciones',
    },
    {
      codigo: '2.0',
      objetivo: 'Arquitectura HA/DR multi-región',
      descripcion: 'Diseño y despliegue de topología activa-activa, enlaces y patrones de resiliencia.',
      entregable: 'Topología validada',
      responsable: 'Arquitectura + Proveedor IoT/Cloud',
    },
    {
      codigo: '3.0',
      objetivo: 'Implementación de runbooks y automatización',
      descripcion: 'Crear y versionar runbooks IaC/ops ejecutables, alineados a requisitos priorizados.',
      entregable: 'Runbooks HA/DR',
      responsable: 'SRE + DevOps',
    },
    {
      codigo: '4.0',
      objetivo: 'Observabilidad y SIEM',
      descripcion: 'Configurar monitoreo sintético, APM y correlación de eventos HA/DR en SIEM.',
      entregable: 'Dashboards y alertas',
      responsable: 'SRE + Seguridad',
    },
    {
      codigo: '5.0',
      objetivo: 'Pruebas HA/DR y aceptación',
      descripcion: 'Ejecución de pruebas, criterios de aceptación y cierre con stakeholders.',
      entregable: 'Actas de pruebas y aceptación',
      responsable: 'PMO + Cliente/Operaciones',
    },
    {
      codigo: '6.0',
      objetivo: 'Capacitación y transición',
      descripcion: 'Formación a equipos de campo y operación continua; materiales y evidencias.',
      entregable: 'Plan de formación y evidencias',
      responsable: 'PMO + Cliente/Operaciones',
    },
  ],
}

const fallbackRequirements = {
  requisitos: {
    funcionales: [
      { stakeholder: 'MinTIC', prioridad: 'Alta', codigo: 'RF-01', requerimiento: 'Interoperabilidad y lineamientos TIC', descripcion: 'Alinear servicios HA/DR a guías TIC, asegurando intercambio de datos y evidencias.' },
      { stakeholder: 'Cliente/Operaciones', prioridad: 'Alta', codigo: 'RF-02', requerimiento: 'Failover/failback automatizado', descripcion: 'Ejecución orquestada de conmutaciones con ventanas controladas y reportes.' },
      { stakeholder: 'Proveedor IoT/Cloud', prioridad: 'Media', codigo: 'RF-03', requerimiento: 'Runbooks IaC/ops versionados', descripcion: 'Runbooks auditables y ejecutables desde pipelines multi-región.' },
      { stakeholder: 'Cliente/Operaciones', prioridad: 'Alta', codigo: 'RF-04', requerimiento: 'Monitoreo sintético y APM', descripcion: 'Pruebas continuas para validar disponibilidad y latencia a sitios críticos.' },
      { stakeholder: 'Proveedor IoT/Cloud', prioridad: 'Media', codigo: 'RF-05', requerimiento: 'Integración SIEM y observabilidad', descripcion: 'Eventos HA/DR enviados a SIEM con correlación y alertas.' },
      { stakeholder: 'MinTIC', prioridad: 'Media', codigo: 'RF-06', requerimiento: 'Evidencias de continuidad', descripcion: 'Reportes periódicos de disponibilidad y RTO/RPO conforme a regulaciones.' },
      { stakeholder: 'Cliente/Operaciones', prioridad: 'Alta', codigo: 'RF-07', requerimiento: 'Capacitación y plan de pruebas', descripcion: 'Simulacros trimestrales con usuarios clave y equipos de campo.' },
      { stakeholder: 'Proveedor IoT/Cloud', prioridad: 'Media', codigo: 'RF-08', requerimiento: 'Soporte SRE 24/7', descripcion: 'On-call con tiempos de respuesta definidos para incidentes P1.' },
    ],
    noFuncionales: [
      { stakeholder: 'MinTIC', prioridad: 'Alta', codigo: 'RNF-01', requerimiento: 'Disponibilidad certificable', descripcion: 'SLA ≥99.95% en servicios críticos con evidencia para entes regulatorios.' },
      { stakeholder: 'Proveedor IoT/Cloud', prioridad: 'Alta', codigo: 'RNF-02', requerimiento: 'SLA y tiempos de respuesta', descripcion: 'SRE 24/7 con MTTR <30 min para incidentes P1.' },
      { stakeholder: 'Cliente/Operaciones', prioridad: 'Alta', codigo: 'RNF-03', requerimiento: 'Latencia y rendimiento', descripcion: '<35 ms promedio hacia sitios críticos y throughput validado.' },
      { stakeholder: 'Proveedor IoT/Cloud', prioridad: 'Media', codigo: 'RNF-04', requerimiento: 'Cifrado y Zero-Trust', descripcion: 'Cifrado en tránsito/descanso, IAM federado y controles de acceso mínimos.' },
      { stakeholder: 'MinTIC', prioridad: 'Media', codigo: 'RNF-05', requerimiento: 'Gobernanza de datos', descripcion: 'Cumplimiento de políticas de datos abiertos y reportes de disponibilidad.' },
      { stakeholder: 'Cliente/Operaciones', prioridad: 'Media', codigo: 'RNF-06', requerimiento: 'Recuperación verificada', descripcion: 'RTO/RPO ≤5 min validados trimestralmente y documentados.' },
      { stakeholder: 'Proveedor IoT/Cloud', prioridad: 'Media', codigo: 'RNF-07', requerimiento: 'Integridad y registros', descripcion: 'Bitácoras inmutables y retención conforme a auditoría.' },
      { stakeholder: 'MinTIC', prioridad: 'Media', codigo: 'RNF-08', requerimiento: 'Reporte regulatorio', descripcion: 'Formatos y métricas listos para visitas o solicitudes de MinTIC.' },
    ],
    calidad: [
      { stakeholder: 'MinTIC', prioridad: 'Alta', codigo: 'RC-01', requerimiento: 'Auditoría sin hallazgos críticos', descripcion: 'Evidencias completas y postmortems documentados.' },
    ],
  },
}

const fallbackWbs = [
  { codigo: '1.0', nombre: 'Gestión y documentación de requisitos', descripcion: 'Levantamiento, refinamiento y aprobación de requisitos.', responsable: 'PMO + Cliente/Operaciones', entregable: 'Documentación de Requisitos aprobada' },
  { codigo: '2.0', nombre: 'Arquitectura HA/DR multi-región', descripcion: 'Diseño y despliegue de la topología activa-activa.', responsable: 'Arquitectura + Proveedor IoT/Cloud', entregable: 'Topología validada' },
  { codigo: '3.0', nombre: 'Implementación de runbooks y automatización', descripcion: 'Runbooks IaC/ops versionados y ejecutables.', responsable: 'SRE + DevOps', entregable: 'Runbooks HA/DR' },
  { codigo: '4.0', nombre: 'Observabilidad y SIEM', descripcion: 'Monitoreo sintético, APM y trazabilidad en SIEM.', responsable: 'SRE + Seguridad', entregable: 'Dashboards y alertas' },
  { codigo: '5.0', nombre: 'Pruebas HA/DR y aceptación', descripcion: 'Pruebas trimestrales, criterios de aceptación y cierre.', responsable: 'PMO + Cliente/Operaciones', entregable: 'Actas de pruebas y aceptación' },
  { codigo: '6.0', nombre: 'Capacitación y transición', descripcion: 'Formación a equipos de campo y operación continua.', responsable: 'PMO + Cliente/Operaciones', entregable: 'Plan de formación y evidencias' },
]

const readWbsData = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('wbs_data')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const mapWbsToDictionary = (wbs) => {
  const list = wbs?.paquetes || []
  return list.map((p) => ({
    codigo: p.codigo,
    objetivo: p.nombre,
    descripcion: p.descripcion || 'Trabajo asociado al paquete WBS.',
    entregable: p.entregable || 'Entregable definido en WBS.',
    responsable: p.responsable || 'Por definir',
  }))
}

const buildPackagesFromRequirements = (req = {}) => {
  const { funcionales = [], noFuncionales = [], calidad = [] } = req
  const fn = funcionales.map((r, idx) => ({
    codigo: `3.${idx + 1}`,
    nombre: r.requerimiento || r.codigo || `RF-${idx + 1}`,
    descripcion: r.descripcion || 'Requisito funcional priorizado',
    responsable: r.stakeholder || 'Equipo',
    entregable: `${r.codigo || 'RF'} — ${r.requerimiento || ''}`,
    depende: '2.0',
    auto: true,
  }))
  const nfn = noFuncionales.map((r, idx) => ({
    codigo: `4.${idx + 1}`,
    nombre: r.requerimiento || r.codigo || `RNF-${idx + 1}`,
    descripcion: r.descripcion || 'Requisito no funcional priorizado',
    responsable: r.stakeholder || 'Equipo',
    entregable: `${r.codigo || 'RNF'} — ${r.requerimiento || ''}`,
    depende: '3.0',
    auto: true,
  }))
  const qc = calidad.map((r, idx) => ({
    codigo: `5.${idx + 1}`,
    nombre: r.requerimiento || r.codigo || `RC-${idx + 1}`,
    descripcion: r.descripcion || 'Requisito de calidad priorizado',
    responsable: r.stakeholder || 'Equipo',
    entregable: `${r.codigo || 'RC'} — ${r.requerimiento || ''}`,
    depende: '3.0,4.0',
    auto: true,
  }))
  return [...fn, ...nfn, ...qc]
}

export default function WbsDictionary() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('wbs_dictionary_data')
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
      try { localStorage.setItem('wbs_dictionary_data', JSON.stringify(json)) } catch { /* ignore */ }
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
      a.download = 'diccionario_wbs.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('wbs_dictionary_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'diccionario_wbs.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const wbsData = useMemo(() => readWbsData(), [])
  const reqData = useMemo(() => {
    if (typeof window === 'undefined') return fallbackRequirements
    try {
      const raw = localStorage.getItem('requirements_doc_data')
      return raw ? JSON.parse(raw) : fallbackRequirements
    } catch {
      return fallbackRequirements
    }
  }, [])

  const entradas = useMemo(() => {
    const basePaquetes = (wbsData?.paquetes && wbsData.paquetes.length ? wbsData.paquetes : fallbackWbs)
    const hasAuto = basePaquetes.some((p) => p.auto)
    const auto = hasAuto ? basePaquetes.filter((p) => p.auto) : buildPackagesFromRequirements(reqData.requisitos)
    const manual = basePaquetes.filter((p) => !p.auto)
    const mergedPaquetes = [...manual, ...auto]

    const derived = mapWbsToDictionary({ paquetes: mergedPaquetes })
    const base = data.entradas || []
    const map = new Map()
    base.forEach((e) => map.set(e.codigo, e))
    derived.forEach((e) => map.set(e.codigo, { ...map.get(e.codigo), ...e }))
    return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
  }, [data.entradas, reqData.requisitos, wbsData])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>Diccionario WBS (EDT)</h2>
          <div style={{ opacity: 0.8 }}>
            {data.meta?.nombre || 'Proyecto'} — {data.meta?.siglas}
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
            <div><strong>Versión:</strong> {data.version?.version}</div>
            <div><strong>Fecha:</strong> {data.version?.fecha}</div>
            <div><strong>Hecha por:</strong> {data.version?.hechoPor}</div>
            <div><strong>Revisada por:</strong> {data.version?.revisadoPor}</div>
            <div><strong>Aprobada por:</strong> {data.version?.aprobadoPor}</div>
            <div><strong>Motivo:</strong> {data.version?.motivo}</div>
          </div>
        </Card>

        <Card title="Especificación del diccionario">
          <div>{data.especificacion}</div>
        </Card>

        <Card title="Paquetes de trabajo (Diccionario WBS)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={th}>Código</th>
                  <th style={th}>Objetivo / Paquete</th>
                  <th style={th}>Descripción del trabajo</th>
                  <th style={th}>Entregable</th>
                  <th style={th}>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((e, idx) => {
                  const isPhase = /\.0$/.test(e.codigo || '')
                  const baseStyle = isPhase ? { ...td, background: 'var(--highlight-bg, rgba(59,130,246,0.12))', fontWeight: 700 } : td
                  return (
                    <tr key={`${e.codigo}-${idx}`}>
                      <td style={baseStyle}>{e.codigo}</td>
                      <td style={baseStyle}>
                        {e.objetivo}
                        {isPhase ? <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border, #2a2f45)', fontSize: 12 }}>Fase</span> : null}
                      </td>
                      <td style={baseStyle}>{e.descripcion}</td>
                      <td style={baseStyle}>{e.entregable}</td>
                      <td style={baseStyle}>{e.responsable}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

const th = { textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', whiteSpace: 'nowrap' }
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top' }
const btn = { border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }

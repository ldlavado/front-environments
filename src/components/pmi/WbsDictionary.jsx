import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../../utils/downloadElementAsPng'

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

const fallbackCharter = {
  presupuesto: [
    { concepto: 'Infraestructura multi-región y redes', monto: 320000000 },
    { concepto: 'SRE 24/7 y soporte en campo', monto: 180000000 },
    { concepto: 'Seguridad, SIEM y observabilidad', monto: 120000000 },
  ],
  hitos: [
    { evento: 'Topología multi-región aprobada', fecha: '2026-02-15' },
    { evento: 'Primera región activa-activa en producción', fecha: '2026-04-05' },
    { evento: 'Prueba HA/DR integral (RTO/RPO)', fecha: '2026-05-15' },
    { evento: 'Cierre auditoría de continuidad sin hallazgos', fecha: '2026-06-30' },
  ],
  riesgos: {
    amenazas: [
      'Fallas prolongadas de ISP o conectividad hacia regiones.',
      'Demoras en aprobaciones de pruebas en horario controlado.',
      'Incremento de costos de red o reservas fuera del caso de negocio.',
    ],
    oportunidades: [
      'Consolidar servicios regionales y reducir MTTR.',
      'Mejorar postura de cumplimiento y agilizar auditorías.',
      'Monetizar SLA premium con continuidad certificable.',
    ],
  },
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

const mapWbsToDictionary = (wbs, charter = fallbackCharter) => {
  const list = wbs?.paquetes || []
  const presup = charter?.presupuesto || fallbackCharter.presupuesto
  const hitos = charter?.hitos || fallbackCharter.hitos
  const riesgos = charter?.riesgos || fallbackCharter.riesgos

  const scaleCost = (monto, factor = 0.1, fallback = 8000000) => {
    const base = Number(monto) || 0
    const val = Math.round(base * factor)
    return val > 0 ? val : fallback
  }

  const costoPorBase = {
    '1': scaleCost(presup[2]?.monto, 0.05, 6000000),
    '2': scaleCost(presup[0]?.monto, 0.15, 25000000),
    '3': scaleCost(presup[1]?.monto, 0.12, 18000000),
    '4': scaleCost(presup[2]?.monto, 0.12, 12000000),
    '5': scaleCost((presup[0]?.monto || 0) + (presup[1]?.monto || 0), 0.05, 10000000),
    '6': scaleCost(presup[1]?.monto, 0.05, 8000000),
  }

  const fechaPorBase = {
    '1': hitos[0]?.fecha,
    '2': hitos[1]?.fecha,
    '3': hitos[1]?.fecha,
    '4': hitos[2]?.fecha,
    '5': hitos[2]?.fecha,
    '6': hitos[3]?.fecha,
  }

  const riesgoPorBase = {
    '1': riesgos?.amenazas?.[1] || '',
    '2': riesgos?.amenazas?.[2] || '',
    '3': riesgos?.oportunidades?.[0] || '',
    '4': riesgos?.amenazas?.[0] || '',
    '5': riesgos?.oportunidades?.[1] || '',
    '6': riesgos?.oportunidades?.[2] || '',
  }

  const criterioPorBase = {
    '1': 'Documentación de requisitos aprobada por sponsor y stakeholders, trazabilidad completa y sin hallazgos críticos en revisión.',
    '2': 'Arquitectura HA/DR validada en diseño y checklist de seguridad/compliance firmado por las partes.',
    '3': 'Runbooks IaC/ops versionados, ejecutables desde pipeline y validados en simulacro controlado.',
    '4': 'Dashboards y SIEM mostrando métricas clave y eventos HA/DR con alertas configuradas.',
    '5': 'Prueba HA/DR ejecutada con RTO/RPO ≤5 min y acta de aceptación firmada.',
    '6': 'Plan de formación entregado, ≥80% asistencia y evaluación de satisfacción positiva.',
  }

  return list.map((p) => {
    const base = (p.codigo || '').split('.')[0]
    return {
      codigo: p.codigo,
      objetivo: p.nombre,
      descripcion: p.descripcion || 'Trabajo asociado al paquete WBS.',
      entregable: p.entregable || 'Entregable definido en WBS.',
      responsable: p.responsable || 'Por definir',
      depende: p.depende || '',
      criterioAceptacion: p.criterioAceptacion || criterioPorBase[base] || 'Criterio de aceptación documentado y aprobado.',
      supuestos: p.supuestos || 'Disponibilidad de recursos y ventanas aprobadas.',
      restricciones: p.restricciones || 'Ventanas de cambio y presupuesto asignado.',
      recursos: p.recursos || 'Equipo PMO, Arquitectura, SRE',
      costo: p.costo || costoPorBase[base] || '',
      fecha: p.fecha || fechaPorBase[base] || hitos[hitos.length - 1]?.fecha || '',
      riesgos: p.riesgos || riesgoPorBase[base] || '',
    }
  })
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
  const [filter, setFilter] = useState('')
  const [modalItem, setModalItem] = useState(null)

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
  const charterData = useMemo(() => readProjectCharter() || fallbackCharter, [])
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

    const derived = mapWbsToDictionary({ paquetes: mergedPaquetes }, charterData)
    const base = data.entradas || []
    const map = new Map()
    base.forEach((e) => map.set(e.codigo, e))
    derived.forEach((e) => map.set(e.codigo, { ...map.get(e.codigo), ...e }))
    const list = Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
    const term = filter.trim().toLowerCase()
    if (!term) return list
    return list.filter((e) =>
      [e.codigo, e.objetivo, e.descripcion, e.entregable, e.responsable, e.depende]
        .some((v) => String(v || '').toLowerCase().includes(term)),
    )
  }, [data.entradas, reqData.requisitos, wbsData, filter])

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

      <div ref={ref} style={{ display: 'grid', gap: 12, maxWidth: '1200px', margin: '0 auto' }}>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }} data-export-ignore="true">
            <input
              placeholder="Filtrar por código, paquete, entregable o responsable"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #2a2f45)' }}
            />
            <button onClick={() => { try { localStorage.setItem('wbs_last_view', 'wbs'); window.location.hash = 'wbs' } catch { window.location.hash = 'wbs' } }} style={btn}>
              Ver WBS
            </button>
            <span style={{ fontSize: 13, opacity: 0.75 }}>{entradas.length} filas</span>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '65vh', border: '1px solid var(--border, #2a2f45)', borderRadius: 10, margin: '0 auto', maxWidth: '1200px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1280 }}>
              <thead>
                <tr>
                  <th style={thSticky}>Código</th>
                  <th style={thSticky}>Objetivo / Paquete</th>
                  <th style={thSticky}>Descripción del trabajo</th>
                  <th style={thSticky}>Entregable</th>
                  <th style={thSticky}>Responsable</th>
                  <th style={thSticky}>Depende de</th>
                  <th style={thSticky}>Criterio de aceptación</th>
                  <th style={thSticky}>Supuestos</th>
                  <th style={thSticky}>Restricciones</th>
                  <th style={thSticky}>Recursos</th>
                  <th style={thSticky}>Costo estimado</th>
                  <th style={thSticky}>Fecha</th>
                  <th style={thSticky}>Riesgos</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((e, idx) => (
                  <tr key={`${e.codigo}-${idx}`}>
                    <td style={badgeStyle(e)}>{e.codigo}</td>
                    <td style={badgeStyle(e)}>
                      {e.objetivo}
                      {isPhase(e) ? <Badge text="Fase" tone="info" /> : null}
                    </td>
                    <td style={badgeStyle(e)}>{e.descripcion}</td>
                    <td style={badgeStyle(e)}>{e.entregable}</td>
                    <td style={badgeStyle(e)}>{e.responsable}</td>
                    <td style={badgeStyle(e)}>{e.depende || '—'}</td>
                    <td style={badgeStyle(e)}>
                      <button
                        onClick={() => setModalItem(e)}
                        style={{ ...btn, padding: '4px 8px', background: 'transparent' }}
                        title="Ver criterios de aceptación"
                      >
                        Ver
                      </button>
                    </td>
                    <td style={badgeStyle(e)}>{e.supuestos || '—'}</td>
                    <td style={badgeStyle(e)}>{e.restricciones || '—'}</td>
                    <td style={badgeStyle(e)}>{e.recursos || '—'}</td>
                    <td style={badgeStyle(e)}>{e.costo || '—'}</td>
                    <td style={badgeStyle(e)}>{e.fecha || '—'}</td>
                    <td style={badgeStyle(e)}>{e.riesgos || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Modal item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  )
}

const th = { textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', whiteSpace: 'nowrap' }
const thSticky = { ...th, position: 'sticky', top: 0, background: 'var(--card-bg, #fff)', zIndex: 1 }
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top' }
const btn = { border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }

const isPhase = (e) => /\.0$/.test(e.codigo || '')
const badgeStyle = (e) => (isPhase(e) ? { ...td, background: 'var(--highlight-bg, rgba(59,130,246,0.12))', fontWeight: 700 } : td)

function Badge({ text, tone = 'info' }) {
  const colors = {
    info: { bg: 'rgba(59,130,246,0.12)', border: '#3b82f6' },
    warn: { bg: 'rgba(251,191,36,0.15)', border: '#f59e0b' },
  }
  const palette = colors[tone] || colors.info
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      fontSize: 12,
      marginLeft: 6,
    }}>
      {text}
    </span>
  )
}

const criteriaCatalog = [
  'Entrega validada por sponsor y PMO con evidencias en SIEM.',
  'Prueba HA/DR ejecutada sin hallazgos críticos.',
  'Documentación revisada y aprobada por MinTIC/Regulador.',
  'Runbooks versionados y ejecutables desde pipeline.',
  'Capacitación completada con asistencia >80% y encuestas positivas.',
  'Costos dentro de presupuesto aprobado ±10%.',
]

const Modal = ({ item, onClose }) => {
  if (!item) return null
  const criteriaList = item.criterioAceptacion && item.criterioAceptacion !== 'Por definir'
    ? [item.criterioAceptacion]
    : criteriaCatalog
  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Criterios de aceptación — {item.codigo}</h3>
          <button onClick={onClose} style={{ ...btn, padding: '4px 8px' }}>Cerrar</button>
        </div>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>{item.objetivo}</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {criteriaList.map((c, idx) => <li key={idx}>{c}</li>)}
        </ul>
      </div>
    </div>
  )
}

const modalBackdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 50,
}

const modalCard = {
  background: 'var(--card-bg, #fff)',
  borderRadius: 12,
  padding: 16,
  minWidth: 'min(720px, 90vw)',
  maxWidth: '90vw',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
}

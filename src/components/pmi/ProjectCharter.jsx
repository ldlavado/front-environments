import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../../utils/downloadElementAsPng'
import { filterImpactfulStakeholders } from '../../utils/impactfulStakeholders'

const Card = ({ title, children, actions }) => (
  <div className="card" style={{ padding: 16, borderRadius: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {actions}
    </div>
    {children}
  </div>
)

const Pill = ({ children }) => (
  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: 'var(--highlight-bg, #222)', border: '1px solid var(--border, #333)', marginRight: 8, marginBottom: 6 }}>
    {children}
  </span>
)

const defaultData = {
  meta: {
    nombre: 'Project Charter — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
    fecha: '2026-01-15',
    ubicacion: 'Multi-región cloud + sitios críticos',
    descripcion: 'Despliegue de arquitectura activa-activa con orquestación HA/DR automatizada, operación SRE 24/7 y trazabilidad certificable.',
  },
  producto: 'Capacidad operativa HA/DR multi-región activa-activa, con runbooks automatizados, monitoreo sintético, SIEM y operación SRE 24/7.',
  requisitos: {
    funcionales: [
      'Failover/failback automático con RTO/RPO ≤5 min validados trimestralmente.',
      'Cobertura multi-región con latencia <35 ms a sitios críticos.',
      'Runbooks IaC/ops versionados y ejecutables desde pipelines.',
    ],
    no_funcionales: [
      'Disponibilidad ≥99.95% en servicios críticos.',
      'Observabilidad end-to-end (APM + synthetic) y SIEM integrado.',
      'Gobernanza de datos y minimización de lock-in via plantillas IaC multi-cloud.',
    ],
    calidad: [
      '0 hallazgos críticos en auditorías de continuidad y seguridad.',
      'Cobertura de runbooks ≥90% de servicios críticos.',
      'Evidencias de pruebas HA/DR y postmortems documentadas.',
    ],
  },
  objetivos: [
    {
      concepto: 'Alcance',
      objetivo: 'Entregar topología activa-activa en 2+ regiones con orquestación HA/DR y trazabilidad Zero-Trust.',
      criterio: 'Infraestructura provisionada, runbooks automatizados, SIEM integrado y portafolio FO-01-P1 alineado.',
    },
    {
      concepto: 'Tiempo',
      objetivo: 'Habilitar operación activa-activa y pruebas HA/DR trimestrales dentro de los primeros 6 meses.',
      criterio: 'Hitos de despliegue por región cumplidos y 2 rondas de pruebas exitosas dentro del semestre.',
    },
    {
      concepto: 'Costo',
      objetivo: 'Mantener TCO 3 años dentro de ±10% del caso de negocio y optimizar reservas/uso elástico.',
      criterio: 'OPEX/CAPEX monitoreado mensualmente; ROI y ahorros vs. escenarios alternos validados.',
    },
  ],
  finalidad: 'Asegurar continuidad de servicio crítico con trazabilidad certificable para el portafolio FO-01-P1, habilitando resiliencia multi-región y cumplimiento regulatorio.',
  justificacion: {
    cualitativa: [
      'Reduce riesgo operacional y reputacional por caídas regionales.',
      'Mejora cumplimiento regulatorio y evidencia de auditoría.',
      'Acelera adopción digital con topología resiliente como base.',
    ],
    cuantitativa: {
      ingresos: [
        { concepto: 'Evita pérdidas por indisponibilidad', monto: 750000000 },
        { concepto: 'Nuevos clientes con SLA reforzado', monto: 420000000 },
      ],
      egresos: [
        { concepto: 'Reservas multi-región y redes redundantes', monto: 380000000 },
        { concepto: 'Operación SRE 24/7 + SIEM', monto: 240000000 },
      ],
      VAN: 320000000,
      TIR: '28%',
      RBC: 2.1,
    },
  },
  pm: {
    nombre: 'Luis Lavado',
    reportaA: 'CTO / Comité de Continuidad',
    supervisaA: 'SRE Lead, Seguridad/Compliance, DevOps',
    autoridad: ['Aprobación de pruebas HA/DR', 'Priorización de backlog de runbooks', 'Gestión de riesgos y presupuesto operativo'],
  },
  hitos: [
    { evento: 'Topología multi-región aprobada', fecha: '2026-02-15' },
    { evento: 'Primera región activa-activa en producción', fecha: '2026-04-05' },
    { evento: 'Prueba HA/DR integral (RTO/RPO)', fecha: '2026-05-15' },
    { evento: 'Cierre auditoría de continuidad sin hallazgos', fecha: '2026-06-30' },
  ],
  organizaciones: [
    { nombre: 'Cliente / Operaciones', rol: 'Patrocinio y priorización de servicios críticos' },
    { nombre: 'Proveedor cloud / SRE', rol: 'Despliegue y operación activa-activa' },
    { nombre: 'Seguridad y Cumplimiento', rol: 'Zero-Trust, SIEM y auditorías' },
    { nombre: 'Equipos OT/IT en sitio', rol: 'Soporte edge y pruebas controladas' },
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
  presupuesto: [
    { concepto: 'Infraestructura multi-región y redes', monto: 320000000 },
    { concepto: 'SRE 24/7 y soporte en campo', monto: 180000000 },
    { concepto: 'Seguridad, SIEM y observabilidad', monto: 120000000 },
  ],
  sponsor: {
    nombre: 'Diego Ruiz',
    empresa: 'Operador de Servicios Críticos',
    cargo: 'VP Operaciones y Continuidad',
    fecha: '2026-01-10',
  },
}

const currency = (num) => {
  if (num == null || Number.isNaN(Number(num))) return '—'
  return Number(num).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

const btnGhost = { border: '1px solid var(--border, #2a2f45)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', background: 'transparent' }

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

const readStakeholderRegister = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('stakeholder_register_data')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.stakeholders || null
  } catch {
    return null
  }
}

const mapStakeholdersFromRadar = (stakeholders = []) =>
  stakeholders.map((s) => {
    const topVar = Object.entries(s.variables || {}).sort(([, a], [, b]) => (Number(b.total_pct) || 0) - (Number(a.total_pct) || 0))[0]
    return {
      nombre: s.stakeholder,
      rol: topVar ? `Enfoque: ${topVar[0]} (${topVar[1].total_pct || 0}%)` : 'Sin variables definidas',
    }
  })

export default function ProjectCharter({ stakeholders: externalStakeholders = [] }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('project_charter_data')
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
      try { localStorage.setItem('project_charter_data', JSON.stringify(json)) } catch { /* ignore */ }
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
      a.download = 'project_charter.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('project_charter_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'project_charter.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const totalPresupuesto = useMemo(() => data.presupuesto?.reduce((acc, item) => acc + (Number(item.monto) || 0), 0) || 0, [data.presupuesto])
  const impactful = useMemo(() => filterImpactfulStakeholders(externalStakeholders), [externalStakeholders])
  const registerStakeholders = useMemo(
    () => (impactful.length ? mapStakeholdersFromRadar(impactful) : readStakeholderRegister() || []),
    [impactful],
  )

  const wbsData = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('wbs_data')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const wbsDictionary = useMemo(() => readWbsDictionary(), [])
  const requirementsDoc = useMemo(() => readRequirementsDoc(), [])

  const wbsSummary = useMemo(() => {
    const paquetes = wbsData?.paquetes || []
    const dic = wbsDictionary?.entradas || []
    if (!paquetes.length && !dic.length) return []
    const bases = paquetes.length ? paquetes.filter((p) => /\.0$/.test(p.codigo || '')) : dic.filter((p) => /\.0$/.test(p.codigo || ''))
    return bases.map((p) => {
      const detail = dic.find((d) => d.codigo === p.codigo) || {}
      return {
        codigo: p.codigo,
        nombre: p.nombre || p.objetivo,
        entregable: p.entregable || detail.entregable,
        costo: detail.costo || '',
        fecha: detail.fecha || '',
      }
    })
  }, [wbsData, wbsDictionary])

  const kpis = useMemo(() => {
    const cuant = data.justificacion?.cuantitativa || {}
    return [
      { label: 'VAN', value: currency(cuant.VAN) },
      { label: 'TIR', value: cuant.TIR || '—' },
      { label: 'RBC', value: cuant.RBC || '—' },
      { label: 'Presupuesto', value: currency(totalPresupuesto) },
    ]
  }, [data.justificacion?.cuantitativa, totalPresupuesto])

  const criticalReqs = useMemo(() => {
    const req = requirementsDoc?.requisitos || {}
    const all = [...(req.funcionales || []), ...(req.noFuncionales || []), ...(req.calidad || [])]
    return all.filter((r) => (r.prioridad || '').toLowerCase().includes('alta')).length
  }, [requirementsDoc])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>Project Charter (PMI)</h2>
          <div style={{ opacity: 0.8 }}>
            {data.meta?.nombre || 'Proyecto'} — {data.meta?.siglas} • {data.meta?.fecha} • {data.meta?.ubicacion}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }} data-export-ignore="true">
          <button onClick={handleExport} style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar JSON</button>
          <button onClick={handleExportPng} style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Guardar PNG</button>
          <button onClick={handleReset} style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Restaurar base</button>
          <label style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
            Importar JSON
            <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }} data-export-ignore="true">
        <button
          onClick={() => { if (typeof window !== 'undefined') { window.location.hash = 'stakeholder-register' } }}
          style={btnGhost}
        >
          Registro
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') { window.location.hash = 'stakeholder-management' } }}
          style={btnGhost}
        >
          Gestión
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') { window.location.hash = 'requirements-doc' } }}
          style={btnGhost}
        >
          Requisitos
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') { window.location.hash = 'wbs' } }}
          style={btnGhost}
        >
          WBS
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') { window.location.hash = 'wbs-dictionary' } }}
          style={btnGhost}
        >
          Diccionario WBS
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') { window.location.hash = 'requirements-traceability' } }}
          style={btnGhost}
        >
          Trazabilidad
          {criticalReqs ? <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', fontSize: 11 }}>Crit: {criticalReqs}</span> : null}
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') { window.location.hash = 'requirements-traceability' } }}
          style={btnGhost}
        >
          Trazabilidad
        </button>
      </div>

      <div ref={ref} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 10, background: 'var(--card-bg)' }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{k.label}</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{k.value}</div>
            </div>
          ))}
        </div>

        <Card title="Descripción del proyecto">
          <div style={{ marginBottom: 4 }}><strong>Nombre:</strong> {data.meta?.nombre}</div>
          <div style={{ marginBottom: 4 }}><strong>Siglas:</strong> {data.meta?.siglas}</div>
          <div style={{ marginBottom: 4 }}><strong>Ubicación:</strong> {data.meta?.ubicacion}</div>
          <div style={{ marginBottom: 4 }}><strong>Fecha:</strong> {data.meta?.fecha}</div>
          <div style={{ marginBottom: 4 }}><strong>Descripción:</strong> {data.meta?.descripcion}</div>
        </Card>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <Card title="Definición del producto">
            <div>{data.producto}</div>
          </Card>

        <Card title="Requisitos del proyecto">
          <div style={{ display: 'grid', gap: 8 }}>
            {data.requisitos?.funcionales?.length ? (
                <div>
                  <strong>Funcionales</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {data.requisitos.funcionales.map((r, idx) => <li key={`f-${idx}`}>{r}</li>)}
                  </ul>
                </div>
              ) : null}
              {data.requisitos?.no_funcionales?.length ? (
                <div>
                  <strong>No funcionales</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {data.requisitos.no_funcionales.map((r, idx) => <li key={`nf-${idx}`}>{r}</li>)}
                  </ul>
                </div>
              ) : null}
              {data.requisitos?.calidad?.length ? (
                <div>
                  <strong>Calidad</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {data.requisitos.calidad.map((r, idx) => <li key={`c-${idx}`}>{r}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <Card title="Objetivos (triple restricción)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>Concepto</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>Objetivo</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>Criterio de éxito</th>
                </tr>
              </thead>
              <tbody>
                {data.objetivos?.map((o, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', fontWeight: 700 }}>{idx + 1}. {o.concepto}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>{o.objetivo}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>{o.criterio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {registerStakeholders.length ? (
          <Card title="Stakeholders claves (registro PMI)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {registerStakeholders.map((s, idx) => (
                <span key={idx} style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 999, background: 'var(--highlight-bg, rgba(59,130,246,0.12))', fontSize: 13 }}>
                  {s.nombre} <span style={{ opacity: 0.7 }}>• {s.rol || s.puesto || s.clasificacion || ''}</span>
                </span>
              ))}
              <button
                type="button"
                onClick={() => { window.location.hash = 'stakeholder-register' }}
                style={{ marginLeft: 'auto', border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
              >
                Ver registro completo
              </button>
            </div>
          </Card>
        ) : (
          <Card title="Stakeholders claves (registro PMI)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>No hay registro cargado aún.</span>
              <button
                type="button"
                onClick={() => { window.location.hash = 'stakeholder-register' }}
                style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
              >
                Ir al registro
              </button>
            </div>
          </Card>
        )}

        <Card title="Resumen WBS / Entregables">
          {wbsSummary.length ? (
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {wbsSummary.map((p) => (
                <div key={p.codigo} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 10, background: 'var(--card-bg)' }}>
                  <div style={{ fontWeight: 700 }}>{p.codigo} — {p.nombre}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>{p.entregable || 'Entregable no definido'}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Costo estimado: {p.costo ? currency(p.costo) : '—'}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Fecha objetivo: {p.fecha || '—'}</div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => { if (typeof window !== 'undefined') { try { localStorage.setItem('wbs_last_view', 'wbs'); } catch {} window.location.hash = 'wbs' } }}
                style={{ border: '1px solid var(--border, #2a2f45)', padding: '8px 10px', borderRadius: 10, cursor: 'pointer', background: 'transparent' }}
              >
                Ver WBS completo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ opacity: 0.8 }}>No hay WBS cargado aún.</span>
              <button
                type="button"
                onClick={() => { if (typeof window !== 'undefined') { try { localStorage.setItem('wbs_last_view', 'wbs'); } catch {} window.location.hash = 'wbs' } }}
                style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
              >
                Ir a WBS
              </button>
            </div>
          )}
        </Card>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card title="Finalidad del proyecto">
            <div>{data.finalidad}</div>
          </Card>
          <Card title="Justificación">
            {data.justificacion?.cualitativa?.length ? (
              <div style={{ marginBottom: 8 }}>
                <strong>Justificación cualitativa</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {data.justificacion.cualitativa.map((j, idx) => <li key={`jq-${idx}`}>{j}</li>)}
                </ul>
              </div>
            ) : null}
            {data.justificacion?.cuantitativa ? (
              <div>
                <strong>Justificación cuantitativa</strong>
                <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 4 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Flujo de Ingresos</div>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {data.justificacion.cuantitativa.ingresos?.map((i, idx) => <li key={`ing-${idx}`}>{i.concepto}: {currency(i.monto)}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Flujo de Egresos</div>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {data.justificacion.cuantitativa.egresos?.map((i, idx) => <li key={`eg-${idx}`}>{i.concepto}: {currency(i.monto)}</li>)}
                    </ul>
                  </div>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Pill>VAN: {currency(data.justificacion.cuantitativa.VAN)}</Pill>
                  <Pill>TIR: {data.justificacion.cuantitativa.TIR}</Pill>
                  <Pill>RBC: {data.justificacion.cuantitativa.RBC}</Pill>
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <Card title="Designación del Project Manager">
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div><strong>Nombre:</strong> {data.pm?.nombre}</div>
            <div><strong>Reporta a:</strong> {data.pm?.reportaA}</div>
            <div><strong>Supervisa a:</strong> {data.pm?.supervisaA}</div>
          </div>
          {data.pm?.autoridad?.length ? (
            <div style={{ marginTop: 8 }}>
              <strong>Niveles de autoridad</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {data.pm.autoridad.map((a, idx) => <li key={`auth-${idx}`}>{a}</li>)}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card title="Cronograma de hitos">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>Hito / Evento</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>Fecha programada</th>
                </tr>
              </thead>
              <tbody>
                {data.hitos?.map((h, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>{h.evento}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>{h.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Organizaciones o grupos involucrados">
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {data.organizaciones?.map((o, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{o.nombre}</div>
                <div style={{ opacity: 0.85 }}>{o.rol}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card title="Principales amenazas">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.riesgos?.amenazas?.map((r, idx) => <li key={`am-${idx}`}>{r}</li>)}
            </ul>
          </Card>
          <Card title="Principales oportunidades">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.riesgos?.oportunidades?.map((r, idx) => <li key={`op-${idx}`}>{r}</li>)}
            </ul>
          </Card>
        </div>

        <Card title="Presupuesto preliminar">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>Concepto</th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.presupuesto?.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>{p.concepto}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid var(--border, #2a2f45)' }}>{currency(p.monto)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: 8, fontWeight: 700 }}>Total</td>
                  <td style={{ padding: 8, fontWeight: 700 }}>{currency(totalPresupuesto)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Sponsor que autoriza el proyecto">
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div><strong>Nombre:</strong> {data.sponsor?.nombre}</div>
            <div><strong>Empresa:</strong> {data.sponsor?.empresa}</div>
            <div><strong>Cargo:</strong> {data.sponsor?.cargo}</div>
            <div><strong>Fecha:</strong> {data.sponsor?.fecha}</div>
          </div>
        </Card>
      </div>
    </div>
  )
}

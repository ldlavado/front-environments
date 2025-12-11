import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../../utils/downloadElementAsPng'

const Pill = ({ children }) => (
  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: 'var(--highlight-bg, #222)', border: '1px solid var(--border, #333)', marginRight: 8, marginBottom: 6 }}>
    {children}
  </span>
)

const Section = ({ title, children, extra }) => (
  <div className="card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {extra}
    </div>
    {children}
  </div>
)

const defaultData = {
  stakeholders: [
    { rol: 'Patrocinio y decisión', actores: ['Cliente/Operaciones', 'Finanzas/Sponsors'], responsabilidad: 'Aprobar presupuesto multi-región y ventanas de prueba.' },
    { rol: 'Proveedor cloud/SRE', actores: ['Proveedor IoT/Cloud'], responsabilidad: 'Operar infraestructura activa-activa, SRE 24/7 y runbooks HA/DR.' },
    { rol: 'Seguridad y cumplimiento', actores: ['Seguridad/Compliance'], responsabilidad: 'Zero-Trust, SIEM y evidencias de auditoría.' },
    { rol: 'Operaciones en campo', actores: ['Equipos OT/IT en sitio'], responsabilidad: 'Soporte edge, pruebas controladas y continuidad local.' },
    { rol: 'Regulador/Auditor', actores: ['MinTIC/Regulador', 'Auditor interno'], responsabilidad: 'Revisar cumplimiento y trazabilidad.' },
  ],
  fin: {
    enunciado: 'Continuidad de servicio crítico asegurada con HA/DR multi-región y trazabilidad certificable.',
    indicadores: [
      { id: 'FIN-1', nombre: 'Disponibilidad de servicios críticos', meta: '≥99.95% multi-región', medio_verificacion: 'Monitoreo SRE y reportes mensuales' },
      { id: 'FIN-2', nombre: 'RTO/RPO validados', meta: '≤5 min en pruebas trimestrales', medio_verificacion: 'Bitácora de pruebas HA/DR' },
      { id: 'FIN-3', nombre: 'Auditorías y cumplimiento', meta: '0 hallazgos críticos', medio_verificacion: 'Informes de auditoría y SIEM' },
    ],
    supuestos: [
      'Regiones cloud disponibles y enlaces redundantes activos',
      'Patrocinio ejecutivo para reservas/contratos multi-región',
      'Dependencia de terceros (ISP/colo) sin fallas prolongadas',
    ],
  },
  proposito: {
    enunciado: 'Arquitectura activa-activa (Camino A) desplegada con runbooks automatizados y operación SRE 24/7.',
    indicadores: [
      { id: 'PRO-1', nombre: 'Pruebas HA/DR exitosas', meta: '≥4 por año, 100% exitosas', medio_verificacion: 'Bitácora automatizada y reportes SRE' },
      { id: 'PRO-2', nombre: 'Latencia a sitios críticos', meta: '<35 ms promedio', medio_verificacion: 'Monitoreo sintético' },
      { id: 'PRO-3', nombre: 'Runbooks actualizados', meta: '≥90% runbooks validados trimestralmente', medio_verificacion: 'Repositorio IaC/ops' },
      { id: 'PRO-4', nombre: 'SLA soporte', meta: 'MTTR <30 min para incidentes P1', medio_verificacion: 'Gestor de incidentes (ITSM)' },
    ],
    supuestos: [
      'Capacidad de pruebas controladas sin afectar operación',
      'Equipos SRE y seguridad con tiempo asignado a la plataforma',
    ],
  },
  componentes: [
    {
      id: 'C1',
      resultado: 'Infraestructura activa-activa multi-región entregada.',
      indicadores: [
        { id: 'C1-I1', nombre: 'Topología desplegada', meta: '2+ regiones activas', medio_verificacion: 'Arquitectura en IaC y monitoreo' },
        { id: 'C1-I2', nombre: 'Latencia y throughput', meta: '<35 ms / ≥p95 objetivo', medio_verificacion: 'Synthetic + APM' },
      ],
      supuestos: ['Regiones y AZ disponibles', 'Financiación de reservas y enlaces dedicados'],
      vinculos_portafolio: ['FO-01-P1'],
      programas: ['digital', 'operaciones'],
      entornos: ['técnico', 'legal'],
    },
    {
      id: 'C2',
      resultado: 'Orquestación y pruebas HA/DR automatizadas.',
      indicadores: [
        { id: 'C2-I1', nombre: 'Pruebas automatizadas', meta: '≥80% casos automatizados', medio_verificacion: 'Runbooks y pipelines' },
        { id: 'C2-I2', nombre: 'Cobertura de servicios', meta: '≥90% servicios críticos con runbook', medio_verificacion: 'Inventario de servicios' },
      ],
      supuestos: ['Acceso a datos de producción para pruebas controladas', 'Ventanas de prueba acordadas con negocio'],
      vinculos_portafolio: ['FO-01-P1'],
      programas: ['operaciones', 'cumplimiento'],
      entornos: ['técnico'],
    },
    {
      id: 'C3',
      resultado: 'Trazabilidad y cumplimiento Zero-Trust para HA/DR.',
      indicadores: [
        { id: 'C3-I1', nombre: 'Auditoría DR', meta: '100% eventos críticos registrados', medio_verificacion: 'SIEM y bitácoras' },
        { id: 'C3-I2', nombre: 'Hallazgos críticos', meta: '0', medio_verificacion: 'Reportes de auditoría' },
      ],
      supuestos: ['Integraciones SIEM y gestión de identidades listas', 'Políticas de retención definidas'],
      vinculos_portafolio: ['FA-02-P1'],
      programas: ['cumplimiento', 'digital'],
      entornos: ['legal', 'técnico'],
    },
    {
      id: 'C4',
      resultado: 'Operación SRE 24/7 y soporte en campo/edge.',
      indicadores: [
        { id: 'C4-I1', nombre: 'Cobertura SRE', meta: '24/7 con runbooks validados', medio_verificacion: 'Calendario on-call y auditorías' },
        { id: 'C4-I2', nombre: 'MTTR incidentes P1', meta: '<30 min', medio_verificacion: 'ITSM / postmortems' },
      ],
      supuestos: ['Rotación on-call cubierta', 'Alineación con equipos de campo y seguridad'],
      vinculos_portafolio: ['FO-01-P1'],
      programas: ['operaciones'],
      entornos: ['técnico', 'social'],
    },
  ],
  actividades: [
    { id: 'A1', componente: 'C1', nombre: 'Diseño IaC multi-región y revisión de arquitectura', medios: ['Repositorios IaC', 'Revisión de pares'] },
    { id: 'A2', componente: 'C1', nombre: 'Provisionamiento automatizado en 2+ regiones', medios: ['Pipelines CI/CD', 'Metricas de despliegue'] },
    { id: 'A3', componente: 'C2', nombre: 'Automatizar runbooks de failover/failback', medios: ['Runbooks DR', 'Pipelines'] },
    { id: 'A4', componente: 'C2', nombre: 'Pruebas trimestrales HA/DR y observabilidad sintética', medios: ['Bitácora de pruebas', 'APM'] },
    { id: 'A5', componente: 'C3', nombre: 'Integrar trazabilidad y SIEM para eventos DR', medios: ['SIEM', 'Dashboards de auditoría'] },
    { id: 'A6', componente: 'C3', nombre: 'Validar controles de cumplimiento (Zero-Trust, cifrado)', medios: ['Checklist y evidencias'] },
    { id: 'A7', componente: 'C4', nombre: 'Operación SRE 24/7 y playbooks', medios: ['ITSM', 'Postmortems'] },
    { id: 'A8', componente: 'C4', nombre: 'Soporte en campo/edge y capacitación', medios: ['Reportes de campo', 'Plan de formación'] },
  ],
  supuestos_globales: [
    'No hay restricciones regulatorias nuevas que bloqueen multi-región',
    'Los costos de red y cloud se mantienen dentro del caso de negocio',
  ],
}

export default function MmlMatrix2() {
  const [data, setData] = useState(() => {
    try { const raw = localStorage.getItem('mml2_data'); return raw ? JSON.parse(raw) : defaultData } catch { return defaultData }
  })
  const matrixRef = useRef(null)

  const handleImport = async (evt) => {
    const file = evt.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setData(json)
      try { localStorage.setItem('mml2_data', JSON.stringify(json)) } catch { /* ignore */ }
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
      a.download = 'mml2.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('mml2_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(matrixRef.current, 'matriz_mml2.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const activitiesByComponent = useMemo(() => {
    const map = new Map()
    data.actividades?.forEach((act) => {
      if (!map.has(act.componente)) map.set(act.componente, [])
      map.get(act.componente).push(act)
    })
    return map
  }, [data.actividades])

  const renderIndicators = (list) => {
    if (!list?.length) return null
    return (
      <div style={{ marginBottom: 6 }}>
        {list.map((i) => (
          <div key={i.id || i.nombre} style={{ marginBottom: 6 }}>
            <Pill>{i.id || 'IND'}</Pill>
            <strong>{i.nombre}</strong>
            {i.meta ? <> — Meta: <em>{i.meta}</em></> : null}
            {i.medio_verificacion ? <> — MV: <span style={{ opacity: 0.85 }}>{i.medio_verificacion}</span></> : null}
          </div>
        ))}
      </div>
    )
  }

  const renderPills = (items, label) => {
    if (!items?.length) return null
    return (
      <div style={{ marginTop: 4 }}>
        {label ? <strong>{label}:</strong> : null}{' '}
        {items.map((s, idx) => <Pill key={`${label || 'pill'}-${idx}`}>{s}</Pill>)}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: '12px 0 8px' }}>Matriz MML_2 — Camino A (HA/DR multi-región)</h2>
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
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        Marco lógico enfocado en la solución óptima (Camino A, FO-01-P1): arquitectura activa-activa multi-región con runbooks automatizados, trazabilidad y operación SRE 24/7.
      </p>

      <div ref={matrixRef} style={{ display: 'grid', gap: 12 }}>
        <Section title="Fin">
          <div style={{ marginBottom: 6 }}><strong>Enunciado:</strong> {data.fin?.enunciado}</div>
          {renderIndicators(data.fin?.indicadores)}
          {renderPills(data.fin?.supuestos, 'Supuestos')}
        </Section>

        <Section title="Propósito">
          <div style={{ marginBottom: 6 }}><strong>Enunciado:</strong> {data.proposito?.enunciado}</div>
          {renderIndicators(data.proposito?.indicadores)}
          {renderPills(data.proposito?.supuestos, 'Supuestos')}
        </Section>

        <Section
          title={`Componentes (${data.componentes?.length || 0})`}
          extra={<span style={{ fontSize: 12, opacity: 0.75 }}>Actividades: {data.actividades?.length || 0}</span>}
        >
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {data.componentes?.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 10 }}>
                <div style={{ marginBottom: 4 }}><Pill>{c.id}</Pill> <strong>{c.resultado}</strong></div>
                {renderIndicators(c.indicadores)}
                {renderPills(c.vinculos_portafolio, 'Portafolio')}
                {renderPills(c.programas, 'Programas')}
                {renderPills(c.entornos, 'Entornos')}
                {renderPills(c.supuestos, 'Supuestos')}
                {activitiesByComponent.get(c.id)?.length ? (
                  <div style={{ marginTop: 6 }}>
                    <strong>Actividades:</strong>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {activitiesByComponent.get(c.id).map((a) => (
                        <li key={a.id} style={{ marginBottom: 4 }}>
                          <Pill>{a.id}</Pill> {a.nombre}
                          {a.medios ? <div style={{ fontSize: 12, opacity: 0.8 }}>Medios: {a.medios.join ? a.medios.join(', ') : a.medios}</div> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>

        {data.stakeholders?.length ? (
          <Section title="Stakeholders clave">
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {data.stakeholders.map((s, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 10 }}>
                  <div style={{ marginBottom: 4 }}><Pill>{s.rol}</Pill></div>
                  {s.actores ? <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Actores:</strong> {Array.isArray(s.actores) ? s.actores.join(', ') : s.actores}</div> : null}
                  {s.responsabilidad ? <div style={{ fontSize: 13, opacity: 0.85 }}><strong>Responsabilidad:</strong> {s.responsabilidad}</div> : null}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {data.supuestos_globales?.length ? (
          <Section title="Supuestos globales">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {data.supuestos_globales.map((s, idx) => <li key={idx}>{s}</li>)}
            </ul>
          </Section>
        ) : null}
      </div>
    </div>
  )
}

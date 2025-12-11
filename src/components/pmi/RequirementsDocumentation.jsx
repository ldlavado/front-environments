import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../../utils/downloadElementAsPng'
import { filterImpactfulStakeholders } from '../../utils/impactfulStakeholders'

const Card = ({ title, children }) => (
  <div className="card" style={{ padding: 16, borderRadius: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
    </div>
    {children}
  </div>
)

const allowedNames = ['mintic', 'proveedor iot/cloud', 'cliente/operaciones']

const defaultData = {
  meta: {
    nombre: 'Documentación de Requisitos — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
  },
  necesidad: 'Asegurar continuidad certificable para servicios críticos mediante una arquitectura HA/DR multi-región con trazabilidad y operación SRE.',
  objetivos: [
    'Garantizar RTO/RPO ≤5 min validados trimestralmente.',
    'Alinear continuidad y cumplimiento Zero-Trust con regulaciones TIC.',
    'Reducir riesgo reputacional y operativo por caídas regionales.',
  ],
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
  criteriosAceptacion: [
    { concepto: 'Técnicos', criterio: 'Pruebas HA/DR trimestrales exitosas en 100% servicios críticos.' },
    { concepto: 'Calidad', criterio: '0 hallazgos críticos en auditoría de continuidad y seguridad.' },
    { concepto: 'Administrativos', criterio: 'Aprobación formal de ventanas y cambios por el comité.' },
    { concepto: 'Comerciales', criterio: 'TCO dentro de ±10% vs. caso de negocio a 3 años.' },
  ],
  reglasNegocio: [
    'Cambios de HA/DR requieren aprobación del comité de continuidad.',
    'Toda evidencia debe registrarse en SIEM y repositorio de auditoría.',
  ],
  impactosOrganizacion: [
    'Operaciones debe ajustar procesos de cambio y on-call.',
    'Finanzas ajusta reservas multi-región y costos de red.',
  ],
  impactosEntidades: [
    'Coordinación con MinTIC/Regulador para reportes y visitas.',
    'Proveedores cloud y de conectividad para ventanas de prueba.',
  ],
  soporteEntrenamiento: [
    'Capacitación para equipos SRE y de campo en runbooks y SIEM.',
    'Simulacros trimestrales con usuarios clave.',
  ],
  supuestos: [
    'Disponibilidad de regiones y enlaces redundantes.',
    'Patrocinio ejecutivo sostenido para reservas multi-región.',
  ],
  restricciones: [
    'Ventanas de cambio limitadas en horarios de operación.',
    'Cumplimiento de políticas de datos y privacidad en replicación.',
  ],
}

const normalize = (val) => (val || '').toString().trim().toLowerCase()

const filterAllowed = (stakeholders = []) => stakeholders.filter((s) => allowedNames.includes(normalize(s.stakeholder || s.nombre)))

const buildReqsFromStakeholders = (stakeholders = []) => {
  const base = stakeholders.length ? filterAllowed(stakeholders) : []
  const mapToReq = (prefix, list, minLen) => {
    const rows = list.map((s, idx) => ({
      stakeholder: s.stakeholder || s.nombre,
      prioridad: Number(s.total_pct || 0) >= 15 ? 'Alta' : 'Media',
      codigo: `${prefix}-${String(idx + 1).padStart(2, '0')}`,
      requerimiento: `Requisito priorizado por ${s.stakeholder || s.nombre}`,
      descripcion: 'Derivado de variables priorizadas y acuerdos de gestión.',
    }))
    while (rows.length < minLen && rows.length) {
      rows.push({ ...rows[rows.length - 1], codigo: `${prefix}-${String(rows.length + 1).padStart(2, '0')}` })
    }
    return rows
  }
  return {
    funcionales: mapToReq('RF', base, 8),
    noFuncionales: mapToReq('RNF', base, 8),
    calidad: mapToReq('RC', base.slice(0, 1), 1),
  }
}

const Table = ({ title, rows }) => (
  <Card title={title}>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
        <thead>
          <tr>
            <th style={th}>Stakeholder</th>
            <th style={th}>Prioridad</th>
            <th style={th}>Código</th>
            <th style={th}>Requisito</th>
            <th style={th}>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td style={td}>{r.stakeholder}</td>
              <td style={td}>{r.prioridad}</td>
              <td style={td}>{r.codigo}</td>
              <td style={td}>{r.requerimiento}</td>
              <td style={td}>{r.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
)

export default function RequirementsDocumentation({ stakeholders: externalStakeholders = [] }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('requirements_doc_data')
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
      try { localStorage.setItem('requirements_doc_data', JSON.stringify(json)) } catch { /* ignore */ }
    } catch (err) {
      alert('Archivo inválido: ' + err.message)
    } finally {
      evt.target.value = ''
    }
  }

  const handleExport = () => {
    try {
      const payload = data
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'documentacion_requisitos.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('requirements_doc_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'documentacion_requisitos.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const impactful = useMemo(
    () => filterAllowed(filterImpactfulStakeholders(externalStakeholders)),
    [externalStakeholders],
  )
  const requisitos = useMemo(() => {
    const withStakeholders = impactful.length ? buildReqsFromStakeholders(impactful) : null
    return {
      funcionales: data.requisitos?.funcionales?.length ? data.requisitos.funcionales : withStakeholders?.funcionales || [],
      noFuncionales: data.requisitos?.noFuncionales?.length ? data.requisitos.noFuncionales : withStakeholders?.noFuncionales || [],
      calidad: data.requisitos?.calidad?.length ? data.requisitos.calidad : withStakeholders?.calidad || [],
    }
  }, [data.requisitos, impactful])

  const criterios = data.criteriosAceptacion || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>Documentación de Requisitos</h2>
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
        <Card title="Identificación y necesidad">
          <div style={{ marginBottom: 4 }}><strong>Nombre del proyecto:</strong> {data.meta?.nombre}</div>
          <div style={{ marginBottom: 4 }}><strong>Siglas del proyecto:</strong> {data.meta?.siglas}</div>
          <div style={{ marginBottom: 6 }}><strong>Necesidad del negocio u oportunidad:</strong> {data.necesidad}</div>
          <div>
            <strong>Objetivos del negocio y del proyecto</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {data.objetivos?.map((o, idx) => <li key={idx}>{o}</li>)}
            </ul>
          </div>
        </Card>

        <Table title="Requisitos funcionales" rows={requisitos.funcionales} />
        <Table title="Requisitos no funcionales" rows={requisitos.noFuncionales} />
        <Table title="Requisitos de calidad" rows={requisitos.calidad} />

        <Card title="Criterios de aceptación">
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {criterios.map((c, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{c.concepto}</div>
                <div style={{ marginTop: 4 }}>{c.criterio}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card title="Reglas del negocio">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.reglasNegocio?.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          </Card>
          <Card title="Requerimientos de soporte y entrenamiento">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.soporteEntrenamiento?.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card title="Impactos en otras áreas organizacionales">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.impactosOrganizacion?.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          </Card>
          <Card title="Impactos en otras entidades">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.impactosEntidades?.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card title="Supuestos relativos a requisitos">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.supuestos?.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          </Card>
          <Card title="Restricciones relativas a requisitos">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.restricciones?.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

const th = { textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', whiteSpace: 'nowrap' }
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top' }
const btn = { border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }

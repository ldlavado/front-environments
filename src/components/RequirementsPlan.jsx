import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'
import { filterImpactfulStakeholders } from '../utils/impactfulStakeholders'

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
    nombre: 'Plan de Gestión de Requisitos — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
  },
  stakeholdersFoco: [
    { nombre: 'MinTIC', interes: 'Cumplimiento de lineamientos TIC y continuidad certificable', rol: 'Regulador', prioridad: 'Alta' },
    { nombre: 'Proveedor IoT/Cloud', interes: 'SLA, operación HA/DR, soporte SRE', rol: 'Proveedor', prioridad: 'Alta' },
    { nombre: 'Cliente/Operaciones', interes: 'Continuidad, trazabilidad y adopción', rol: 'Patrocinador/usuario', prioridad: 'Alta' },
  ],
  actividadesRequisitos: [
    { actividad: 'Levantamiento y refinamiento de requisitos', responsable: 'PMO + Cliente/Operaciones', frecuencia: 'Quincenal', salida: 'Backlog priorizado y acta de acuerdos' },
    { actividad: 'Validación con MinTIC', responsable: 'PMO + Seguridad/Compliance', frecuencia: 'Mensual', salida: 'Minutas y evidencias de alineación regulatoria' },
    { actividad: 'Ajustes con Proveedor IoT/Cloud', responsable: 'SRE + Arquitectura', frecuencia: 'Mensual', salida: 'Runbooks/CRs actualizados' },
    { actividad: 'Revisión de riesgos y dependencias', responsable: 'PM + Comité', frecuencia: 'Mensual', salida: 'Bitácora de riesgos y decisiones' },
  ],
  configuracion: [
    { paso: 'Registrar cambio de requisito (issue/CR) y versión', responsable: 'PMO', criterio: 'Ticket con contexto y trazas previas' },
    { paso: 'Analizar impacto (Project Charter y Documentación de Requisitos)', responsable: 'Arquitectura + PMO', criterio: 'Impacto en alcance, costo y SLA' },
    { paso: 'Aprobación por comité de continuidad', responsable: 'Cliente/Operaciones', criterio: 'Go/No-Go formal' },
    { paso: 'Actualización de artefactos y evidencias', responsable: 'SRE + DevOps', criterio: 'Versionado vX.Y y SIEM actualizado' },
  ],
  priorizacion: 'Se prioriza según impacto en continuidad, peso del stakeholder y trazabilidad en Documentación de Requisitos.',
  metricas: [
    { nombre: 'Cobertura de requisitos', proposito: 'Medir avance vs. plan', formula: 'Completados / Totales', objetivo: '≥85% en cada release' },
    { nombre: 'Volatilidad de requisitos', proposito: 'Controlar cambios no planificados', formula: 'Cambios aprobados / Iteración', objetivo: '≤10% iteración' },
    { nombre: 'Trazabilidad validada', proposito: 'Asegurar vínculo req-prueba-aceptación', formula: 'Req con trazabilidad / Totales', objetivo: '100%' },
    { nombre: 'Cumplimiento SLA/HA', proposito: 'Verificar continuidad', formula: 'RTO/RPO logrados / pruebas', objetivo: '100% pruebas trimestrales' },
  ],
  trazabilidad: [
    'Cada requisito referencia stakeholder (Registro/Gestión) y entrada en Documentación de Requisitos.',
    'Matriz enlaza requisitos con pruebas HA/DR, runbooks, criterios de aceptación y WBS/actividades.',
    'Registros en SIEM/bitácora para evidenciar cumplimiento y auditoría.',
  ],
  rolesAutorizacion: [
    'Cliente/Operaciones: aprueba cambios de alcance y ventanas.',
    'MinTIC: verifica alineación regulatoria y solicita evidencias.',
    'Proveedor IoT/Cloud: valida viabilidad técnica y SLAs.',
  ],
  artefactos: [
    'Backlog de requisitos versionado (repo + tablero).',
    'Matriz de trazabilidad (req ↔ pruebas ↔ aceptación ↔ runbooks).',
    'Actas del comité de continuidad y control de cambios.',
  ],
}

const normalize = (val) => (val || '').toString().trim()
const filterAllowed = (stakeholders = []) => stakeholders.filter((s) => allowedNames.includes(normalize(s.stakeholder || s.nombre).toLowerCase()))

export default function RequirementsPlan({ stakeholders: externalStakeholders = [] }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('requirements_plan_data')
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
      try { localStorage.setItem('requirements_plan_data', JSON.stringify(json)) } catch { /* ignore */ }
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
      a.download = 'plan_gestion_requisitos.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('requirements_plan_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'plan_gestion_requisitos.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const impactful = useMemo(() => filterAllowed(filterImpactfulStakeholders(externalStakeholders)), [externalStakeholders])
  const stakeholdersList = impactful.length ? impactful : filterAllowed(externalStakeholders)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>Plan de Gestión de Requisitos</h2>
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
        <Card title="Stakeholders y foco">
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {data.stakeholdersFoco?.map((s, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{s.nombre}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Interés: {s.interes}</div>
                <div style={{ fontSize: 13 }}>Rol: {s.rol}</div>
                <div style={{ fontSize: 13 }}>Prioridad: {s.prioridad}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Actividades de requisitos">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Actividad</th>
                  <th style={th}>Responsable</th>
                  <th style={th}>Frecuencia</th>
                  <th style={th}>Salida/artefacto</th>
                </tr>
              </thead>
              <tbody>
                {data.actividadesRequisitos?.map((a, idx) => (
                  <tr key={idx}>
                    <td style={td}>{a.actividad}</td>
                    <td style={td}>{a.responsable}</td>
                    <td style={td}>{a.frecuencia}</td>
                    <td style={td}>{a.salida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Actividades de gestión de configuración">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Paso</th>
                  <th style={th}>Responsable</th>
                  <th style={th}>Criterio de aceptación</th>
                </tr>
              </thead>
              <tbody>
                {data.configuracion?.map((a, idx) => (
                  <tr key={idx}>
                    <td style={td}>{a.paso}</td>
                    <td style={td}>{a.responsable}</td>
                    <td style={td}>{a.criterio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Proceso de priorización de requisitos">
          <div>{data.priorizacion}</div>
          {stakeholdersList?.length ? (
            <div style={{ marginTop: 8 }}>
              <strong>Stakeholders considerados:</strong>{' '}
              {stakeholdersList.map((s) => normalize(s.stakeholder || s.nombre)).join(', ')}
            </div>
          ) : null}
        </Card>

        <Card title="Métricas del producto">
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {data.metricas?.map((m, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{m.nombre}</div>
                <div style={{ marginTop: 4, opacity: 0.85 }}>{m.proposito}</div>
                {m.formula ? <div style={{ marginTop: 4, fontStyle: 'italic' }}>Fórmula: {m.formula}</div> : null}
                {m.objetivo ? <div style={{ marginTop: 4 }}>Objetivo: {m.objetivo}</div> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Estructura de trazabilidad">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {data.trazabilidad?.map((t, idx) => <li key={idx}>{t}</li>)}
          </ul>
        </Card>

        <Card title="Roles y autorizaciones">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {data.rolesAutorizacion?.map((t, idx) => <li key={idx}>{t}</li>)}
          </ul>
        </Card>

        <Card title="Artefactos y evidencias">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {data.artefactos?.map((t, idx) => <li key={idx}>{t}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  )
}

const th = { textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', whiteSpace: 'nowrap' }
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top' }
const btn = { border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }

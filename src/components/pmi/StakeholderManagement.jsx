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

const defaultData = {
  meta: {
    nombre: 'Gestión de Stakeholders — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
    fecha: '2026-01-15',
  },
  estrategias: [
    {
      stakeholder: 'MinTIC',
      interes: 'Alto: lineamientos TIC, datos e interoperabilidad.',
      impacto: 'Alto: define requerimientos regulatorios y de continuidad.',
      estrategia: 'Compartir evidencias de HA/DR, trazabilidad y datos abiertos; coordinar revisiones.',
      observaciones: 'Alinear reportes a guías MinTIC y mantener canales formales.',
    },
    {
      stakeholder: 'Cliente / Operaciones',
      interes: 'Muy alto: continuidad y trazabilidad de servicios críticos.',
      impacto: 'Alto (decisor de presupuesto y prioridad).',
      estrategia: 'Sesiones quincenales de avance, tablero de riesgos y aprobación de ventanas de prueba.',
      observaciones: 'Mantener métricas de disponibilidad y costos alineadas al caso de negocio.',
    },
    {
      stakeholder: 'Proveedor cloud / SRE',
      interes: 'Alto: operación activa-activa y HA/DR.',
      impacto: 'Medio-Alto (ejecutor técnico).',
      estrategia: 'Runbooks validados, backlog priorizado y calendario de pruebas HA/DR trimestral.',
      observaciones: 'Alinear on-call y tiempos de respuesta con negocio.',
    },
    {
      stakeholder: 'Seguridad y Cumplimiento',
      interes: 'Alto: auditoría y Zero-Trust.',
      impacto: 'Alto (puede bloquear liberaciones).',
      estrategia: 'Checklist de controles, evidencias en SIEM y revisiones mensuales de cumplimiento.',
      observaciones: 'Preparar paquete de auditoría previo a pruebas DR.',
    },
    {
      stakeholder: 'Equipos OT/IT en sitio',
      interes: 'Medio: continuidad en campo.',
      impacto: 'Medio (operación local).',
      estrategia: 'Capacitaciones y simulacros de conmutación; manuales simplificados.',
      observaciones: 'Considerar restricciones de horario y mantenimiento local.',
    },
    {
      stakeholder: 'Regulador / Auditor',
      interes: 'Variable: alto en auditorías y cierres.',
      impacto: 'Alto (hallazgos críticos).',
      estrategia: 'Evidencias trazables, informes de pruebas HA/DR y walkthrough de SIEM.',
      observaciones: 'Coordinar visitas/auditorías con mínimo 3 semanas de antelación.',
    },
  ],
}

const buildStrategiesFromRadar = (stakeholders = []) =>
  stakeholders.map((s) => {
    const variables = Object.entries(s.variables || {})
      .sort(([, a], [, b]) => (Number(b.total_pct) || 0) - (Number(a.total_pct) || 0))
      .slice(0, 3)
      .map(([name, detail]) => `${name} (${detail.total_pct || 0}%)`)
    return {
      stakeholder: s.stakeholder,
      interes: `Peso total: ${s.total_pct ?? '—'}%`,
      impacto: variables.length ? `Variables clave: ${variables.join(' • ')}` : 'Sin variables definidas',
      estrategia: 'Ajustar mensajes y métricas según las variables priorizadas.',
      observaciones: 'Fuente: Editor/Radar (sincrónico).',
    }
  })

export default function StakeholderManagement({ stakeholders: externalStakeholders = [] }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('stakeholder_management_data')
      return raw ? JSON.parse(raw) : defaultData
    } catch {
      return defaultData
    }
  })
  const ref = useRef(null)
  const [filter, setFilter] = useState('')

  const handleImport = async (evt) => {
    const file = evt.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setData(json)
      try { localStorage.setItem('stakeholder_management_data', JSON.stringify(json)) } catch { /* ignore */ }
    } catch (err) {
      alert('Archivo inválido: ' + err.message)
    } finally {
      evt.target.value = ''
    }
  }

  const handleExport = () => {
    try {
      const payload = { ...(data || {}), estrategias }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'gestion_stakeholders.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('stakeholder_management_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'gestion_stakeholders.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const impactful = useMemo(() => filterImpactfulStakeholders(externalStakeholders), [externalStakeholders])
  const estrategias = useMemo(
    () => (impactful.length ? buildStrategiesFromRadar(impactful) : data.estrategias || []),
    [impactful, data.estrategias],
  )

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase()
    if (!term) return estrategias
    return estrategias.filter((e) =>
      [e.stakeholder, e.interes, e.impacto, e.estrategia, e.observaciones]
        .some((v) => String(v || '').toLowerCase().includes(term)),
    )
  }, [estrategias, filter])

  const goToRadar = (name) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('radar_selected_stakeholder', name) } catch { /* ignore */ }
      window.location.hash = 'radar'
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>Gestión de Stakeholders (PMI)</h2>
          <div style={{ opacity: 0.8 }}>
            {data.meta?.nombre || 'Proyecto'} — {data.meta?.siglas} • {data.meta?.fecha}
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

      <div ref={ref} style={{ display: 'grid', gap: 12 }}>
        <Card title="Estrategia de gestión de stakeholders">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }} data-export-ignore="true">
            <input
              placeholder="Filtrar por stakeholder, interés o estrategia"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #2a2f45)' }}
            />
            <span style={{ fontSize: 13, opacity: 0.75 }}>{filtered.length} de {estrategias.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                <th style={thSticky}>Stakeholder</th>
                <th style={thSticky}>Interés en el proyecto</th>
                <th style={thSticky}>Evaluación del impacto</th>
                <th style={thSticky}>Estrategia potencial (soporte / obstáculos)</th>
                <th style={thSticky}>Observaciones y comentarios</th>
                <th style={thSticky}>Entornos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, idx) => (
                <tr key={idx}>
                  <td style={td}>{e.stakeholder}</td>
                  <td style={td}><Badge text={e.interes} tone="info" /></td>
                  <td style={td}><Badge text={e.impacto} tone="warn" /></td>
                  <td style={td}>{e.estrategia}</td>
                  <td style={td}>{e.observaciones}</td>
                  <td style={td}>
                    <button
                      onClick={() => goToRadar(e.stakeholder)}
                      style={{ border: '1px solid var(--border, #2a2f45)', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
                      title="Ver en Radar"
                    >
                      🔍
                    </button>
                  </td>
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
const thSticky = { ...th, position: 'sticky', top: 0, background: 'var(--card-bg, #fff)', zIndex: 1 }
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top' }

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
    }}>
      {text}
    </span>
  )
}

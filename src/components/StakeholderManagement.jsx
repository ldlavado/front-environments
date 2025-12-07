import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'

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

export default function StakeholderManagement() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('stakeholder_management_data')
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
      try { localStorage.setItem('stakeholder_management_data', JSON.stringify(json)) } catch { /* ignore */ }
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

  const estrategias = useMemo(() => data.estrategias || [], [data.estrategias])

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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={th}>Stakeholder</th>
                  <th style={th}>Interés en el proyecto</th>
                  <th style={th}>Evaluación del impacto</th>
                  <th style={th}>Estrategia potencial (soporte / obstáculos)</th>
                  <th style={th}>Observaciones y comentarios</th>
                </tr>
              </thead>
              <tbody>
                {estrategias.map((e, idx) => (
                  <tr key={idx}>
                    <td style={td}>{e.stakeholder}</td>
                    <td style={td}>{e.interes}</td>
                    <td style={td}>{e.impacto}</td>
                    <td style={td}>{e.estrategia}</td>
                    <td style={td}>{e.observaciones}</td>
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
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top' }

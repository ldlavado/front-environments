import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'
import { MatrixInfoModal } from './MatrixInfoModal'
import { filterImpactfulStakeholders } from '../utils/impactfulStakeholders'

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
    nombre: 'Registro de Stakeholders — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
    fecha: '2026-01-15',
  },
  stakeholders: [
    {
      nombre: 'MinTIC',
      empresa: 'Ministerio TIC',
      puesto: 'Regulador sector TIC',
      ubicacion: 'Bogotá',
      evaluacion: 'Regulador/definidor de lineamientos',
      rol: 'Normativa, datos e interoperabilidad',
      contacto: 'contacto@mintic.gov.co',
      requerimientos: 'Cumplimiento de lineamientos TIC, datos abiertos, seguridad y resiliencia.',
      expectativas: 'Evidencias de continuidad y trazabilidad en servicios críticos.',
      influencia: 'Alta',
      clasificacion: 'Externo',
      apoyo: 'Neutral',
      fase: 'Planificación y auditorías',
    },
    {
      nombre: 'Proveedor IoT/Cloud',
      empresa: 'Proveedor IoT/Cloud',
      puesto: 'Operación y soporte 24/7',
      ubicacion: 'Remoto / multi-región',
      evaluacion: 'Ejecutor técnico',
      rol: 'Proveedor y ejecutor',
      contacto: 'sre@proveedorcloud.com',
      requerimientos: 'Runbooks validados, acceso a métricas y SIEM.',
      expectativas: 'Backlog priorizado y ventanas de prueba definidas.',
      influencia: 'Media',
      clasificacion: 'Externo',
      apoyo: 'Apoyo',
      fase: 'Ejecución',
    },
    {
      nombre: 'Cliente/Operaciones',
      empresa: 'Operador de servicios críticos',
      puesto: 'Patrocinio y decisión',
      ubicacion: 'HQ + multi-sitio',
      evaluacion: 'Aprobador clave (alto impacto)',
      rol: 'Sponsor / aprobador',
      contacto: 'sponsor@cliente.com',
      requerimientos: 'Ventanas controladas, trazabilidad y reportes de riesgo.',
      expectativas: 'Disponibilidad ≥99.95% y RTO/RPO ≤5 min validados.',
      influencia: 'Alta',
      clasificacion: 'Interno',
      apoyo: 'Apoyo',
      fase: 'Planificación',
    },
  ],
}

const normalizeName = (name) => (name || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const findMeta = (metaMap, name) => {
  const norm = normalizeName(name)
  if (metaMap.has(norm)) return metaMap.get(norm)
  // intentar coincidencia parcial (ej. "Proveedor IoT/Cloud" vs "Proveedor cloud / SRE")
  let best = null
  metaMap.forEach((val, key) => {
    if (key.includes(norm) || norm.includes(key)) best = val
  })
  return best
}

const mapFromRadar = (stakeholders = [], metaMap = new Map()) =>
  stakeholders.map((s) => {
    const variables = Object.entries(s.variables || {})
      .sort(([, a], [, b]) => (Number(b.total_pct) || 0) - (Number(a.total_pct) || 0))
      .map(([name, detail]) => ({
        nombre: name,
        total: Number(detail.total_pct) || 0,
        topImpacto:
          Object.entries(detail.impacto_pct || {})
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 2)
            .map(([env, val]) => `${env}: ${val}%`)
            .join(', ') || 'Sin impactos',
      }))

    const meta = findMeta(metaMap, s.stakeholder)

    return {
      nombre: s.stakeholder,
      rol: meta?.rol || `Peso total: ${s.total_pct ?? '—'}%`,
      clasificacion: meta?.clasificacion || '—',
      evaluacion: meta?.evaluacion || (variables[0] ? `Variable principal: ${variables[0].nombre}` : 'Sin variables'),
      fase: meta?.fase || '—',
      apoyo: meta?.apoyo || '—',
      detalles: { variables },
    }
  })

export default function StakeholderRegister({ stakeholders: externalStakeholders = [] }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('stakeholder_register_data')
      return raw ? JSON.parse(raw) : defaultData
    } catch {
      return defaultData
    }
  })
  const ref = useRef(null)
  const [selected, setSelected] = useState(null)

  const handleImport = async (evt) => {
    const file = evt.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setData(json)
      try { localStorage.setItem('stakeholder_register_data', JSON.stringify(json)) } catch { /* ignore */ }
    } catch (err) {
      alert('Archivo inválido: ' + err.message)
    } finally {
      evt.target.value = ''
    }
  }

  const handleExport = () => {
    try {
      const payload = { ...(data || {}), stakeholders }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'registro_stakeholders.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('stakeholder_register_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'registro_stakeholders.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const metaMap = useMemo(() => {
    const map = new Map()
    ;(data.stakeholders || []).forEach((s) => {
      map.set(normalizeName(s.nombre), s)
    })
    const proveedor = map.get(normalizeName('Proveedor cloud / SRE'))
    if (proveedor) {
      map.set(normalizeName('Proveedor IoT/Cloud'), proveedor)
      map.set(normalizeName('Proveedor iot cloud'), proveedor)
    }
    return map
  }, [data.stakeholders])

  const impactful = useMemo(() => filterImpactfulStakeholders(externalStakeholders), [externalStakeholders])
  const stakeholders = useMemo(
    () => (impactful.length ? mapFromRadar(impactful, metaMap) : data.stakeholders || []),
    [impactful, data.stakeholders, metaMap],
  )

  const modalSections = useMemo(() => {
    if (!selected) return []
    const baseSections = [
      {
        title: 'Identificación',
        content: (
          <div>
            <div><strong>Nombre:</strong> {selected.nombre}</div>
            <div><strong>Rol:</strong> {selected.rol || '—'}</div>
            <div><strong>Evaluación:</strong> {selected.evaluacion || '—'}</div>
          </div>
        ),
      },
      {
        title: 'Influencia y clasificación',
        content: (
          <div>
            <div><strong>Clasificación:</strong> {selected.clasificacion || '—'}</div>
            <div><strong>Fase de interés:</strong> {selected.fase || '—'}</div>
            <div><strong>Apoyo/Neutral/Opositor:</strong> {selected.apoyo || '—'}</div>
          </div>
        ),
      },
    ]

    if (selected.detalles?.variables?.length) {
      baseSections.push({
        title: 'Variables y entorno',
        content: (
          <div style={{ display: 'grid', gap: 6 }}>
            {selected.detalles.variables.map((v, idx) => (
              <div key={idx} style={{ padding: '6px 8px', border: '1px solid var(--border, #2a2f45)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{v.nombre}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Peso: {v.total}%</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Impacto: {v.topImpacto}</div>
              </div>
            ))}
          </div>
        ),
      })
    } else {
      baseSections.push({
        title: 'Requerimientos y expectativas',
        content: (
          <div>
            <div><strong>Requerimientos primordiales:</strong> {selected.requerimientos || '—'}</div>
            <div><strong>Expectativas principales:</strong> {selected.expectativas || '—'}</div>
          </div>
        ),
      })
    }

    return baseSections
  }, [selected])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>Registro de Stakeholders (PMI)</h2>
          <div style={{ opacity: 0.8 }}>
            {data.meta?.nombre || 'Proyecto'} — {data.meta?.siglas} • {data.meta?.fecha}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }} data-export-ignore="true">
          <button
            onClick={() => { window.location.hash = 'project-charter' }}
            style={{ border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
          >
            Ir a Project Charter
          </button>
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
        <Card title="Identificación de stakeholders">
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {stakeholders.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(s)}
                style={{
                  textAlign: 'left',
                  border: `1px solid var(--border, #2a2f45)`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  background: 'var(--card-bg)',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                }}
                title="Ver detalle"
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.nombre}</div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>{s.rol}</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>{s.clasificacion} • {s.apoyo}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <MatrixInfoModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.nombre : 'Stakeholder'}
        sections={modalSections}
      />
    </div>
  )
}

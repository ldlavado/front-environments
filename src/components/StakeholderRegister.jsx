import { useCallback, useMemo, useRef, useState } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'
import { MatrixInfoModal } from './MatrixInfoModal'

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
      nombre: 'Cliente / Operaciones',
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
    {
      nombre: 'Proveedor cloud / SRE',
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
      nombre: 'Seguridad y Cumplimiento',
      empresa: 'Cliente',
      puesto: 'CISO / Compliance',
      ubicacion: 'HQ',
      evaluacion: 'Aprobador de cumplimiento',
      rol: 'Gobierno y auditoría',
      contacto: 'seguridad@cliente.com',
      requerimientos: 'Evidencias de auditoría, Zero-Trust y SIEM integrado.',
      expectativas: '0 hallazgos críticos y trazabilidad completa.',
      influencia: 'Alta',
      clasificacion: 'Interno',
      apoyo: 'Neutral',
      fase: 'Pruebas / Operación',
    },
    {
      nombre: 'Equipos OT/IT en sitio',
      empresa: 'Cliente / Operaciones en campo',
      puesto: 'Soporte edge',
      ubicacion: 'Sitios críticos',
      evaluacion: 'Usuario clave / operación',
      rol: 'Usuarios clave / soporte',
      contacto: 'ops-campo@cliente.com',
      requerimientos: 'Capacitación y runbooks claros para conmutación.',
      expectativas: 'Sin interrupción prolongada en campo.',
      influencia: 'Media',
      clasificacion: 'Interno',
      apoyo: 'Apoyo',
      fase: 'Ejecución / Operación',
    },
    {
      nombre: 'Regulador / Auditor',
      empresa: 'MinTIC / Auditor interno',
      puesto: 'Auditoría',
      ubicacion: 'Remoto / oficinas',
      evaluacion: 'Auditor / regulador',
      rol: 'Revisor de cumplimiento',
      contacto: 'auditoria@regulador.gov',
      requerimientos: 'Evidencias de continuidad y seguridad.',
      expectativas: 'Cierre sin hallazgos críticos.',
      influencia: 'Alta',
      clasificacion: 'Externo',
      apoyo: 'Neutral',
      fase: 'Cierres y auditorías',
    },
  ],
}

export default function StakeholderRegister() {
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
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
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

  const stakeholders = useMemo(() => data.stakeholders || [], [data.stakeholders])

  const modalSections = useMemo(() => {
    if (!selected) return []
    return [
      { title: 'Identificación', content: (
        <div>
          <div><strong>Nombre:</strong> {selected.nombre}</div>
          <div><strong>Empresa:</strong> {selected.empresa}</div>
          <div><strong>Puesto:</strong> {selected.puesto}</div>
          <div><strong>Localización:</strong> {selected.ubicacion}</div>
          <div><strong>Rol en el proyecto:</strong> {selected.rol}</div>
          <div><strong>Evaluación:</strong> {selected.evaluacion}</div>
          <div><strong>Contacto:</strong> {selected.contacto}</div>
        </div>
      ) },
      { title: 'Requerimientos y expectativas', content: (
        <div>
          <div><strong>Requerimientos primordiales:</strong> {selected.requerimientos}</div>
          <div><strong>Expectativas principales:</strong> {selected.expectativas}</div>
        </div>
      ) },
      { title: 'Influencia y clasificación', content: (
        <div>
          <div><strong>Influencia potencial:</strong> {selected.influencia}</div>
          <div><strong>Clasificación:</strong> {selected.clasificacion}</div>
          <div><strong>Fase de mayor interés:</strong> {selected.fase}</div>
          <div><strong>Apoyo/Neutral/Opositor:</strong> {selected.apoyo}</div>
        </div>
      ) },
    ]
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

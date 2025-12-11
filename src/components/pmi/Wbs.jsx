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

const TreeNode = ({ node, level = 0 }) => (
  <div style={{ paddingLeft: level === 0 ? 0 : 16, position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      {level > 0 && (
        <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, background: 'var(--border, #2a2f45)', height: '100%' }} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ padding: 10, border: '1px solid var(--border, #2a2f45)', borderRadius: 8, background: 'var(--card-bg, #fff)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontWeight: 700 }}>{node.codigo} — {node.nombre}</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{node.entregable || 'Entregable no definido'}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{node.descripcion}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Responsable: {node.responsable || '—'}</div>
        </div>
        {node.children?.length ? (
          <div style={{ marginTop: 8, borderLeft: '1px dashed var(--border, #2a2f45)', paddingLeft: 12 }}>
            {node.children.map((child) => (
              <div key={child.codigo} style={{ marginBottom: 8 }}>
                <TreeNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  </div>
)

const defaultData = {
  meta: {
    nombre: 'WBS — HA/DR Multi-región (Camino A)',
    siglas: 'HA-DR-A',
  },
  version: { version: '1.0', fecha: '2026-01-15', hechoPor: 'PMO', revisadoPor: 'Comité', aprobadoPor: 'Sponsor', motivo: 'Base' },
  paquetes: [
    { codigo: '1.0', nombre: 'Gestión y documentación de requisitos', descripcion: 'Levantamiento, refinamiento y aprobación de requisitos.', responsable: 'PMO + Cliente/Operaciones', entregable: 'Documentación de Requisitos aprobada', depende: '' },
    { codigo: '2.0', nombre: 'Arquitectura HA/DR multi-región', descripcion: 'Diseño y despliegue de la topología activa-activa.', responsable: 'Arquitectura + Proveedor IoT/Cloud', entregable: 'Topología validada', depende: '1.0' },
    { codigo: '3.0', nombre: 'Implementación de runbooks y automatización', descripcion: 'Runbooks IaC/ops versionados y ejecutables.', responsable: 'SRE + DevOps', entregable: 'Runbooks HA/DR', depende: '2.0' },
    { codigo: '4.0', nombre: 'Observabilidad y SIEM', descripcion: 'Monitoreo sintético, APM y trazabilidad en SIEM.', responsable: 'SRE + Seguridad', entregable: 'Dashboards y alertas', depende: '3.0' },
    { codigo: '5.0', nombre: 'Pruebas HA/DR y aceptación', descripcion: 'Pruebas trimestrales, criterios de aceptación y cierre.', responsable: 'PMO + Cliente/Operaciones', entregable: 'Actas de pruebas y aceptación', depende: '3.0,4.0' },
    { codigo: '6.0', nombre: 'Capacitación y transición', descripcion: 'Formación a equipos de campo y operación continua.', responsable: 'PMO + Cliente/Operaciones', entregable: 'Plan de formación y evidencias', depende: '3.0' },
  ],
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

const buildTree = (list = []) => {
  const sorted = [...list].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
  const map = new Map()
  sorted.forEach((p) => map.set(p.codigo, { ...p, children: [] }))
  const roots = []
  map.forEach((node) => {
    const parts = node.codigo.split('.')
    if (parts.length > 1) {
      const parentCodeRaw = parts.slice(0, parts.length - 1).join('.')
      const candidates = [parentCodeRaw, `${parentCodeRaw}.0`].filter((c) => c && c !== node.codigo)
      const parent = candidates.map((c) => map.get(c)).find(Boolean)
      if (parent) {
        parent.children.push(node)
        return
      }
    }
    roots.push(node)
  })
  const sortChildren = (nodes) => nodes.forEach((n) => { n.children.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true })); sortChildren(n.children) })
  sortChildren(roots)
  return roots
}

export default function Wbs({ stakeholders: externalStakeholders = [] }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('wbs_data')
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
      try { localStorage.setItem('wbs_data', JSON.stringify(json)) } catch { /* ignore */ }
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
      a.download = 'wbs.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('No se pudo exportar: ' + err.message)
    }
  }

  const handleReset = () => {
    setData(defaultData)
    try { localStorage.setItem('wbs_data', JSON.stringify(defaultData)) } catch { /* ignore */ }
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(ref.current, 'wbs.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const requirements = useMemo(() => readRequirementsDoc(), [])

  const paquetes = useMemo(() => {
    const basePaquetes = (data.paquetes && data.paquetes.length ? data.paquetes : defaultData.paquetes) || []
    if (requirements?.requisitos) {
      const auto = buildPackagesFromRequirements(requirements.requisitos)
      const manual = basePaquetes.filter((p) => !p.auto)
      return [...manual, ...auto]
    }
    return basePaquetes
  }, [data.paquetes, requirements])
  const tree = useMemo(() => buildTree(paquetes), [paquetes])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: '12px 0 4px' }}>WBS</h2>
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
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div><strong>Versión:</strong> {data.version?.version}</div>
            <div><strong>Fecha:</strong> {data.version?.fecha}</div>
            <div><strong>Hecha por:</strong> {data.version?.hechoPor}</div>
            <div><strong>Revisada por:</strong> {data.version?.revisadoPor}</div>
            <div><strong>Aprobada por:</strong> {data.version?.aprobadoPor}</div>
            <div><strong>Motivo:</strong> {data.version?.motivo}</div>
          </div>
        </Card>

        <Card title="Estructura WBS (árbol)">
          {tree.length ? (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 12 }}>
              {tree.map((root, idx) => (
                <TreeNode key={root.codigo} node={root} isLast={idx === tree.length - 1} hasSiblingAbove={idx !== 0} />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>Sin paquetes WBS disponibles.</div>
          )}
        </Card>
      </div>
    </div>
  )
}

const th = { textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', whiteSpace: 'nowrap' }
const td = { padding: 8, borderBottom: '1px solid var(--border, #2a2f45)', verticalAlign: 'top' }
const btn = { border: '1px solid var(--border, #2a2f45)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }

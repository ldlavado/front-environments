import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'

// Simple card and section styles reusing CSS variables
const cardStyle = {
  background: 'var(--card-bg, #111)',
}

function Section({ title, children, extra }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {extra}
      </div>
      {children}
    </div>
  )
}

function Pill({ children }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: 'var(--highlight-bg, #222)', border: '1px solid var(--border, #333)', marginRight: 8, marginBottom: 6 }}>
      {children}
    </span>
  )
}

export default function MmlMatrix() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('mml_data')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [dofa, setDofa] = useState(() => {
    try { const raw = localStorage.getItem('dofa_data'); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  const [stakeholders, setStakeholders] = useState(() => {
    try { const raw = localStorage.getItem('stakeholders_edit'); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  const [loading, setLoading] = useState(!data)
  const matrixRef = useRef(null)

  const saveLocal = useCallback((d) => {
    try { localStorage.setItem('mml_data', JSON.stringify(d)) } catch { /* ignore */ }
  }, [])

  const loadDefaults = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/mml.json', { cache: 'no-store' })
      const json = await res.json()
      setData(json)
      saveLocal(json)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [saveLocal])

  const loadDofa = useCallback(async () => {
    try {
      const res = await fetch('/dofa.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      setDofa(json)
      try { localStorage.setItem('dofa_data', JSON.stringify(json)) } catch { /* ignore */ }
    } catch {
      /* ignore */
    }
  }, [])

  const loadStakeholders = useCallback(async () => {
    if (stakeholders) return
    try {
      const res = await fetch('/default-data.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      const list = json?.stakeholders || []
      setStakeholders(list)
      try { localStorage.setItem('stakeholders_edit', JSON.stringify(list)) } catch { /* ignore */ }
    } catch {
      /* ignore */
    }
  }, [stakeholders])

  useEffect(() => {
    if (!data) {
      loadDefaults()
    }
    if (!dofa) {
      loadDofa()
    }
    if (!stakeholders) {
      loadStakeholders()
    }
  }, [data, dofa, stakeholders, loadDefaults, loadDofa, loadStakeholders])

  const onImport = async (evt) => {
    const file = evt.target.files && evt.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setData(json)
      saveLocal(json)
    } catch {
      alert('Archivo inválido')
    } finally {
      evt.target.value = ''
    }
  }

  const onExport = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mml-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetDefaults = async () => {
    try { localStorage.removeItem('mml_data') } catch { /* ignore */ }
    await loadDefaults()
  }

  const handleExportPng = useCallback(async () => {
    try {
      await downloadElementAsPng(matrixRef.current, 'matriz_mml.png')
    } catch (err) {
      alert(err.message)
    }
  }, [])

  const fin = data?.fin
  const proposito = data?.proposito
  const componentes = useMemo(() => data?.componentes || [], [data])
  const actividades = useMemo(() => data?.actividades || [], [data])
  const componentMap = useMemo(() => new Map(componentes.map((c) => [c.id, c])), [componentes])
  const activitiesByComponent = useMemo(() => {
    const map = new Map()
    actividades.forEach((act) => {
      const cid = act.componente
      if (!cid) return
      if (!map.has(cid)) map.set(cid, [])
      map.get(cid).push(act)
    })
    return map
  }, [actividades])
  const soluciones = useMemo(() => data?.soluciones || [], [data])
  const [expandedNodes, setExpandedNodes] = useState(() => new Set())
  const sequenceSteps = useMemo(() => ([
    { id: 'involucrados', label: 'Involucrados', desc: 'Identifica stakeholders/entornos en la pestaña Entornos/Stakeholders.', href: '#environment-impact' },
    { id: 'problemas', label: 'Problemas', desc: 'Analiza DOFA, MEFI, MEFE para mapear brechas y amenazas.', href: '#dofa' },
    { id: 'objetivos', label: 'Objetivos', desc: 'Define FO/FA/DO/DA en MAFE y prioriza en ProjectPortfolio.', href: '#mafe' },
    { id: 'alternativas', label: 'Alternativas', desc: 'Compara caminos de solución en MPC (A/B/C/D).', href: '#mpc' },
    { id: 'marco', label: 'Marco Lógico', desc: 'Estructura Fin, Propósito, Componentes y Actividades en MML.', href: '#mml' },
  ]), [])

  useEffect(() => {
    const defaults = new Set()
    componentes.forEach((c, idx) => defaults.add(`COMP:${c.id || idx}`))
    soluciones.forEach((sol, sidx) => {
      defaults.add(`SOL:${sol.id || sidx}`)
      ;(sol.componentes || []).forEach((comp, cidx) => defaults.add(`SOLC:${sol.id || sidx}:${comp.id || cidx}`))
    })
    setExpandedNodes(defaults)
  }, [componentes, soluciones])

  const expandedSet = useMemo(() => new Set(expandedNodes), [expandedNodes])
  const toggleNode = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const componentIndicatorsCount = useMemo(() => componentes.reduce((acc, c) => acc + (c.indicadores?.length || 0), 0), [componentes])

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

  const renderPortafolioLinks = (items) => {
    if (!items?.length) return null
    return (
      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
        <strong>Portafolio ProjectPortfolio:</strong>{' '}
        {items.map((id) => <Pill key={id}>{id}</Pill>)}
      </div>
    )
  }

  const renderProgramas = (programas) => {
    if (!programas?.length) return null
    return (
      <div style={{ marginTop: 4, fontSize: 13, opacity: 0.9 }}>
        <strong>Programas asociados:</strong>{' '}
        {programas.map((p) => <Pill key={p}>{p}</Pill>)}
      </div>
    )
  }

  const dofaCoverage = useMemo(() => {
    const amenazas = Array.isArray(dofa?.amenazas) ? dofa.amenazas : []
    const fort = Array.isArray(dofa?.fortalezas) ? dofa.fortalezas : []
    const deb = Array.isArray(dofa?.debilidades) ? dofa.debilidades : []
    const opo = Array.isArray(dofa?.oportunidades) ? dofa.oportunidades : []
    const mapDofa = new Map([...fort, ...deb, ...opo, ...amenazas].map((f) => [f.id, f.texto || f.nombre]))
    const coveredAmenazas = new Set()
    const coveredDebilidades = new Set()
    componentes.forEach((c) => {
      (c.mafe || []).forEach((id) => {
        if (mapDofa.has(id)) {
          if (id.startsWith('FE-AM') || id.startsWith('AM')) coveredAmenazas.add(id)
          if (id.startsWith('FI-0') || id.startsWith('FI-')) coveredDebilidades.add(id)
        }
      })
    })
    const amagaps = amenazas.filter((a) => !coveredAmenazas.has(a.id))
    const debgaps = deb.filter((d) => !coveredDebilidades.has(d.id))
    return { mapDofa, amagaps, debgaps, amenazas, debilidades: deb }
  }, [dofa, componentes])

  const stakeholdersRows = useMemo(() => {
    const list = Array.isArray(stakeholders) ? stakeholders : []
    return list.slice(0, 10).map((s, idx) => {
      const vars = s.variables ? Object.keys(s.variables) : []
      const topVar = vars[0] || 'N/A'
      const topImpact = vars.length ? s.variables[topVar]?.impacto_pct || {} : {}
      const problemas = Object.entries(topImpact).sort((a, b) => (b[1] || 0) - (a[1] || 0)).slice(0, 2).map(([k]) => k).join(', ') || 'N/A'
      const conflictDims = Object.entries(topImpact)
        .filter(([, v]) => (v || 0) >= 6)
        .map(([k]) => k)
      const conflictos = conflictDims.length ? `Riesgo en ${conflictDims.join(', ')}` : 'Bajo'
      return {
        grupo: s.stakeholder || `Grupo ${idx + 1}`,
        intereses: topVar,
        problemasPercibidos: problemas,
        recursos: s.total_pct ? `Influencia ${s.total_pct}%` : '—',
        interesProyecto: s.total_pct ? (s.total_pct >= 10 ? 'Alto' : 'Medio') : '—',
        conflictos,
      }
    })
  }, [stakeholders])

  if (loading) return <div>Cargando MML...</div>
  if (!data) return <div>No hay datos de MML</div>

  return (
    <div ref={matrixRef}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }} data-export-ignore="true">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="file" accept="application/json" onChange={onImport} style={{ display: 'none' }} />
          <span role="button" tabIndex={0} onClick={(e) => e.currentTarget.previousSibling.click()} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.previousSibling.click() }} style={{ padding: '6px 10px', border: '1px solid var(--border, #333)', borderRadius: 6, cursor: 'pointer' }}>Importar JSON</span>
        </label>
        <button onClick={onExport}>Exportar JSON</button>
        <button onClick={handleExportPng}>Guardar PNG</button>
        <button onClick={resetDefaults}>Restablecer por defecto</button>
      </div>

      <Section
        title="Secuencia de planificación"
        extra={<Pill>{sequenceSteps.length} pasos</Pill>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {sequenceSteps.map((step, idx) => (
            <div key={step.id} className="tree-node tree-node--project" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontWeight: 700 }}>Paso {idx + 1}: {step.label}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{step.desc}</div>
              {step.href ? (
                <button
                  onClick={() => { window.location.hash = step.href.replace('#', '') }}
                  style={{ alignSelf: 'flex-start', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border, #2a2f45)', background: 'rgba(59,130,246,0.12)', cursor: 'pointer' }}
                >
                  Ir a {step.label}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      <div style={{ marginBottom: 10, opacity: 0.8 }}>
        {data?.descripcion}
        {data?.fuente ? <div style={{ fontSize: 13, marginTop: 4 }}>Fuente: {data.fuente}</div> : null}
      </div>

      <Section title="Cuadro de involucrados" extra={<Pill>{stakeholdersRows.length || 0} grupos</Pill>}>
        {stakeholdersRows.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.75 }}>Sin datos de stakeholders; carga datos en la pestaña Entornos/Stakeholders.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Grupos', 'Intereses', 'Problemas percibidos', 'Recursos y mandato', 'Interés en un proyecto', 'Conflictos potenciales'].map((h) => (
                    <th key={h} style={{ borderBottom: '1px solid var(--border, #2a2f45)', padding: '8px 6px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stakeholdersRows.map((row) => (
                  <tr key={row.grupo}>
                    <td style={{ borderBottom: '1px solid var(--border, #2a2f45)', padding: '8px 6px' }}>{row.grupo}</td>
                    <td style={{ borderBottom: '1px solid var(--border, #2a2f45)', padding: '8px 6px' }}>{row.intereses}</td>
                    <td style={{ borderBottom: '1px solid var(--border, #2a2f45)', padding: '8px 6px' }}>{row.problemasPercibidos}</td>
                    <td style={{ borderBottom: '1px solid var(--border, #2a2f45)', padding: '8px 6px' }}>{row.recursos}</td>
                    <td style={{ borderBottom: '1px solid var(--border, #2a2f45)', padding: '8px 6px' }}>{row.interesProyecto}</td>
                    <td style={{ borderBottom: '1px solid var(--border, #2a2f45)', padding: '8px 6px' }}>{row.conflictos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Cobertura DOFA → MAFE → MML">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="tree-node tree-node--project" style={{ flex: '1 1 240px', minWidth: 240 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Amenazas cubiertas</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{(dofaCoverage.amenazas || []).length} totales · {(dofaCoverage.amenazas || []).length - (dofaCoverage.amagaps || []).length} con enlace MAFE/MML</div>
            {dofaCoverage.amagaps?.length ? (
              <div style={{ marginTop: 8, color: '#ef4444', fontWeight: 600 }}>Amenazas sin enlace: {dofaCoverage.amagaps.map((a) => a.id).join(', ')}</div>
            ) : <div style={{ marginTop: 8, color: '#16a34a', fontWeight: 600 }}>Todas las amenazas están cubiertas</div>}
          </div>
          <div className="tree-node tree-node--project" style={{ flex: '1 1 240px', minWidth: 240 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Debilidades cubiertas</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{(dofaCoverage.debilidades || []).length} totales · {(dofaCoverage.debilidades || []).length - (dofaCoverage.debgaps || []).length} con enlace MAFE/MML</div>
            {dofaCoverage.debgaps?.length ? (
              <div style={{ marginTop: 8, color: '#ef4444', fontWeight: 600 }}>Debilidades sin enlace: {dofaCoverage.debgaps.map((a) => a.id).join(', ')}</div>
            ) : <div style={{ marginTop: 8, color: '#16a34a', fontWeight: 600 }}>Todas las debilidades están cubiertas</div>}
          </div>
          <div className="tree-node tree-node--project" style={{ flex: '2 1 360px', minWidth: 300 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Referencia rápida</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Etiqueta los componentes con <code>entornos</code> y <code>mafe</code> para rastrear la trazabilidad DOFA → MAFE → MML → Alternativas (MPC).</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Tip: Si cambian IDs en MAFE/portafolio, sincroniza estos campos para mantener la cobertura al 100%.</div>
          </div>
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <Section title="Fin" extra={<Pill>{(fin?.indicadores?.length || 0)} ind.</Pill>}>
          <p style={{ marginTop: 0 }}>{fin?.enunciado}</p>
          {renderIndicators(fin?.indicadores)}
          {renderPills(fin?.supuestos, 'Supuestos')}
        </Section>

        <Section title="Propósito" extra={<Pill>{(proposito?.indicadores?.length || 0)} ind.</Pill>}>
          <p style={{ marginTop: 0 }}>{proposito?.enunciado}</p>
          {renderIndicators(proposito?.indicadores)}
          {renderPills(proposito?.supuestos, 'Supuestos')}
        </Section>

        <Section title="Resultados / Componentes" extra={<Pill>{componentes.length} comp. · {componentIndicatorsCount} ind.</Pill>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            {componentes.map((c) => (
              <div key={c.id} style={{ ...cardStyle, border: '1px dashed var(--border, #333)', borderRadius: 8, padding: 12 }}>
                <div style={{ marginBottom: 6 }}>
                  <Pill>{c.id}</Pill>
                  <strong>{c.resultado}</strong>
                </div>
                {c.indicadores?.length ? (
                  <div style={{ marginLeft: 8 }}>
                    {renderIndicators(c.indicadores)}
                  </div>
                ) : null}
                {renderPills(c.entornos, 'Entornos')}
                {renderPills(c.mafe, 'MAFE')}
                {renderPills(c.supuestos, 'Supuestos')}
                {renderProgramas(c.programas)}
                {renderPortafolioLinks(c.vinculos_portafolio)}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Actividades" extra={<Pill>{actividades.length} act.</Pill>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            {actividades.map((a) => (
              <div key={a.id} style={{ ...cardStyle, border: '1px dashed var(--border, #333)', borderRadius: 8, padding: 12 }}>
                <div style={{ marginBottom: 6 }}>
                  <Pill>{a.id}</Pill>
                  <strong>{a.descripcion}</strong>
                </div>
                {a.componente ? (
                  <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.9 }}>
                    <strong>Componente:</strong> <Pill>{a.componente}</Pill>
                    <span>{componentMap.get(a.componente)?.resultado || ''}</span>
                  </div>
                ) : null}
                {a.insumos?.length ? (
                  <div style={{ marginTop: 4 }}>
                    <strong>Insumos:</strong>{' '}
                    {a.insumos.map((s, idx) => <Pill key={idx}>{s}</Pill>)}
                  </div>
                ) : null}
                {renderPills(a.supuestos, 'Supuestos')}
                {renderPills(a.medios_verificacion, 'Medios de verificación')}
                {renderPortafolioLinks(a.vinculos_portafolio)}
              </div>
            ))}
          </div>
        </Section>

        {Array.isArray(data?.supuestos_globales) && data.supuestos_globales.length ? (
          <Section title="Supuestos globales">
            {renderPills(data.supuestos_globales)}
          </Section>
        ) : null}

        {soluciones.length ? (
          <Section title="Árboles de soluciones alternativas">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {soluciones.map((sol) => (
                <div key={sol.id} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700 }}>{sol.nombre}</div>
                    <button onClick={() => toggleNode(`SOL:${sol.id || 0}`)} style={{ background: 'transparent', border: '1px solid var(--border, #2a2f45)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>
                      {expandedSet.has(`SOL:${sol.id || 0}`) ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  {expandedSet.has(`SOL:${sol.id || 0}`) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ padding: '8px 12px', background: '#1fc4e4', borderRadius: 6, color: '#0b1933', fontWeight: 700, textAlign: 'center' }}>
                        Fin
                        {sol.fin ? <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{sol.fin}</div> : null}
                      </div>
                      <div style={{ width: 2, height: 12, background: 'var(--border, #2a2f45)' }} />
                      <div style={{ padding: '8px 12px', background: '#1fc4e4', borderRadius: 6, color: '#0b1933', fontWeight: 700, textAlign: 'center' }}>
                        Propósito
                        {sol.proposito ? <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{sol.proposito}</div> : null}
                      </div>
                      <div style={{ width: '90%', borderBottom: '2px solid var(--border, #2a2f45)', marginTop: 6, marginBottom: 6 }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, width: '100%' }}>
                        {(sol.componentes || []).map((comp, cidx) => (
                          <div key={comp.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 2, height: 12, background: 'var(--border, #2a2f45)' }} />
                            <div style={{ padding: '8px 10px', background: '#1fc4e4', borderRadius: 6, color: '#0b1933', fontWeight: 700, textAlign: 'center', width: '100%', position: 'relative' }}>
                              <button onClick={() => toggleNode(`SOLC:${sol.id || 0}:${comp.id || cidx}`)} style={{ position: 'absolute', left: 8, top: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#0b1933', fontWeight: 700 }}>
                                {expandedSet.has(`SOLC:${sol.id || 0}:${comp.id || cidx}`) ? '−' : '+'}
                              </button>
                              {comp.id ? `${comp.id} · ` : ''}Componente
                              {comp.titulo ? <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{comp.titulo}</div> : null}
                            </div>
                            {expandedSet.has(`SOLC:${sol.id || 0}:${comp.id || cidx}`) ? (
                              <>
                                <div style={{ width: 2, height: 12, background: 'var(--border, #2a2f45)' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6, width: '100%' }}>
                                  {(comp.actividades || []).map((act, idx) => (
                                    <div key={`${comp.id}-act-${idx}`} style={{ padding: '6px 8px', background: '#1fc4e4', borderRadius: 6, color: '#0b1933', fontWeight: 600, textAlign: 'center' }}>
                                      {act}
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        <Section title="Jerarquía de objetivos (árbol)">
          <div className="program-tree-card" style={{ background: 'rgba(15,23,42,0.12)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="tree-node tree-node--program" style={{ maxWidth: 640, justifyContent: 'center', background: 'rgba(22,193,227,0.18)', borderColor: 'rgba(22,193,227,0.45)', color: '#0b1933' }}>
                <div style={{ fontWeight: 700 }}>Fin</div>
                {fin?.enunciado ? <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{fin.enunciado}</div> : null}
              </div>
              <svg className="tree-connectors" viewBox="0 0 100 36" preserveAspectRatio="none">
                <line x1="50" y1="0" x2="50" y2="36" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="tree-node tree-node--program" style={{ maxWidth: 640, justifyContent: 'center', background: 'rgba(22,193,227,0.18)', borderColor: 'rgba(22,193,227,0.45)', color: '#0b1933' }}>
                <div style={{ fontWeight: 700 }}>Propósito</div>
                {proposito?.enunciado ? <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{proposito.enunciado}</div> : null}
              </div>
            </div>

            {componentes.length ? (
              <>
                <svg className="tree-connectors" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <line x1="50" y1="0" x2="50" y2="20" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                  {componentes.map((_, idx) => {
                    const position = (idx + 1) / (componentes.length + 1)
                    const x = Math.min(96, Math.max(4, position * 100))
                    return (
                      <path key={`comp-conn-${idx}`} d={`M50 20 L${x} 40`} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                    )
                  })}
                </svg>
                <div className="tree-projects" style={{ gap: 14, justifyContent: 'center' }}>
                  {componentes.map((c, idx) => {
                    const acts = activitiesByComponent.get(c.id) || [{ id: `${c.id}-placeholder`, descripcion: 'Actividades' }]
                    const compKey = `COMP:${c.id || idx}`
                    const open = expandedSet.has(compKey)
                    return (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 200 }}>
                        <div className="tree-node tree-node--program" style={{ width: '100%', background: 'rgba(22,193,227,0.2)', borderColor: 'rgba(22,193,227,0.4)', color: '#0b1933', position: 'relative', justifyContent: 'center' }}>
                          <button onClick={() => toggleNode(compKey)} style={{ position: 'absolute', left: 10, top: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#0b1933', fontWeight: 700 }}>
                            {open ? '−' : '+'}
                          </button>
                          <div style={{ fontWeight: 700 }}>{c.id ? `${c.id} · ` : ''}Componente</div>
                          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{c.resultado}</div>
                        </div>
                        {open && (
                          <>
                            <svg className="tree-connectors" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <line x1="50" y1="0" x2="50" y2="20" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                              {acts.map((_, aidx) => {
                                const position = (aidx + 1) / (acts.length + 1)
                                const x = Math.min(96, Math.max(4, position * 100))
                                return (
                                  <path key={`${c.id}-a-${aidx}`} d={`M50 20 L${x} 40`} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                                )
                              })}
                            </svg>
                            <div className="tree-projects" style={{ gap: 10, justifyContent: 'center' }}>
                              {acts.map((act) => (
                                <div key={act.id} className="tree-node tree-node--project" style={{ background: 'rgba(22,193,227,0.16)', borderColor: 'rgba(22,193,227,0.4)', color: '#0b1933', minWidth: 180 }}>
                                  <div className="tree-node__title">{act.id ? act.id : 'Actividad'}</div>
                                  <div className="tree-node__meta" style={{ opacity: 0.9 }}>{act.descripcion || 'Actividades'}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : null}
          </div>
        </Section>
      </div>
    </div>
  )
}

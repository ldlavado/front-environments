import React, { useCallback, useEffect, useMemo, useState } from 'react'

function Pill({ children }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: 'var(--highlight-bg, #222)', border: '1px solid var(--border, #333)', marginRight: 8, marginBottom: 6 }}>
      {children}
    </span>
  )
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

export default function Trees() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('mml_data')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [expanded, setExpanded] = useState(() => new Set())
  const componentes = useMemo(() => data?.componentes || [], [data])
  const actividades = useMemo(() => data?.actividades || [], [data])
  const soluciones = useMemo(() => data?.soluciones || [], [data])
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
  const expandedSet = useMemo(() => new Set(expanded), [expanded])

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const loadDefaults = useCallback(async () => {
    try {
      const res = await fetch('/mml.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      setData(json)
      try { localStorage.setItem('mml_data', JSON.stringify(json)) } catch { /* ignore */ }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!data) loadDefaults()
  }, [data, loadDefaults])

  useEffect(() => {
    const defaults = new Set()
    componentes.forEach((c, idx) => defaults.add(`COMP:${c.id || idx}`))
    soluciones.forEach((sol, sidx) => {
      defaults.add(`SOL:${sol.id || sidx}`)
      ;(sol.componentes || []).forEach((comp, cidx) => defaults.add(`SOLC:${sol.id || sidx}:${comp.id || cidx}`))
    })
    setExpanded(defaults)
  }, [componentes, soluciones])

  if (!data) return <div>Cargando árboles...</div>

  return (
    <div style={{ padding: 16 }}>
      <Section title="Árboles de soluciones alternativas" extra={<Pill>{soluciones.length} soluciones</Pill>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {soluciones.map((sol) => (
            <div key={sol.id} style={{ border: '1px solid var(--border, #2a2f45)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{sol.nombre}</div>
                <button onClick={() => toggle(`SOL:${sol.id || 0}`)} style={{ background: 'transparent', border: '1px solid var(--border, #2a2f45)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>
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
                          <button onClick={() => toggle(`SOLC:${sol.id || 0}:${comp.id || cidx}`)} style={{ position: 'absolute', left: 8, top: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#0b1933', fontWeight: 700 }}>
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

      <Section title="Jerarquía de objetivos (árbol)" extra={<Pill>{componentes.length} comp.</Pill>}>
        <div className="program-tree-card" style={{ background: 'rgba(15,23,42,0.12)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="tree-node tree-node--program" style={{ maxWidth: 640, justifyContent: 'center', background: 'rgba(22,193,227,0.18)', borderColor: 'rgba(22,193,227,0.45)', color: '#0b1933' }}>
              <div style={{ fontWeight: 700 }}>Fin</div>
              {data?.fin?.enunciado ? <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{data.fin.enunciado}</div> : null}
            </div>
            <svg className="tree-connectors" viewBox="0 0 100 36" preserveAspectRatio="none">
              <line x1="50" y1="0" x2="50" y2="36" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="tree-node tree-node--program" style={{ maxWidth: 640, justifyContent: 'center', background: 'rgba(22,193,227,0.18)', borderColor: 'rgba(22,193,227,0.45)', color: '#0b1933' }}>
              <div style={{ fontWeight: 700 }}>Propósito</div>
              {data?.proposito?.enunciado ? <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{data.proposito.enunciado}</div> : null}
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
                        <button onClick={() => toggle(compKey)} style={{ position: 'absolute', left: 10, top: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#0b1933', fontWeight: 700 }}>
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
  )
}

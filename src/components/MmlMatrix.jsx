import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { downloadElementAsPng } from '../utils/downloadElementAsPng'

// Simple card and section styles reusing CSS variables
const cardStyle = {
  background: 'var(--card-bg, #111)'
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

  useEffect(() => {
    if (!data) {
      loadDefaults()
    }
  }, [data, loadDefaults])

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

  const componentIndicatorsCount = useMemo(() => componentes.reduce((acc, c) => acc + (c.indicadores?.length || 0), 0), [componentes])

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <Section title="Fin" extra={<Pill>{(fin?.indicadores?.length || 0)} ind.</Pill>}>
          <p style={{ marginTop: 0 }}>{fin?.enunciado}</p>
          <div style={{ marginBottom: 6 }}>
            {fin?.indicadores?.map((i) => (
              <div key={i.id} style={{ marginBottom: 6 }}>
                <Pill>{i.id}</Pill>
                <strong>{i.nombre}</strong> — Meta: <em>{i.meta}</em> — MV: <span style={{ opacity: 0.85 }}>{i.medio_verificacion}</span>
              </div>
            ))}
          </div>
          {fin?.supuestos?.length ? (
            <div>
              <strong>Supuestos:</strong>{' '}
              {fin.supuestos.map((s, idx) => <Pill key={idx}>{s}</Pill>)}
            </div>
          ) : null}
        </Section>

        <Section title="Propósito" extra={<Pill>{(proposito?.indicadores?.length || 0)} ind.</Pill>}>
          <p style={{ marginTop: 0 }}>{proposito?.enunciado}</p>
          <div style={{ marginBottom: 6 }}>
            {proposito?.indicadores?.map((i) => (
              <div key={i.id} style={{ marginBottom: 6 }}>
                <Pill>{i.id}</Pill>
                <strong>{i.nombre}</strong> — Meta: <em>{i.meta}</em> — MV: <span style={{ opacity: 0.85 }}>{i.medio_verificacion}</span>
              </div>
            ))}
          </div>
          {proposito?.supuestos?.length ? (
            <div>
              <strong>Supuestos:</strong>{' '}
              {proposito.supuestos.map((s, idx) => <Pill key={idx}>{s}</Pill>)}
            </div>
          ) : null}
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
                    {c.indicadores.map((i) => (
                      <div key={i.id} style={{ marginBottom: 6 }}>
                        <Pill>{i.id}</Pill>
                        <span>{i.nombre}</span>{' '}— Meta: <em>{i.meta}</em> — MV: <span style={{ opacity: 0.85 }}>{i.medio_verificacion}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {c.supuestos?.length ? (
                  <div style={{ marginTop: 6 }}>
                    <strong>Supuestos:</strong>{' '}
                    {c.supuestos.map((s, idx) => <Pill key={idx}>{s}</Pill>)}
                  </div>
                ) : null}
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
                {a.insumos?.length ? (
                  <div style={{ marginTop: 4 }}>
                    <strong>Insumos:</strong>{' '}
                    {a.insumos.map((s, idx) => <Pill key={idx}>{s}</Pill>)}
                  </div>
                ) : null}
                {a.supuestos?.length ? (
                  <div style={{ marginTop: 4 }}>
                    <strong>Supuestos:</strong>{' '}
                    {a.supuestos.map((s, idx) => <Pill key={idx}>{s}</Pill>)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

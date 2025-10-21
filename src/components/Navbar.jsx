import React, { useMemo, useRef, useState, useEffect } from 'react'

export default function Navbar({ groups, current, onNavigate, onRestore }) {
  const btnRefs = useRef({})
  const [openIdx, setOpenIdx] = useState(null)
  const flatIdxByKey = useMemo(() => {
    const map = new Map()
    groups.forEach((g, gi) => g.items.forEach((it, ii) => map.set(it.key, { gi, ii })))
    return map
  }, [groups])

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setOpenIdx(null) }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  // Theme-aware styles with CSS variables
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#0f172a'
  const fg = getComputedStyle(document.documentElement).getPropertyValue('--card-fg') || '#e2e8f0'
  const border = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'
  const highlight = getComputedStyle(document.documentElement).getPropertyValue('--highlight-bg') || 'rgba(255,255,255,0.08)'
  const activeBg = '#38bdf8'
  const activeFg = '#0f172a'

  return (
    <>
      <nav aria-label="Navegación principal" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        width: '100%',
        background: bg, color: fg,
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        borderBottom: `1px solid ${border}`
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 12,
          height: 56, padding: '0 16px', boxSizing: 'border-box'
        }}>
          <div style={{ fontWeight: 700, marginRight: 8 }}>MGIP</div>

          {/* Multiple dropdown groups */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {groups.map((group, gi) => (
              <div key={group.label} style={{ position: 'relative' }}>
                <button
                  aria-haspopup="menu"
                  aria-expanded={openIdx === gi}
                  onClick={() => setOpenIdx((o) => (o === gi ? null : gi))}
                  onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpenIdx(gi) } }}
                  style={{
                    border: `1px solid ${border}`,
                    background: openIdx === gi ? highlight : 'transparent',
                    color: fg,
                    padding: '8px 10px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {group.label} ▾
                </button>
                {openIdx === gi && (
                  <ul
                    role="menu"
                    aria-label={group.label}
                    style={{
                      position: 'absolute', top: '110%', left: 0, minWidth: 260,
                      background: bg, color: fg, border: `1px solid ${border}`,
                      listStyle: 'none', padding: 6, margin: 0, borderRadius: 8,
                      boxShadow: '0 10px 24px rgba(0,0,0,0.25)'
                    }}
                  >
                    <li role="none" style={{ padding: 6, borderBottom: `1px solid ${border}`, marginBottom: 6, opacity: 0.85 }}>{group.label}</li>
                    {group.items.map((it) => {
                      const active = it.key === current
                      return (
                        <li key={it.key} role="none">
                          <button
                            ref={(el) => { const idx = flatIdxByKey.get(it.key); if (idx) { btnRefs.current[`${idx.gi}-${idx.ii}`] = el } }}
                            onClick={() => { onNavigate(it.key); setOpenIdx(null) }}
                            role="menuitem"
                            aria-current={active ? 'page' : undefined}
                            type="button"
                            title={it.title}
                            style={{
                              width: '100%', textAlign: 'left',
                              border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
                              color: active ? activeFg : fg,
                              background: active ? activeBg : 'transparent',
                              fontWeight: active ? 700 : 500,
                            }}
                          >
                            {it.title}
                          </button>
                        </li>
                      )
                    })}
                    {onRestore && group.label === 'Entornos' && (
                      <li role="none" style={{ marginTop: 6 }}>
                        <button
                          onClick={() => { onRestore(); setOpenIdx(null) }}
                          role="menuitem"
                          type="button"
                          style={{
                            width: '100%', textAlign: 'left',
                            border: `1px solid ${border}`, cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
                            color: fg,
                            background: 'transparent',
                            fontWeight: 600,
                          }}
                          title="Restaurar datos por defecto"
                        >
                          Restaurar datos por defecto
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content being hidden behind fixed navbar */}
      <div style={{ height: 56 }} />
    </>
  )
}

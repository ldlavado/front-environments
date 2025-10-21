import React, { useMemo, useRef } from 'react'

export default function Navbar({ items, current, onNavigate }) {
  const btnRefs = useRef([])
  const idxByKey = useMemo(() => {
    const map = new Map()
    items.forEach((it, i) => map.set(it.key, i))
    return map
  }, [items])

  const onKeyDown = (e) => {
    const curIdx = idxByKey.get(current) ?? 0
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIdx = (curIdx + 1) % items.length
      onNavigate(items[nextIdx].key)
      btnRefs.current[nextIdx]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIdx = (curIdx - 1 + items.length) % items.length
      onNavigate(items[prevIdx].key)
      btnRefs.current[prevIdx]?.focus()
    }
  }
  return (
    <nav aria-label="Navegación principal" style={{
      position: 'sticky', top: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', background: '#0f172a', color: '#e2e8f0',
      borderRadius: 8, marginBottom: 16,
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 700, marginRight: 16 }}>MGIP</div>
      <ul role="menubar" onKeyDown={onKeyDown} style={{ listStyle: 'none', display: 'flex', gap: 6, padding: 0, margin: 0, flexWrap: 'wrap' }}>
        {items.map((it) => {
          const active = it.key === current
          return (
            <li key={it.key} role="none">
              <button
                ref={(el) => { btnRefs.current[idxByKey.get(it.key)] = el }}
                onClick={() => onNavigate(it.key)}
                style={{
                  border: 'none', cursor: 'pointer',
                  padding: '8px 10px', borderRadius: 6,
                  color: active ? '#0f172a' : '#e2e8f0',
                  background: active ? '#38bdf8' : 'transparent',
                  fontWeight: active ? 700 : 500,
                  outline: active ? '2px solid #94a3b8' : 'none',
                }}
                role="menuitem"
                aria-current={active ? 'page' : undefined}
                type="button"
                title={it.title}
              >
                {it.title}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

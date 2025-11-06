import React, { useEffect } from 'react'

export function MatrixInfoModal({ open, onClose, title, sections }) {
  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#0f172a',
          color: 'inherit',
          maxWidth: 520,
          width: '100%',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 18px 42px rgba(15,23,42,0.45)',
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#253050'}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'inherit',
              fontSize: 18,
              cursor: 'pointer',
            }}
            aria-label="Cerrar guía"
          >
            ×
          </button>
        </div>
        <div style={{ marginTop: 16, maxHeight: '70vh', overflowY: 'auto' }}>
          {(sections || []).map((section) => (
            <section key={section.title} style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>{section.title}</h4>
              <div style={{ opacity: 0.9, fontSize: 14, lineHeight: 1.5 }}>
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InfoTrigger({ onClick, label = 'Ver guía', icon = 'i', style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`,
        padding: '4px 10px',
        cursor: 'pointer',
        background: 'transparent',
        color: 'inherit',
        fontSize: 13,
        ...(style || {}),
      }}
      type="button"
    >
      <span
        style={{
          display: 'inline-flex',
          width: 16,
          height: 16,
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 12,
          background: getComputedStyle(document.documentElement).getPropertyValue('--highlight-bg') || 'rgba(255,255,255,0.12)',
        }}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}

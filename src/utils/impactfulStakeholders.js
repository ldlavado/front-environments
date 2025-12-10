const DEFAULT_ACTORS = [
  'Cliente/Operaciones',
  'Finanzas/Sponsors',
  'Proveedor IoT/Cloud',
  'Seguridad/Compliance',
  'Equipos OT/IT en sitio',
  'MinTIC',
  'MinTIC/Regulador',
  'Auditor interno',
]

const normalize = (name) => (name || '').toString().trim().toLowerCase()

const collectActorsFromMml = () => {
  if (typeof window === 'undefined') return DEFAULT_ACTORS
  try {
    const raw = window.localStorage.getItem('mml2_data')
    if (!raw) return DEFAULT_ACTORS
    const parsed = JSON.parse(raw)
    const actors = []
    ;(parsed?.stakeholders || []).forEach((s) => {
      if (Array.isArray(s.actores)) {
        s.actores.forEach((a) => { if (a && a.trim()) actors.push(a.trim()) })
      } else if (typeof s.actores === 'string') {
        s.actores.split(',').forEach((a) => { if (a && a.trim()) actors.push(a.trim()) })
      }
    })
    const merged = [...DEFAULT_ACTORS, ...actors]
    return merged.length ? merged : DEFAULT_ACTORS
  } catch {
    return DEFAULT_ACTORS
  }
}

export const filterImpactfulStakeholders = (stakeholders = []) => {
  const actors = collectActorsFromMml()
  const actorSet = new Set(actors.map(normalize).filter(Boolean))
  if (!actorSet.size) return stakeholders

  const filtered = stakeholders.filter((s) => actorSet.has(normalize(s.stakeholder || s.nombre)))
  return filtered.length ? filtered : stakeholders
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InfoTrigger, MatrixInfoModal } from './MatrixInfoModal'

const PROGRAM_RULES = [
  { id: 'digital', label: 'Transformación digital & datos', keywords: ['dato', 'data', 'cloud', 'iot', 'interoperabilidad', 'analítica', 'sensores', 'automat', 'devops', 'ia'] },
  { id: 'cambio', label: 'Gestión del cambio y cultura', keywords: ['cambio', 'cultura', 'talento', 'person', 'capacita', 'adopción', 'formación', 'usuarios'] },
  { id: 'sostenibilidad', label: 'Eficiencia energética y sostenibilidad', keywords: ['energ', 'carbon', 'huella', 'ambient', 'sosten', 'circular', 'raee'] },
  { id: 'cumplimiento', label: 'Cumplimiento, riesgo y seguridad', keywords: ['segur', 'cumpl', 'normativ', 'legal', 'riesgo', 'privacidad', 'hse', 'continuidad'] },
  { id: 'operaciones', label: 'Excelencia operativa y O&M', keywords: ['operación', 'operativo', 'mantenimiento', 'o&m', 'sla', 'soporte', 'integración', 'bms', 'erp'] },
  { id: 'innovacion', label: 'Innovación y alianzas', keywords: [] },
]

const PROGRAM_SUGGESTIONS = {
  digital: ['Disponibilidad de datos interoperables', 'Latencia de analítica en minutos', 'Cobertura IoT integrada'],
  cambio: ['Nivel de adopción usuario final', 'Horas de capacitación completadas', 'Índice de satisfacción del cambio'],
  sostenibilidad: ['kWh ahorrados / m²', 'Ton CO₂ evitadas', 'Equipos tratados bajo RAEE'],
  cumplimiento: ['Cierres de auditoría sin hallazgos', 'Incidentes de seguridad reportados', 'Actualizaciones normativas atendidas'],
  operaciones: ['MTBF / MTTR digital', 'Disponibilidad de sistemas críticos', 'Tiempo de integración con ERP/BMS'],
  innovacion: ['Pilotos escalados', 'Fondos externos captados', 'Nuevas alianzas activas'],
}

const TYPE_META = {
  FO: { verb: 'Escalar', effort: 'Media', horizon: '0-6 meses' },
  FA: { verb: 'Blindar', effort: 'Media', horizon: '6-9 meses' },
  DO: { verb: 'Transformar', effort: 'Alta', horizon: '9-12 meses' },
  DA: { verb: 'Mitigar', effort: 'Alta', horizon: '12-18 meses' },
}

const PRIORITY_LEVELS = [
  { label: 'Alta', threshold: 0.66 },
  { label: 'Media', threshold: 0.33 },
  { label: 'Baja', threshold: 0 },
]

const IMPACT_LEVELS = [
  { label: 'Muy alto', threshold: 0.75 },
  { label: 'Alto', threshold: 0.5 },
  { label: 'Medio', threshold: 0.3 },
  { label: 'Controlado', threshold: 0 },
]

const getLocalJson = (key) => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

const readVersionedLocal = (key, version) => {
  const saved = getLocalJson(key)
  if (!saved) return null
  if (version && saved.version && saved.version !== version) return null
  return saved
}

const BASE_URL = (import.meta?.env?.BASE_URL) || '/'
const MAFE_EXPECTED_VERSION = '2024-10-05'

const resolveAssetPath = (path) => {
  if (!path) return path
  if (/^https?:/i.test(path)) return path
  if (BASE_URL === '/' || BASE_URL === '') return path
  const clean = path.replace(/^\//, '')
  return `${BASE_URL}${clean}`
}

const fetchMatrix = async (path) => {
  try {
    const target = resolveAssetPath(path)
    const res = await fetch(target, { cache: 'no-store' })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.json()
  } catch {
    return null
  }
}

const assignProgram = (text) => {
  const base = (text || '').toLowerCase()
  const rule = PROGRAM_RULES.find((r) => r.keywords.some((kw) => base.includes(kw)))
  return rule || PROGRAM_RULES.find((r) => r.id === 'innovacion')
}

const normalizeProgram = (codeOrRule) => {
  if (!codeOrRule) return null
  if (typeof codeOrRule === 'string') {
    return PROGRAM_RULES.find((r) => r.id === codeOrRule) || { id: codeOrRule, label: codeOrRule }
  }
  if (codeOrRule && typeof codeOrRule === 'object' && codeOrRule.id) return codeOrRule
  return null
}

const cleanLabel = (txt = '') => txt.replace(/["“”]/g, '').split(/[\.,;]/)[0].trim()

const formatScore = (num) => (Number.isFinite(num) ? Number(num).toFixed(2) : '0.00')

const computeCriteriaScore = (criteria) => {
  if (!criteria) return null
  let values = []
  if (Array.isArray(criteria)) {
    values = criteria.map((entry) => {
      if (entry && typeof entry === 'object') return entry.valor ?? entry.value ?? entry.puntaje ?? entry.score
      return entry
    })
  } else if (typeof criteria === 'object') {
    values = Object.values(criteria)
  }
  const nums = values
    .map((val) => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        const parsed = Number(val.replace(/[^0-9.-]/g, ''))
        return Number.isFinite(parsed) ? parsed : null
      }
      return null
    })
    .filter((val) => val != null)
  if (!nums.length) return null
  const avg = nums.reduce((acc, val) => acc + val, 0) / nums.length
  const maxScale = 5
  const minScale = 0
  const clamped = Math.max(minScale, Math.min(maxScale, avg))
  const normalized = maxScale === minScale ? 0 : (clamped - minScale) / (maxScale - minScale)
  return Number(normalized.toFixed(3))
}

export default function ProjectPortfolio() {
  const [dofa, setDofa] = useState(() => getLocalJson('dofa_data'))
  const [mefi, setMefi] = useState(() => getLocalJson('mefi_data'))
  const [mefe, setMefe] = useState(() => getLocalJson('mefe_data'))
  const [mafe, setMafe] = useState(() => readVersionedLocal('mafe_data', MAFE_EXPECTED_VERSION))
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [programFilter, setProgramFilter] = useState('ALL')
  const [maxPerType, setMaxPerType] = useState(5)
  const [miniTab, setMiniTab] = useState('impact')
  const [panelOpen, setPanelOpen] = useState(true)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [quickAnswer, setQuickAnswer] = useState(null)
  const [mafeBias, setMafeBias] = useState(0.3)
  const [expandedPrograms, setExpandedPrograms] = useState(() => [])
  const [showGlossary, setShowGlossary] = useState(false)
  const projectRefs = useRef({})
  const themeTokens = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        border: '#2a2f45',
        highlight: 'rgba(59,130,246,0.18)',
      }
    }
    const root = getComputedStyle(document.documentElement)
    return {
      border: root.getPropertyValue('--border')?.trim() || '#2a2f45',
      highlight: root.getPropertyValue('--highlight-bg')?.trim() || 'rgba(59,130,246,0.18)',
    }
  }, [])
  const expandedSet = useMemo(() => new Set(expandedPrograms), [expandedPrograms])
  const glossarySections = useMemo(() => ([
    {
      title: 'Tecnologías y prácticas',
      content: (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><strong>IoT</strong>: Internet de las Cosas; integración de sensores y dispositivos conectados.</li>
          <li><strong>IA</strong>: Inteligencia Artificial usada para analítica avanzada y automatización.</li>
          <li><strong>PdM</strong>: Mantenimiento Predictivo que anticipa fallas con datos e IA.</li>
          <li><strong>DevOps</strong>: Cultura y prácticas que unen desarrollo y operaciones para desplegar más rápido.</li>
          <li><strong>CI/CD</strong>: Integración y Despliegue Continuos que automatizan pruebas y releases.</li>
          <li><strong>HA/DR</strong>: Alta Disponibilidad y Recuperación ante Desastres para servicios críticos.</li>
        </ul>
      ),
    },
    {
      title: 'Indicadores y métricas',
      content: (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><strong>SLA</strong>: Service Level Agreement; compromisos de disponibilidad y tiempos de respuesta.</li>
          <li><strong>MTBF</strong>: Mean Time Between Failures; promedio entre fallas de un activo.</li>
          <li><strong>MTTR</strong>: Mean Time To Repair; tiempo promedio de recuperación tras una falla.</li>
          <li><strong>KPI</strong>: Indicador clave de desempeño para medir avances del proyecto.</li>
          <li><strong>NPS</strong>: Net Promoter Score; mide satisfacción o adopción de usuarios.</li>
          <li><strong>TCO</strong>: Total Cost of Ownership; costo total de mantener una solución.</li>
        </ul>
      ),
    },
    {
      title: 'Sistemas y dominios',
      content: (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><strong>O&M</strong>: Operación y Mantenimiento de activos o infraestructura.</li>
          <li><strong>BMS</strong>: Building Management System; plataforma que integra equipos de edificios.</li>
          <li><strong>ERP</strong>: Enterprise Resource Planning; sistema empresarial para recursos y finanzas.</li>
          <li><strong>RAEE</strong>: Residuos de Aparatos Eléctricos y Electrónicos gestionados de forma segura.</li>
        </ul>
      ),
    },
  ]), [])

  useEffect(() => {
    let cancel = false
    if (!dofa) {
      setLoading(true)
      fetchMatrix('/dofa.json').then((json) => {
        if (!cancel && json) setDofa(json)
        setLoading(false)
      })
    }
    if (!mefi) fetchMatrix('/mefi.json').then((json) => { if (!cancel && json) setMefi(json) })
    if (!mefe) fetchMatrix('/mefe.json').then((json) => { if (!cancel && json) setMefe(json) })
    if (!mafe || mafe.version !== MAFE_EXPECTED_VERSION) {
      fetchMatrix('/mafe.json').then((json) => {
        if (!cancel && json) {
          const next = json.version ? json : { ...json, version: MAFE_EXPECTED_VERSION }
          setMafe(next)
          try { localStorage.setItem('mafe_data', JSON.stringify(next)) } catch { /* ignore */ }
        }
      })
    }
    return () => { cancel = true }
  }, [dofa, mefi, mefe, mafe])

  const mefiMap = useMemo(() => {
    const entries = Array.isArray(mefi?.factores) ? mefi.factores : []
    return entries.reduce((acc, item) => acc.set(item.id, item), new Map())
  }, [mefi])

  const mefeMap = useMemo(() => {
    const entries = Array.isArray(mefe?.factores) ? mefe.factores : []
    return entries.reduce((acc, item) => acc.set(item.id, item), new Map())
  }, [mefe])

  const getMefiScore = (id) => {
    const factor = mefiMap.get(id)
    if (!factor) return 0
    return (Number(factor.peso) || 0) * (Number(factor.calificacion) || 0)
  }

  const getMefeScore = (id) => {
    const factor = mefeMap.get(id)
    if (!factor) return 0
    return (Number(factor.peso) || 0) * (Number(factor.calificacion) || 0)
  }

  const dofaIndex = useMemo(() => {
    const mapFrom = (arr) => new Map((Array.isArray(arr) ? arr : []).map((item) => [item.id, item]))
    return {
      F: mapFrom(dofa?.fortalezas),
      D: mapFrom(dofa?.debilidades),
      O: mapFrom(dofa?.oportunidades),
      A: mapFrom(dofa?.amenazas),
    }
  }, [dofa])

  const mafeStrategies = useMemo(() => {
    if (!mafe?.estrategias) return null
    const types = ['FO', 'FA', 'DO', 'DA']
    const build = (type) => {
      const list = Array.isArray(mafe.estrategias?.[type]) ? mafe.estrategias[type] : []
      const internalKind = type === 'FO' || type === 'FA' ? 'F' : 'D'
      const externalKind = type === 'FO' || type === 'DO' ? 'O' : 'A'
      return list.flatMap((estr, idx) => {
        const internalIds = Array.isArray(estr.cruce?.[internalKind]) ? estr.cruce[internalKind] : []
        const externalIds = Array.isArray(estr.cruce?.[externalKind]) ? estr.cruce[externalKind] : []
        const scoreInternal = internalIds.reduce((acc, id) => acc + getMefiScore(id), 0)
        const scoreExternal = externalIds.reduce((acc, id) => acc + getMefeScore(id), 0)
        const totalScore = Number((scoreInternal + scoreExternal).toFixed(2))
        const mafeCriteria = estr.criterios || estr.criteria || null
        const criteriaScore = computeCriteriaScore(mafeCriteria)
        const base = {
          type,
          internalIds,
          externalIds,
          score: totalScore,
          mafeId: estr.id,
          mafeEnunciado: estr.enunciado,
           mafeCriteria,
          criteriaScore,
          seedId: `${type}-${estr.id || idx}`,
        }
        if (Array.isArray(estr.proyectos) && estr.proyectos.length) {
          return estr.proyectos.map((proj, projIdx) => ({
            ...base,
            overrideProject: proj,
            projectKey: proj.id || `${base.seedId}-P${projIdx + 1}`,
          }))
        }
        return [base]
      })
    }
    return types.reduce((acc, type) => {
      acc[type] = build(type)
      return acc
    }, {})
  }, [mafe, mefiMap, mefeMap])

  const autoStrategies = useMemo(() => {
    const F = Array.isArray(dofa?.fortalezas) ? dofa.fortalezas : []
    const O = Array.isArray(dofa?.oportunidades) ? dofa.oportunidades : []
    const D = Array.isArray(dofa?.debilidades) ? dofa.debilidades : []
    const A = Array.isArray(dofa?.amenazas) ? dofa.amenazas : []
    const build = (left, right, type) => left.flatMap((l) => right.map((r) => ({
      type,
      internalIds: [l.id],
      externalIds: [r.id],
      score: Number((getMefiScore(l.id) + getMefeScore(r.id)).toFixed(2)),
      generatedText: type === 'FO'
        ? `Usar ${l.texto} para escalar ${r.texto}`
        : type === 'FA'
          ? `Usar ${l.texto} para mitigar ${r.texto}`
          : type === 'DO'
            ? `Corregir ${l.texto} aprovechando ${r.texto}`
            : `Blindar ${l.texto} ante ${r.texto}`,
      seedId: `${type}-${l.id}-${r.id}`,
    })))
    return {
      FO: build(F, O, 'FO'),
      FA: build(F, A, 'FA'),
      DO: build(D, O, 'DO'),
      DA: build(D, A, 'DA'),
    }
  }, [dofa, mefiMap, mefeMap])

  const strategySets = useMemo(() => {
    const types = ['FO', 'FA', 'DO', 'DA']
    const result = {}
    types.forEach((type) => {
      const mafeList = mafeStrategies?.[type] || []
      result[type] = mafeList.length ? mafeList : autoStrategies[type] || []
    })
    return result
  }, [mafeStrategies, autoStrategies])

  const strategySetsBiased = useMemo(() => {
    const getWeightedScore = (item) => {
      const baseScore = Number(item.score) || 0
      const criteriaScore = typeof item.criteriaScore === 'number' ? item.criteriaScore : null
      if (criteriaScore != null && mafeBias > 0) {
        const criteriaComponent = baseScore * criteriaScore
        return Number(((baseScore * (1 - mafeBias)) + (criteriaComponent * mafeBias)).toFixed(2))
      }
      if (item.mafeId) {
        return Number((baseScore * (1 + mafeBias)).toFixed(2))
      }
      return Number((baseScore * Math.max(0.1, 1 - mafeBias)).toFixed(2))
    }
    return Object.entries(strategySets).reduce((acc, [type, arr]) => {
      acc[type] = arr.map((item) => ({
        ...item,
        weightedScore: getWeightedScore(item),
      }))
      return acc
    }, {})
  }, [strategySets, mafeBias])

  const allStrategies = useMemo(() => {
    return Object.entries(strategySetsBiased).flatMap(([type, arr]) => arr.map((it, idx) => ({ ...it, key: `${type}-${idx}` })))
  }, [strategySetsBiased])

  const scoreStats = useMemo(() => {
    if (!allStrategies.length) return { min: 0, max: 1 }
    const scores = allStrategies.map((s) => Number(s.weightedScore ?? s.score) || 0)
    return { min: Math.min(...scores), max: Math.max(...scores) }
  }, [allStrategies])

  const getNormalized = (score) => {
    const { min, max } = scoreStats
    if (max === min) return 0.5
    return (score - min) / (max - min || 1)
  }

  const prioritizedStrategies = useMemo(() => {
    return Object.entries(strategySetsBiased).flatMap(([type, arr]) => {
      const ordered = [...arr].sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
      return ordered.slice(0, maxPerType).map((item, idx) => ({ ...item, key: `${type}-${idx}` }))
    }).sort((a, b) => (b.weightedScore || b.score || 0) - (a.weightedScore || a.score || 0))
  }, [strategySetsBiased, maxPerType])

  const buildProject = (strategy, index) => {
    const { type, internalIds = [], externalIds = [], score, weightedScore, mafeId, mafeEnunciado, generatedText, mafeCriteria, overrideProject, projectKey, seedId } = strategy
    const baseScore = Number(score) || 0
    const effectiveScore = Number(weightedScore ?? baseScore) || 0
    const normalized = getNormalized(effectiveScore)
    const priority = PRIORITY_LEVELS.find((lvl) => normalized >= lvl.threshold)?.label || 'Media'
    const impactLabel = IMPACT_LEVELS.find((lvl) => normalized >= lvl.threshold)?.label || 'Medio'
    const meta = TYPE_META[type] || { verb: 'Activar', effort: 'Media', horizon: '12 meses' }
    const internalKind = type === 'FO' || type === 'FA' ? 'F' : 'D'
    const externalKind = type === 'FO' || type === 'DO' ? 'O' : 'A'
    const internalNodes = internalIds.map((id) => dofaIndex[internalKind]?.get(id)).filter(Boolean)
    const externalNodes = externalIds.map((id) => dofaIndex[externalKind]?.get(id)).filter(Boolean)
    const labelSource = overrideProject?.nombre || mafeEnunciado || generatedText || externalNodes[0]?.texto || internalNodes[0]?.texto || 'estrategia'
    const baseProgramsText = `${internalNodes.map((n) => n?.texto).join(' ')} ${externalNodes.map((n) => n?.texto).join(' ')}`
    let programs = []
    if (Array.isArray(overrideProject?.programas) && overrideProject.programas.length) {
      programs = overrideProject.programas.map((code) => normalizeProgram(code)).filter(Boolean)
    }
    if (!programs.length) {
      const autoProgram = normalizeProgram(assignProgram(baseProgramsText))
      if (autoProgram) programs.push(autoProgram)
    }
    if (!programs.length) programs.push({ id: 'otros', label: 'Otros programas' })
    const primaryProgram = programs[0]
    const projectName = overrideProject?.nombre || (mafeId ? `${mafeId} · ${cleanLabel(labelSource)}` : `${meta.verb} ${cleanLabel(labelSource)}`)
    const description = overrideProject?.descripcion || mafeEnunciado || `Proyecto orientado a ${strategy.type === 'DO' || strategy.type === 'DA' ? 'cerrar brechas internas' : 'aprovechar capacidades existentes'} alineado con la estrategia ${type}.`
    const effects = []
    const effectLinks = []
    internalIds.forEach((id) => {
      const factor = mefiMap.get(id)
      if (factor) effects.push(`MEFI ${id}: ${factor.nombre || factor.descripcion || 'factor interno'} (peso ${formatScore(factor.peso)} → +calificación)`)
    })
    internalIds.forEach((id) => {
      effectLinks.push({ label: `MEFI ${id}`, matrix: 'mefi', id })
      effectLinks.push({ label: `DOFA ${id}`, matrix: 'dofa', id })
    })
    externalIds.forEach((id) => {
      const factor = mefeMap.get(id)
      if (factor) effects.push(`MEFE ${id}: ${factor.nombre || factor.descripcion || 'factor externo'} (peso ${formatScore(factor.peso)} → mejor respuesta)`)
      effectLinks.push({ label: `MEFE ${id}`, matrix: 'mefe', id })
      effectLinks.push({ label: `DOFA ${id}`, matrix: 'dofa', id })
    })
    if (!effects.length && labelSource) effects.push(`Refuerza ${labelSource}`)
    const kpis = Array.isArray(overrideProject?.kpis) && overrideProject.kpis.length
      ? overrideProject.kpis
      : (PROGRAM_SUGGESTIONS[primaryProgram.id] || PROGRAM_SUGGESTIONS.innovacion)
    const strategyText = `${mafeId ? `${mafeId}: ` : ''}${mafeEnunciado || generatedText || internalNodes.map((n) => n?.texto).join(' + ')}`
    const criteriaList = (() => {
      if (!mafeCriteria) return []
      if (Array.isArray(mafeCriteria)) {
        return mafeCriteria.map((entry, idx) => {
          if (entry && typeof entry === 'object') {
            return {
              nombre: entry.nombre || entry.name || `Criterio ${idx + 1}`,
              valor: entry.valor ?? entry.value ?? entry.puntaje ?? entry.score ?? '',
            }
          }
          return { nombre: typeof entry === 'string' ? entry : `Criterio ${idx + 1}`, valor: '' }
        })
      }
      if (typeof mafeCriteria === 'object') {
        return Object.entries(mafeCriteria).map(([nombre, valor]) => ({ nombre, valor }))
      }
      return []
    })()
    const seed = projectKey || seedId || `${type}-${internalIds[0] || externalIds[0] || index}`
    const finalId = overrideProject?.id || `PP-${seed}`
    return {
      id: finalId,
      type,
      priority,
      impactLabel,
      effort: overrideProject?.esfuerzo || meta.effort,
      horizon: overrideProject?.horizonte || meta.horizon,
      program: primaryProgram,
      programs,
      score: formatScore(baseScore),
      normalized: Number(normalized.toFixed(2)),
      strategyText,
      description,
      projectName,
      effects,
      kpis,
      sourceInternalIds: internalIds,
      sourceExternalIds: externalIds,
      mafeId,
      mafeCriteria: criteriaList,
      effectLinks,
    }
  }

  const projects = useMemo(() => prioritizedStrategies.map((strategy, idx) => buildProject(strategy, idx)), [prioritizedStrategies])

  const parseHorizonMonths = useCallback((horizon) => {
    if (!horizon) return 12
    const text = String(horizon).toLowerCase()
    const matches = text.match(/\d+/g)
    if (matches && matches.length) {
      const values = matches
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n))
      if (values.length) {
        return Math.max(...values)
      }
    }
    if (text.includes('corto')) return 6
    if (text.includes('medio')) return 12
    if (text.includes('largo')) return 18
    return 12
  }, [])

  const riskCoverage = useMemo(() => {
    const amenazas = Array.isArray(dofa?.amenazas) ? dofa.amenazas : []
    if (!amenazas.length) {
      return { rows: [], uncovered: [], stats: { total: 0, covered: 0, uncovered: 0 } }
    }
    const relevantProjects = projects.filter((project) => project.type === 'DO' || project.type === 'DA')
    const rows = amenazas.map((amenaza) => {
      const covering = relevantProjects.filter((proj) => (proj.sourceExternalIds || []).includes(amenaza.id))
      return {
        amenaza,
        coveredCount: covering.length,
        projects: covering,
      }
    })
    const covered = rows.filter((row) => row.coveredCount > 0)
    return {
      rows,
      uncovered: rows.filter((row) => row.coveredCount === 0),
      stats: {
        total: amenazas.length,
        covered: covered.length,
        uncovered: Math.max(0, amenazas.length - covered.length),
      },
    }
  }, [dofa, projects])

  const programOptions = useMemo(() => {
    const map = new Map(PROGRAM_RULES.map((p) => [p.id, p]))
    projects.forEach((project) => {
      (project.programs || [project.program]).forEach((prog) => {
        if (!prog) return
        if (!map.has(prog.id)) {
          map.set(prog.id, { id: prog.id, label: prog.label || prog.id })
        }
      })
    })
    return Array.from(map.values())
  }, [projects])

  useEffect(() => {
    if (programFilter !== 'ALL' && !programOptions.some((p) => p.id === programFilter)) {
      setProgramFilter('ALL')
    }
  }, [programFilter, programOptions])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const typeOk = typeFilter === 'ALL' || project.type === typeFilter
      const programOk = programFilter === 'ALL' || (project.programs || []).some((prog) => prog.id === programFilter)
      return typeOk && programOk
    })
  }, [projects, typeFilter, programFilter])

  const impactTimeline = useMemo(() => {
    const points = filteredProjects.map((project) => {
      const months = parseHorizonMonths(project.horizon)
      const impact = Number(project.normalized ?? 0)
      return {
        project,
        months,
        impact,
      }
    }).filter((point) => Number.isFinite(point.months) && Number.isFinite(point.impact))
    if (!points.length) return { points: [], maxMonths: 0, minMonths: 0 }
    const maxMonths = Math.max(12, ...points.map((p) => p.months))
    const minMonths = Math.min(...points.map((p) => p.months))
    return { points, maxMonths, minMonths }
  }, [filteredProjects, parseHorizonMonths])

  const timelineSummary = useMemo(() => {
    const impactThreshold = 0.6
    const horizonThreshold = 12
    const buckets = {
      highShort: 0,
      highLong: 0,
      lowShort: 0,
      lowLong: 0,
    }
    impactTimeline.points.forEach(({ impact, months }) => {
      const highImpact = impact >= impactThreshold
      const shortHorizon = months <= horizonThreshold
      if (highImpact && shortHorizon) buckets.highShort += 1
      else if (highImpact && !shortHorizon) buckets.highLong += 1
      else if (!highImpact && shortHorizon) buckets.lowShort += 1
      else buckets.lowLong += 1
    })
    return { buckets, impactThreshold, horizonThreshold }
  }, [impactTimeline])

  const renderTimelineScatter = useCallback(() => {
    if (!impactTimeline.points.length) {
      return <div style={{ fontSize: 13, opacity: 0.7 }}>Sin datos suficientes. Ajusta filtros o completa horizontes.</div>
    }
    const padding = { top: 12, right: 20, bottom: 32, left: 36 }
    const width = 420
    const height = 220
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom
    const maxMonths = Math.max(impactTimeline.maxMonths, 1)
    const monthsTicks = [0, Math.min(6, maxMonths), Math.min(12, maxMonths), maxMonths].filter((v, idx, arr) => idx === 0 || v !== arr[idx - 1])
    const yTicks = [0, 0.5, 1]
    const colorByType = {
      FO: '#3b82f6',
      FA: '#8b5cf6',
      DO: '#ef4444',
      DA: '#f97316',
    }
    const circleRadius = 6
    const xScale = (months) => padding.left + (months / maxMonths) * innerWidth
    const yScale = (impact) => padding.top + innerHeight - (impact * innerHeight)
    const horizonThresholdX = xScale(timelineSummary.horizonThreshold)
    const impactThresholdY = yScale(timelineSummary.impactThreshold)

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Impacto vs horizonte">
        <rect x={padding.left} y={padding.top} width={innerWidth} height={innerHeight} fill="rgba(148,163,184,0.08)" />
        <line x1={padding.left} y1={padding.top + innerHeight} x2={padding.left + innerWidth} y2={padding.top + innerHeight} stroke="rgba(148,163,184,0.6)" strokeWidth="1.5" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="rgba(148,163,184,0.6)" strokeWidth="1.5" />
        <line x1={horizonThresholdX} y1={padding.top} x2={horizonThresholdX} y2={padding.top + innerHeight} stroke="rgba(59,130,246,0.35)" strokeDasharray="4 3" />
        <line x1={padding.left} y1={impactThresholdY} x2={padding.left + innerWidth} y2={impactThresholdY} stroke="rgba(59,130,246,0.35)" strokeDasharray="4 3" />

        {monthsTicks.map((tick) => {
          const x = xScale(tick)
          return (
            <g key={`x-${tick}`}>
              <line x1={x} y1={padding.top + innerHeight} x2={x} y2={padding.top + innerHeight + 6} stroke="rgba(148,163,184,0.6)" />
              <text x={x} y={padding.top + innerHeight + 22} fontSize="11" textAnchor="middle" fill="rgba(148,163,184,0.9)">
                {Math.round(tick)}m
              </text>
            </g>
          )
        })}
        {yTicks.map((tick) => {
          const y = yScale(tick)
          return (
            <g key={`y-${tick}`}>
              <line x1={padding.left - 6} y1={y} x2={padding.left} y2={y} stroke="rgba(148,163,184,0.6)" />
              <text x={padding.left - 10} y={y + 4} fontSize="11" textAnchor="end" fill="rgba(148,163,184,0.9)">
                {Math.round(tick * 100)}%
              </text>
            </g>
          )
        })}

        {impactTimeline.points.map(({ project, months, impact }) => {
          const x = xScale(Math.min(months, maxMonths))
          const y = yScale(Math.max(0, Math.min(impact, 1)))
          const color = colorByType[project.type] || '#38bdf8'
          return (
            <g key={`pt-${project.id}`} onClick={() => setActiveProjectId(project.id)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r={circleRadius} fill={color} opacity={project.id === activeProjectId ? 0.95 : 0.75} stroke={project.id === activeProjectId ? '#0ea5e9' : 'rgba(15,23,42,0.6)'} strokeWidth={project.id === activeProjectId ? 2 : 1} />
              <text x={x} y={y - circleRadius - 4} fontSize="11" textAnchor="middle" fill="rgba(226,232,240,0.95)">
                {project.id}
              </text>
              <title>{`${project.projectName} · Impacto ${(impact * 100).toFixed(0)}% · Horizonte ${months} meses`}</title>
            </g>
          )
        })}

        <text x={padding.left + innerWidth / 2} y={height - 6} fontSize="12" textAnchor="middle" fill="rgba(226,232,240,0.9)">Horizonte (meses)</text>
        <text x={12} y={padding.top + innerHeight / 2} fontSize="12" textAnchor="middle" fill="rgba(226,232,240,0.9)" transform={`rotate(-90 12 ${padding.top + innerHeight / 2})`}>
          Impacto normalizado
        </text>
      </svg>
    )
  }, [impactTimeline, timelineSummary, activeProjectId, setActiveProjectId])

  const summary = useMemo(() => {
    if (!filteredProjects.length) return { avg: 0, programs: 0 }
    const avg = filteredProjects.reduce((acc, p) => acc + (p.normalized || 0), 0) / filteredProjects.length
    const programsSet = new Set()
    filteredProjects.forEach((p) => {
      (p.programs || []).forEach((prog) => programsSet.add(prog.id))
    })
    return { avg: Number(avg.toFixed(2)), programs: programsSet.size }
  }, [filteredProjects])

  const exportCSV = () => {
    const header = ['ID', 'Proyecto', 'Estrategia', 'Tipo', 'Programas', 'Prioridad', 'Impacto', 'Esfuerzo', 'Horizonte', 'Score', 'MAFE', 'KPIs sugeridos', 'Efectos en matrices']
    const rows = filteredProjects.map((p) => [
      p.id,
      p.projectName,
      p.strategyText,
      p.type,
      (p.programs || [p.program]).map((prog) => prog.label).join(' | '),
      p.priority,
      p.impactLabel,
      p.effort,
      p.horizon,
      p.score,
      p.mafeId || '',
      p.kpis.join(' | '),
      p.effects.join(' | '),
    ])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'portafolio_proyectos.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const programBreakdown = useMemo(() => {
    const map = new Map()
    filteredProjects.forEach((p) => {
      (p.programs || [p.program]).forEach((prog) => {
        if (!prog) return
        const current = map.get(prog.id) || { ...prog, count: 0, avg: 0 }
        current.count += 1
        current.avg += p.normalized || 0
        map.set(prog.id, current)
      })
    })
    return Array.from(map.values()).map((item) => ({
      ...item,
      avg: item.count ? Number((item.avg / item.count).toFixed(2)) : 0,
    }))
  }, [filteredProjects])

  const overallProgramBreakdown = useMemo(() => {
    const map = new Map()
    projects.forEach((p) => {
      (p.programs || [p.program]).forEach((prog) => {
        if (!prog) return
        const current = map.get(prog.id) || { ...prog, count: 0, avg: 0 }
        current.count += 1
        current.avg += p.normalized || 0
        map.set(prog.id, current)
      })
    })
    return Array.from(map.values()).map((item) => ({
      ...item,
      avg: item.count ? Number((item.avg / item.count).toFixed(2)) : 0,
    }))
  }, [projects])

  const programTree = useMemo(() => {
    const map = new Map()
    filteredProjects.forEach((project) => {
      (project.programs || [project.program]).forEach((prog) => {
        if (!prog) return
        const programId = prog.id || 'otros'
        const programLabel = prog.label || prog.id || 'Otros programas'
        if (!map.has(programId)) {
          map.set(programId, { program: { id: programId, label: programLabel }, projects: [] })
        }
        map.get(programId).projects.push(project)
      })
    })
    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        projects: entry.projects.slice().sort((a, b) => a.projectName.localeCompare(b.projectName)),
      }))
      .sort((a, b) => a.program.label.localeCompare(b.program.label))
  }, [filteredProjects])

  useEffect(() => {
    if (!programTree.length) {
      setExpandedPrograms((prev) => (prev.length === 0 ? prev : []))
      return
    }
    setExpandedPrograms((prev) => {
      if (!prev || prev.length === 0) {
        return programTree.map((entry) => entry.program.id)
      }
      const allowed = new Set(programTree.map((entry) => entry.program.id))
      const next = prev.filter((id) => allowed.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [programTree])

  const toggleProgram = useCallback((programId) => {
    setExpandedPrograms((prev) => {
      const prevSet = new Set(prev)
      if (prevSet.has(programId)) {
        prevSet.delete(programId)
      } else {
        prevSet.add(programId)
      }
      return Array.from(prevSet)
    })
  }, [])

  useEffect(() => {
    if (!activeProjectId) return
    const host = programTree.find((entry) => entry.projects.some((proj) => proj.id === activeProjectId))
    if (!host) return
    setExpandedPrograms((prev) => {
      if (prev.includes(host.program.id)) return prev
      return [...prev, host.program.id]
    })
  }, [activeProjectId, programTree])

  useEffect(() => {
    if (!filteredProjects.length) {
      setActiveProjectId(null)
      return
    }
    if (!activeProjectId || !filteredProjects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(filteredProjects[0].id)
    }
  }, [filteredProjects, activeProjectId])

  useEffect(() => {
    if (!activeProjectId) return
    const el = projectRefs.current[activeProjectId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeProjectId])

  const selectedProject = useMemo(() => filteredProjects.find((p) => p.id === activeProjectId) || null, [filteredProjects, activeProjectId])

  const renderBars = (items, color = '#60a5fa') => {
    if (!items || !items.length) return <div style={{ fontSize: 13, opacity: 0.7 }}>Sin datos suficientes.</div>
    const max = Math.max(1, ...items.map((item) => Number(item.value) || 0))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => {
          const value = Number(item.value) || 0
          const pct = Math.min(100, (value / max) * 100)
          return (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.75 }}>
                <span>{item.label}</span>
                <span>{value.toFixed ? value.toFixed(2) : value}</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.2)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const focusMatrix = (matrix, id) => {
    if (!id || typeof window === 'undefined') return
    try {
      localStorage.setItem('matrix_focus', JSON.stringify({ matrix, id, ts: Date.now() }))
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('matrix-focus'))
    window.location.hash = matrix
  }

  const handleQuickAnswer = (type) => {
    if (type === 'priority') {
      if (!projects.length) return setQuickAnswer({ title: 'Sin datos', text: 'Carga matrices para obtener recomendaciones.', dataPoints: [] })
      const sorted = [...projects].sort((a, b) => (b.normalized || 0) - (a.normalized || 0))
      const top = sorted[0]
      const topPrograms = (top.programs || [top.program]).map((p) => p?.label).filter(Boolean).join(', ') || 'programa sin clasificar'
      setQuickAnswer({
        title: 'Prioridad recomendada',
        text: `Enfócate en ${top.projectName} (${top.type}) porque su impacto normalizado es ${top.normalized.toFixed(2)} y responde al programa ${topPrograms}.`,
        dataPoints: sorted.slice(0, 3).map((p) => ({ label: p.projectName, value: p.normalized })),
      })
    }
    if (type === 'weak-program') {
      if (!overallProgramBreakdown.length) return setQuickAnswer({ title: 'Sin datos', text: 'No hay programas evaluados aún.', dataPoints: [] })
      const weakest = overallProgramBreakdown.reduce((prev, curr) => (curr.avg < prev.avg ? curr : prev))
      const sorted = [...overallProgramBreakdown].sort((a, b) => a.avg - b.avg).slice(0, 3)
      setQuickAnswer({
        title: 'Programa con menor cobertura',
        text: `${weakest.label} tiene solo ${weakest.count} proyectos y un impacto medio de ${weakest.avg}. Considera asignarle iniciativas FO/DO específicas.`,
        dataPoints: sorted.map((p) => ({ label: p.label, value: p.avg })),
      })
    }
  }

  const topImpact = useMemo(() => {
    const ordered = [...filteredProjects].sort((a, b) => (b.normalized || 0) - (a.normalized || 0))
    return ordered.slice(0, 4).map((p) => ({ label: p.projectName, value: p.normalized || 0 }))
  }, [filteredProjects])

  const riskSummary = useMemo(() => {
    const doCount = filteredProjects.filter((p) => p.type === 'DO').length
    const daCount = filteredProjects.filter((p) => p.type === 'DA').length
    const coverage = filteredProjects.length ? Number((((doCount + daCount) / filteredProjects.length)).toFixed(2)) : 0
    return { doCount, daCount, coverage }
  }, [filteredProjects])

  const miniProgramList = useMemo(() => {
    const sorted = [...overallProgramBreakdown].sort((a, b) => b.count - a.count)
    return sorted.slice(0, 3).map((p) => ({ label: p.label, value: p.count }))
  }, [overallProgramBreakdown])

  const miniTabContent = useMemo(() => {
    if (miniTab === 'riesgos') {
      return (
        <div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Cobertura actual de proyectos tipo DO/DA.</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 120 }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>DO activos</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{riskSummary.doCount}</div>
            </div>
            <div style={{ minWidth: 120 }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>DA activos</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{riskSummary.daCount}</div>
            </div>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Cobertura riesgo</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{(riskSummary.coverage * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )
    }
    if (miniTab === 'programas' ) {
      return (
        <div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Programas con más proyectos priorizados.</div>
          {renderBars(miniProgramList, '#a855f7')}
        </div>
      )
    }
    return (
      <div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>Top de impacto normalizado.</div>
        {renderBars(topImpact)}
      </div>
    )
  }, [miniTab, topImpact, riskSummary, miniProgramList])

  const quickAnswerContent = quickAnswer ? (
    <div>
      <div style={{ fontWeight: 600 }}>{quickAnswer.title}</div>
      <div style={{ fontSize: 13, margin: '6px 0 12px' }}>{quickAnswer.text}</div>
      {renderBars(quickAnswer.dataPoints, '#f472b6')}
    </div>
  ) : (
    <div style={{ fontSize: 13, opacity: 0.8 }}>Selecciona una pregunta para generar una respuesta rápida.</div>
  )

  if (loading && !dofa) {
    return <div>Cargando portafolio desde matrices...</div>
  }

  if (!dofa) {
    return <div>No pude encontrar datos de la matriz DOFA. Revisa la pestaña DOFA y exporta/importa nuevamente.</div>
  }

  return (
    <div>
      <h2 style={{ margin: '12px 0 8px' }}>Portafolio de proyectos</h2>
      <p style={{ opacity: 0.8, marginBottom: 12 }}>
        Se priorizan proyectos a partir de las estrategias DOFA (FO/FA/DO/DA) y los ponderados de MEFI/MEFE para analizar programas, impacto y efectos sobre las matrices.
      </p>

      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'impact', label: 'Impacto' },
            { key: 'riesgos', label: 'Riesgos' },
            { key: 'programas', label: 'Programas' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMiniTab(tab.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: miniTab === tab.key ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.2)',
                color: miniTab === tab.key ? '#3b82f6' : 'inherit',
                fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>{miniTabContent}</div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => handleQuickAnswer('priority')} style={{ border: '1px solid rgba(148,163,184,0.5)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>¿Qué debo priorizar hoy?</button>
            <button onClick={() => handleQuickAnswer('weak-program')} style={{ border: '1px solid rgba(148,163,184,0.5)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>¿Qué programa está más débil?</button>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>{quickAnswerContent}</div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 13, opacity: 0.7 }}>Tipo de estrategia</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6 }}>
            <option value="ALL">Todas</option>
            <option value="FO">FO</option>
            <option value="FA">FA</option>
            <option value="DO">DO</option>
            <option value="DA">DA</option>
          </select>
        </div>
        <div style={{ minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, opacity: 0.7 }}>Programa</label>
          <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6 }}>
            <option value="ALL">Todos</option>
            {programOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 13, opacity: 0.7 }}>Máx. estrategias por cuadrante</label>
          <input type="number" min={1} max={20} value={maxPerType} onChange={(e) => setMaxPerType(Number(e.target.value) || 1)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6 }} />
        </div>
        <div style={{ minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, opacity: 0.7 }}>Sesgo hacia estrategias MAFE</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mafeBias}
            onChange={(e) => setMafeBias(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 12, opacity: 0.75 }}>MAFE +{Math.round(mafeBias * 100)}% · Automáticas -{Math.round(mafeBias * 100)}%</div>
        </div>
        <div style={{ alignSelf: 'flex-end', marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={exportCSV} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Exportar portafolio (CSV)</button>
          <button onClick={() => { setDofa(getLocalJson('dofa_data')); setMefi(getLocalJson('mefi_data')); setMefe(getLocalJson('mefe_data')); setMafe(getLocalJson('mafe_data')) }} style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Recargar matrices</button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Proyectos priorizados</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{filteredProjects.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Impacto promedio</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.avg}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Programas cubiertos</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.programs}</div>
    </div>
  </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Impacto vs horizonte</div>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, opacity: 0.85, flexWrap: 'wrap' }}>
            {[
              { type: 'FO', color: '#3b82f6' },
              { type: 'FA', color: '#8b5cf6' },
              { type: 'DO', color: '#ef4444' },
              { type: 'DA', color: '#f97316' },
            ].map((entry) => (
              <span key={entry.type} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }} />
                {entry.type}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>{renderTimelineScatter()}</div>
          <div style={{ flex: '0 0 220px', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Cruce 2x2 considerando impacto ≥ {(timelineSummary.impactThreshold * 100).toFixed(0)}% y horizontes ≤ {timelineSummary.horizonThreshold} meses.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(80px, 1fr))', gap: 8 }}>
              <div style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(22,163,74,0.12)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Impacto alto · Corto plazo</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{timelineSummary.buckets.highShort}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(250,204,21,0.35)', background: 'rgba(250,204,21,0.12)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Impacto alto · Largo plazo</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{timelineSummary.buckets.highLong}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(148,163,184,0.12)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Impacto moderado · Corto</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{timelineSummary.buckets.lowShort}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(148,163,184,0.08)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Impacto moderado · Largo</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{timelineSummary.buckets.lowLong}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Usa el gráfico para decidir qué acelerar: prioriza los puntos azules/naranjas en el cuadrante superior izquierdo para victorias rápidas.
            </div>
          </div>
        </div>
      </section>

      {riskCoverage.rows.length > 0 && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Mapa rápido de riesgos (Amenazas DOFA)</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {riskCoverage.stats.covered} cubiertas · {riskCoverage.stats.uncovered} sin cobertura
            </div>
          </div>
          {riskCoverage.uncovered.length > 0 && (
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <strong>Riesgos sin mitigación:</strong>{' '}
              {riskCoverage.uncovered.map((row, idx) => (
                <span key={row.amenaza.id} style={{ marginRight: 8 }}>
                  {row.amenaza.id}
                  {idx < riskCoverage.uncovered.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {riskCoverage.rows.map((row) => {
              const projectsPreview = row.projects.slice(0, 3)
              const remaining = row.projects.length - projectsPreview.length
              return (
                <div
                  key={row.amenaza.id}
                  style={{
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`,
                    borderRadius: 8,
                    padding: 10,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: '1 1 260px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(248,113,113,0.18)', marginRight: 8 }}>
                      {row.amenaza.id}
                    </span>
                    <span style={{ fontSize: 13 }}>
                      {row.amenaza.texto || row.amenaza.nombre || row.amenaza.descripcion || ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {row.coveredCount > 0 ? (
                      <>
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                          Cobertura {row.coveredCount}
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {projectsPreview.map((proj) => (
                            <button
                              key={`${row.amenaza.id}-${proj.id}`}
                              onClick={() => setActiveProjectId(proj.id)}
                              style={{
                                border: '1px solid rgba(59,130,246,0.4)',
                                borderRadius: 6,
                                padding: '2px 6px',
                                background: 'transparent',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                            >
                              {proj.id}
                            </button>
                          ))}
                          {remaining > 0 && (
                            <span style={{ fontSize: 12, opacity: 0.75 }}>+{remaining}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Sin proyectos DO/DA</span>
                    )}
                    <button
                      onClick={() => focusMatrix('dofa', row.amenaza.id)}
                      style={{
                        border: '1px solid rgba(148,163,184,0.5)',
                        borderRadius: 6,
                        padding: '2px 6px',
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Ver amenaza
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Árbol de programas y proyectos</div>
        {programTree.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.75 }}>No hay proyectos que coincidan con los filtros actuales.</div>
        ) : (
          <div className="program-tree-diagram" role="tree" aria-label="Programas y proyectos priorizados">
            {programTree.map(({ program, projects }) => {
              const isOpen = expandedSet.has(program.id)
              const connectors = projects.length > 0
                ? projects.map((project, idx) => {
                    const position = (idx + 1) / (projects.length + 1)
                    const x = Math.min(98, Math.max(2, position * 100))
                    return (
                      <path
                        key={`${program.id}-conn-${project.id}`}
                        d={`M50 0 L50 20 L${x} 40`}
                        fill="none"
                        stroke="rgba(148,163,184,0.45)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    )
                  })
                : null
              return (
                <div key={program.id} className="program-tree-card" style={{ borderColor: themeTokens.border }}>
                  <button
                    onClick={() => toggleProgram(program.id)}
                    className={`tree-node tree-node--program${isOpen ? ' tree-node--active' : ''}`}
                    role="treeitem"
                    aria-expanded={isOpen}
                    aria-controls={`program-tree-${program.id}`}
                    data-program-id={program.id}
                    title="Mostrar / ocultar proyectos"
                  >
                    <span>{program.label}</span>
                    <span className="tree-node__count">{projects.length} proyectos</span>
                    <span className="tree-node__chevron">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <>
                      {projects.length > 0 && (
                        <svg className="tree-connectors" viewBox="0 0 100 40" preserveAspectRatio="none">
                          <line x1="50" y1="0" x2="50" y2="20" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                          {connectors}
                        </svg>
                      )}
                      <div className="tree-projects" role="group" id={`program-tree-${program.id}`}>
                        {projects.length === 0 ? (
                          <div className="tree-empty">Sin proyectos asignados</div>
                        ) : (
                          projects.map((project) => (
                            <button
                              key={`${program.id}-${project.id}`}
                              onClick={() => setActiveProjectId(project.id)}
                              className={`tree-node tree-node--project${project.id === activeProjectId ? ' tree-node--active' : ''}`}
                              role="treeitem"
                              aria-selected={project.id === activeProjectId}
                            >
                              <div className="tree-node__title">{project.projectName}</div>
                              <div className="tree-node__meta">{project.id} · {project.type}</div>
                              <div className="tree-node__meta">Prioridad {project.priority} · Impacto {project.impactLabel}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {programBreakdown.length > 0 && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Equilibrio por programa</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {programBreakdown.map((p) => (
              <div key={p.id} style={{ flex: '1 1 220px', border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Proyectos: {p.count}</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Impacto medio: {p.avg}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <aside style={{ flex: panelOpen ? '0 0 260px' : '0 0 48px', transition: 'all 0.2s ease', border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`, borderRadius: 12, padding: 12 }}>
          <button onClick={() => setPanelOpen((v) => !v)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, marginBottom: 12 }}>
            {panelOpen ? '◀ Ocultar panel' : '▶'}
          </button>
          {panelOpen && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Proyectos ({filteredProjects.length})</div>
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredProjects.map((project) => (
                  <button
                    key={`${project.id}-nav`}
                    onClick={() => setActiveProjectId(project.id)}
                    style={{
                      textAlign: 'left',
                      borderRadius: 8,
                      border: project.id === activeProjectId ? '2px solid rgba(59,130,246,0.5)' : '1px solid rgba(148,163,184,0.4)',
                      padding: '6px 8px',
                      background: project.id === activeProjectId ? 'rgba(59,130,246,0.08)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{project.projectName}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      {project.type} · {(project.programs || [project.program]).map((prog) => prog?.label).filter(Boolean).join(', ')}
                    </div>
                  </button>
                ))}
              </div>
              {selectedProject && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Accesos rápidos</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(selectedProject.sourceInternalIds || []).slice(0, 4).map((id) => (
                      <React.Fragment key={`internal-${id}`}>
                        <button onClick={() => focusMatrix('dofa', id)} style={{ border: '1px solid rgba(148,163,184,0.5)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}>DOFA {id}</button>
                        <button onClick={() => focusMatrix('mefi', id)} style={{ border: '1px solid rgba(148,163,184,0.5)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}>MEFI {id}</button>
                      </React.Fragment>
                    ))}
                    {(selectedProject.sourceExternalIds || []).slice(0, 4).map((id) => (
                      <React.Fragment key={`external-${id}`}>
                        <button onClick={() => focusMatrix('dofa', id)} style={{ border: '1px solid rgba(148,163,184,0.5)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}>DOFA {id}</button>
                        <button onClick={() => focusMatrix('mefe', id)} style={{ border: '1px solid rgba(148,163,184,0.5)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}>MEFE {id}</button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        <section className="card" style={{ flex: '1 1 480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>Backlog priorizado</div>
            <InfoTrigger onClick={() => setShowGlossary(true)} label="Glosario de siglas" />
          </div>
          {filteredProjects.length === 0 && <div>Sin resultados con los filtros seleccionados.</div>}
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                ref={(el) => { if (el) projectRefs.current[project.id] = el }}
                style={{
                  border: project.id === activeProjectId ? '2px solid rgba(59,130,246,0.6)' : `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#2a2f45'}`,
                  borderRadius: 10,
                  padding: 12,
                  background: project.id === activeProjectId ? 'rgba(59,130,246,0.05)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{project.projectName}</div>
                <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, background: 'rgba(59,130,246,0.15)' }}>{project.id}</span>
                {project.mafeId && <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>MAFE {project.mafeId}</span>}
                <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, background: 'rgba(34,197,94,0.18)' }}>Prioridad {project.priority}</span>
                <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, background: 'rgba(250,204,21,0.18)' }}>Impacto {project.impactLabel}</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(project.programs || [project.program]).map((prog) => (
                    <span key={`${project.id}-${prog?.id}`} style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, background: 'rgba(148,163,184,0.2)' }}>{prog?.label}</span>
                  ))}
                </div>
                </div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>{project.description}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}><strong>Estrategia origen {project.type}:</strong> {project.strategyText}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  <strong>Esfuerzo:</strong> {project.effort} · <strong>Horizonte:</strong> {project.horizon} · <strong>Score:</strong> {project.score}
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <strong>Efecto en matrices:</strong>
                    <InfoTrigger
                      onClick={() => setShowGlossary(true)}
                      label="Ver acrónimos"
                      style={{ fontSize: 12, padding: '2px 8px', gap: 4 }}
                    />
                  </div>
                  <div style={{ marginTop: 4 }}>{project.effects.join(' | ')}</div>
                  {project.effectLinks && project.effectLinks.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {project.effectLinks.map((link, idx) => (
                        <button
                          key={`${project.id}-effect-${idx}`}
                          onClick={() => focusMatrix(link.matrix, link.id)}
                          style={{
                            border: '1px solid rgba(148,163,184,0.5)',
                            borderRadius: 6,
                            padding: '2px 6px',
                            background: 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  <strong>KPIs sugeridos:</strong> {project.kpis.join(' · ')}
                </div>
                {project.mafeCriteria && project.mafeCriteria.length > 0 && (
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    <strong>Criterios MAFE:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {project.mafeCriteria.map((crit, idx) => (
                        <span key={`${project.id}-crit-${idx}`} style={{ padding: '2px 6px', borderRadius: 6, background: 'rgba(96,165,250,0.15)', fontSize: 12 }}>
                          {crit.nombre}: <strong>{crit.valor}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
      <MatrixInfoModal
        open={showGlossary}
        onClose={() => setShowGlossary(false)}
        title="Glosario del portafolio"
        sections={glossarySections}
      />
    </div>
  )
}

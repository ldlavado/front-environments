import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { stakeholders, environments, loadDefaultData } from './data'
import Charts from './components/Charts'
import EnvironmentImpact from './components/EnvironmentImpact'
import StackedEnvironments from './components/StackedEnvironments'
import Heatmap from './components/Heatmap'
import RadarProfile from './components/RadarProfile'
import SimilarityMatrix from './components/SimilarityMatrix'
import SankeySimple from './components/SankeySimple'
import DofaMatrix from './components/DofaMatrix'
import MefiMatrix from './components/MefiMatrix'
import MefeMatrix from './components/MefeMatrix'
import MafeMatrix from './components/MafeMatrix'
import MpcMatrix from './components/MpcMatrix'
import MmlMatrix from './components/MmlMatrix'
import StakeholderEditor from './components/StakeholderEditor'
import ExcelView from './components/ExcelView'
import EnvironmentResilience from './components/EnvironmentResilience'
import Navbar from './components/Navbar'

function App() {
  const [editableStakeholders, setEditableStakeholders] = useState(stakeholders)
  const [envs, setEnvs] = useState(environments)
  const [resetVersion, setResetVersion] = useState(0)
  const [theme, setTheme] = useState(() => {
    // prefer saved theme, else OS preference
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  // cargar desde JSON público al montar
  useEffect(() => {
    loadDefaultData().then(({ stakeholders: sts, environments: envsLoaded }) => {
      setEditableStakeholders(sts)
      setEnvs(envsLoaded)
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Agrupar tabs en dos secciones: Entornos y Análisis matricial
  const groups = useMemo(() => ([
    {
      label: 'Entornos',
      items: [
        { key: 'charts', title: 'Charts' },
        { key: 'environment-impact', title: 'Impacto por entorno' },
        { key: 'excel', title: 'Excel' },
        { key: 'stacked', title: 'Comparativa por entorno' },
        { key: 'heatmap', title: 'Heatmap' },
        { key: 'radar', title: 'Radar' },
        { key: 'editor', title: 'Editor' },
        { key: 'resilience', title: 'Resiliencia' },
      ]
    },
    {
      label: 'Análisis matricial',
      items: [
        { key: 'dofa', title: 'Matriz DOFA' },
        { key: 'mefi', title: 'Matriz MEFI' },
        { key: 'mefe', title: 'Matriz MEFE' },
        { key: 'mafe', title: 'Matriz MAFE' },
        { key: 'mpc', title: 'Matriz MPC' },
        { key: 'mml', title: 'Matriz MML' },
        { key: 'sim', title: 'Similitud' },
        { key: 'sankey', title: 'Sankey (texto)' },
      ]
    }
  ]), [])

  // Rutas aplanadas para manejo de hash y validación
  const flatRoutes = useMemo(() => groups.flatMap(g => g.items), [groups])

  const initialTab = useMemo(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    const exists = flatRoutes.some(r => r.key === hash)
    return exists ? hash : 'charts'
  }, [flatRoutes])

  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.replace('#', '')
      if (flatRoutes.some(r => r.key === next)) setTab(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [flatRoutes])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.replace('#', '') !== tab) {
      window.location.hash = tab
    }
  }, [tab])

  async function restoreDefaults() {
    try { localStorage.removeItem('stakeholders_edit') } catch { console.warn('No se pudo limpiar stakeholders_edit') }
    const { stakeholders: sts, environments: envsLoaded } = await loadDefaultData()
    setEditableStakeholders(sts)
    setEnvs(envsLoaded)
    setResetVersion((v) => v + 1) // fuerza remount del editor
  }

  return (
    <div style={{ padding: 24 }}>
      <Navbar groups={groups} current={tab} onNavigate={setTab} onRestore={restoreDefaults} />
      <div style={{ height: 8 }} />

      {/* Floating theme toggle */}
      <button
        onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        aria-label="Alternar tema"
        title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 50,
          padding: '10px 12px', borderRadius: '999px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.25)'
        }}
      >
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>

      {tab === 'charts' && <Charts stakeholders={editableStakeholders} environments={envs} />}
      {tab === 'environment-impact' && (
        <EnvironmentImpact stakeholders={editableStakeholders} environments={envs} />
      )}
      {tab === 'stacked' && <StackedEnvironments stakeholders={editableStakeholders} environments={envs} />}
      {tab === 'excel' && <ExcelView stakeholders={editableStakeholders} environments={envs} onImport={setEditableStakeholders} />}
      {tab === 'heatmap' && <Heatmap stakeholders={editableStakeholders} environments={envs} />}
      {tab === 'radar' && <RadarProfile stakeholders={editableStakeholders} environments={envs} />}

      {tab === 'sim' && <SimilarityMatrix stakeholders={editableStakeholders} environments={envs} />}
      {tab === 'sankey' && <SankeySimple stakeholders={editableStakeholders} environments={envs} />}
  {tab === 'dofa' && <DofaMatrix />}
  {tab === 'mefi' && <MefiMatrix />}
  {tab === 'mefe' && <MefeMatrix />}
  {tab === 'mafe' && <MafeMatrix />}
  {tab === 'mpc' && <MpcMatrix />}
  {tab === 'mml' && <MmlMatrix />}
      {tab === 'editor' && <StakeholderEditor key={resetVersion} stakeholders={editableStakeholders} environments={envs} onChange={setEditableStakeholders} />}
      {tab === 'resilience' && <EnvironmentResilience stakeholders={editableStakeholders} environments={envs} />}
    </div>
  )
}

export default App

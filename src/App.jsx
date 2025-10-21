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
import StakeholderEditor from './components/StakeholderEditor'
import ExcelView from './components/ExcelView'
import EnvironmentResilience from './components/EnvironmentResilience'
import Navbar from './components/Navbar'

function App() {
  const [editableStakeholders, setEditableStakeholders] = useState(stakeholders)
  const [envs, setEnvs] = useState(environments)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
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

  const routes = useMemo(() => ([
    { key: 'charts', title: 'Charts' },
    { key: 'environment-impact', title: 'Impacto por entorno' },
    { key: 'excel', title: 'Excel' },
    { key: 'stacked', title: 'Comparativa por entorno' },
    { key: 'heatmap', title: 'Heatmap' },
    { key: 'radar', title: 'Radar' },
    { key: 'sim', title: 'Similitud' },
    { key: 'sankey', title: 'Sankey (texto)' },
    { key: 'editor', title: 'Editor' },
    { key: 'resilience', title: 'Resiliencia' },
  ]), [])

  const initialTab = useMemo(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    const exists = routes.some(r => r.key === hash)
    return exists ? hash : 'charts'
  }, [routes])

  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.replace('#', '')
      if (routes.some(r => r.key === next)) setTab(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [routes])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.replace('#','') !== tab) {
      window.location.hash = tab
    }
  }, [tab])

  return (
    <div style={{ padding: 24 }}>
      <Navbar items={routes} current={tab} onNavigate={setTab} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={async () => {
          const { stakeholders: sts, environments: envsLoaded } = await loadDefaultData()
          setEditableStakeholders(sts)
          setEnvs(envsLoaded)
        }}>Restaurar datos por defecto</button>
      </div>

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
    {tab === 'editor' && <StakeholderEditor stakeholders={editableStakeholders} environments={envs} onChange={setEditableStakeholders} />}
  {tab === 'resilience' && <EnvironmentResilience stakeholders={editableStakeholders} environments={envs} />}
    </div>
  )
}

export default App

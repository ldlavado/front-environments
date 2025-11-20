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
import MpcMatrix2 from './components/MpcMatrix2'
import MmlMatrix from './components/MmlMatrix'
import StakeholderEditor from './components/StakeholderEditor'
import ExcelView from './components/ExcelView'
import EnvironmentResilience from './components/EnvironmentResilience'
import Navbar from './components/Navbar'
import ProjectPortfolio from './components/ProjectPortfolio'
import Trees from './components/Trees'

function App() {
  const [editableStakeholders, setEditableStakeholders] = useState(stakeholders)
  const [envs, setEnvs] = useState(environments)
  const [resetVersion, setResetVersion] = useState(0)

  // cargar desde JSON público al montar
  useEffect(() => {
    loadDefaultData().then(({ stakeholders: sts, environments: envsLoaded }) => {
      setEditableStakeholders(sts)
      setEnvs(envsLoaded)
    })
  }, [])

  // Tema único claro: no es necesario setear atributos

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
        { key: 'mpc2', title: 'Matriz MPC 2' },
        { key: 'mml', title: 'Matriz MML' },
        { key: 'portfolio', title: 'Portafolio proyectos' },
        { key: 'sim', title: 'Similitud' },
        { key: 'sankey', title: 'Sankey (texto)' },
        { key: 'trees', title: 'Árboles' },
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

      {/* Tema fijo en claro; se elimina el botón de alternancia */}

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
  {tab === 'mpc2' && <MpcMatrix2 />}
  {tab === 'mml' && <MmlMatrix />}
  {tab === 'trees' && <Trees />}
  {tab === 'portfolio' && <ProjectPortfolio />}
      {tab === 'editor' && <StakeholderEditor key={resetVersion} stakeholders={editableStakeholders} environments={envs} onChange={setEditableStakeholders} />}
      {tab === 'resilience' && <EnvironmentResilience stakeholders={editableStakeholders} environments={envs} />}
    </div>
  )
}

export default App

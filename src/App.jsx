import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { stakeholders, environments } from './data'
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

  {tab === 'charts' && <Charts stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'environment-impact' && (
        <EnvironmentImpact stakeholders={editableStakeholders} environments={environments} />
      )}
  {tab === 'stacked' && <StackedEnvironments stakeholders={editableStakeholders} environments={environments} />}
  {tab === 'excel' && <ExcelView stakeholders={editableStakeholders} environments={environments} onImport={setEditableStakeholders} />}
      {tab === 'heatmap' && <Heatmap stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'radar' && <RadarProfile stakeholders={editableStakeholders} environments={environments} />}
      
      {tab === 'sim' && <SimilarityMatrix stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'sankey' && <SankeySimple stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'editor' && <StakeholderEditor stakeholders={editableStakeholders} environments={environments} onChange={setEditableStakeholders} />}
  {tab === 'resilience' && <EnvironmentResilience stakeholders={editableStakeholders} environments={environments} />}
    </div>
  )
}

export default App

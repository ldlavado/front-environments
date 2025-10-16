import { useState } from 'react'
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

function App() {
  const [editableStakeholders, setEditableStakeholders] = useState(stakeholders)

  const [tab, setTab] = useState('charts') // 'charts' | 'environment-impact'

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard de stakeholders</h1>

  <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setTab('charts')} disabled={tab === 'charts'} style={{ marginRight: 8 }}>
          Charts
        </button>
        <button onClick={() => setTab('environment-impact')} disabled={tab === 'environment-impact'}>
          Impacto por entorno
        </button>
        <button onClick={() => setTab('stacked')} disabled={tab === 'stacked'}>Comparativa por entorno</button>
        <button onClick={() => setTab('heatmap')} disabled={tab === 'heatmap'}>Heatmap</button>
        <button onClick={() => setTab('radar')} disabled={tab === 'radar'}>Radar</button>
        
        <button onClick={() => setTab('sim')} disabled={tab === 'sim'}>Similitud</button>
        <button onClick={() => setTab('sankey')} disabled={tab === 'sankey'}>Sankey (texto)</button>
        <button onClick={() => setTab('editor')} disabled={tab === 'editor'}>Editor</button>
      </div>

  {tab === 'charts' && <Charts stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'environment-impact' && (
        <EnvironmentImpact stakeholders={editableStakeholders} environments={environments} />
      )}
      {tab === 'stacked' && <StackedEnvironments stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'heatmap' && <Heatmap stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'radar' && <RadarProfile stakeholders={editableStakeholders} environments={environments} />}
      
      {tab === 'sim' && <SimilarityMatrix stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'sankey' && <SankeySimple stakeholders={editableStakeholders} environments={environments} />}
      {tab === 'editor' && <StakeholderEditor stakeholders={editableStakeholders} environments={environments} onChange={setEditableStakeholders} />}
    </div>
  )
}

export default App

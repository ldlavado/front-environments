import { useMemo, useState } from 'react'
import './App.css'
import { stakeholders, environments } from './data'
import StakeholderSelector from './components/StakeholderSelector'
import Charts from './components/Charts'
import EnvironmentImpact from './components/EnvironmentImpact'
import StackedEnvironments from './components/StackedEnvironments'
import Heatmap from './components/Heatmap'
import RadarProfile from './components/RadarProfile'
import TopVariables from './components/TopVariables'
import SimilarityMatrix from './components/SimilarityMatrix'
import SankeySimple from './components/SankeySimple'

function App() {
  const [selected, setSelected] = useState(stakeholders[0].stakeholder)

  const current = useMemo(
    () => stakeholders.find((s) => s.stakeholder === selected),
    [selected],
  )

  const [tab, setTab] = useState('charts') // 'charts' | 'environment-impact'

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard de stakeholders</h1>
      {tab === 'charts' && (
        <StakeholderSelector
          stakeholders={stakeholders}
          value={selected}
          onChange={setSelected}
        />
      )}

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
        <button onClick={() => setTab('topvars')} disabled={tab === 'topvars'}>Top variables</button>
        <button onClick={() => setTab('sim')} disabled={tab === 'sim'}>Similitud</button>
        <button onClick={() => setTab('sankey')} disabled={tab === 'sankey'}>Sankey (texto)</button>
      </div>

      {tab === 'charts' && <Charts stakeholder={current} environments={environments} />}
      {tab === 'environment-impact' && (
        <EnvironmentImpact stakeholders={stakeholders} environments={environments} />
      )}
      {tab === 'stacked' && <StackedEnvironments stakeholders={stakeholders} environments={environments} />}
      {tab === 'heatmap' && <Heatmap stakeholders={stakeholders} environments={environments} />}
      {tab === 'radar' && <RadarProfile stakeholders={stakeholders} environments={environments} />}
      {tab === 'topvars' && <TopVariables stakeholders={stakeholders} />}
      {tab === 'sim' && <SimilarityMatrix stakeholders={stakeholders} environments={environments} />}
      {tab === 'sankey' && <SankeySimple stakeholders={stakeholders} environments={environments} />}
    </div>
  )
}

export default App

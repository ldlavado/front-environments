import { useMemo, useState } from 'react'
import './App.css'
import { stakeholders, environments } from './data'
import StakeholderSelector from './components/StakeholderSelector'
import Charts from './components/Charts'
import EnvironmentImpact from './components/EnvironmentImpact'

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

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setTab('charts')} disabled={tab === 'charts'} style={{ marginRight: 8 }}>
          Charts
        </button>
        <button onClick={() => setTab('environment-impact')} disabled={tab === 'environment-impact'}>
          Impacto por entorno
        </button>
      </div>

      {tab === 'charts' && <Charts stakeholder={current} environments={environments} />}
      {tab === 'environment-impact' && (
        <EnvironmentImpact stakeholders={stakeholders} environments={environments} />
      )}
    </div>
  )
}

export default App

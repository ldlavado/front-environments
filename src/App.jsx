import { useMemo, useState } from 'react'
import './App.css'
import { stakeholders, environments } from './data'
import StakeholderSelector from './components/StakeholderSelector'
import Charts from './components/Charts'

function App() {
  const [selected, setSelected] = useState(stakeholders[0].stakeholder)

  const current = useMemo(
    () => stakeholders.find((s) => s.stakeholder === selected),
    [selected],
  )

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard de stakeholders</h1>
      <StakeholderSelector
        stakeholders={stakeholders}
        value={selected}
        onChange={setSelected}
      />

      <Charts stakeholder={current} environments={environments} />
    </div>
  )
}

export default App

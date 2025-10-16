import React, { useMemo, useState } from 'react'
import StakeholderSelector from './StakeholderSelector'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Charts({ stakeholders = [], environments = [] }) {
  const [selectedStakeholder, setSelectedStakeholder] = useState(() => (stakeholders[0]?.stakeholder) || '')

  const stakeholder = useMemo(() => stakeholders.find((s) => s.stakeholder === selectedStakeholder) || stakeholders[0] || null, [selectedStakeholder, stakeholders])

  const vars = useMemo(() => stakeholder?.variables || {}, [stakeholder])
  const labels = useMemo(() => Object.keys(vars), [vars])

  // UI state: which tab and which variable is selected
  const [tab, setTab] = useState('agregado') // 'agregado' | 'por-variable'
  const [selectedVariable, setSelectedVariable] = useState(null)
  
  // selector ya integrado debajo de las tabs

  // pie for variables distribution
  const dataValues = labels.map((l) => vars[l].total_pct)
  const pieData = useMemo(() => ({ labels, datasets: [{ label: 'Porcentaje por variable', data: dataValues, backgroundColor: ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f'] }] }), [labels, dataValues])

  // aggregated environment data (sum across variables)
  const envAgg = useMemo(() => {
    const agg = {}
    environments.forEach((e) => (agg[e] = 0))
    labels.forEach((l) => {
      const imp = vars[l].impacto_pct || {}
      environments.forEach((e) => {
        agg[e] += Number(imp[e] || 0)
      })
    })
    return agg
  }, [labels, environments, vars])

  const envLabels = environments

  // If a variable is selected, compute its per-environment impact; otherwise use aggregated
  const envData = useMemo(() => {
    if (tab === 'por-variable' && selectedVariable) {
      const imp = vars[selectedVariable]?.impacto_pct || {}
      return envLabels.map((e) => Number(imp[e] || 0))
    }
    return envLabels.map((e) => envAgg[e])
  }, [tab, selectedVariable, envAgg, envLabels, vars])

  const envPie = useMemo(
    () => ({
      labels: envLabels,
      datasets: [
        {
          label: tab === 'por-variable' && selectedVariable ? `Impacto por entorno — ${selectedVariable}` : 'Impacto por entorno (agregado)',
          data: envData,
          backgroundColor: ['#8ad1c2', '#ffd166', '#f28b82', '#c3bef0', '#b1d3a8', '#d6b7ff'],
        },
      ],
    }),
    [envLabels, envData, selectedVariable, tab],
  )

  // helper: click a variable (from list) to switch to por-variable tab and set selection
  function onVariableClick(name) {
    setSelectedVariable(name)
    setTab('por-variable')
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setTab('agregado')} disabled={tab === 'agregado'} style={{ marginRight: 8 }}>
          Agregado por entorno
        </button>
        <button onClick={() => setTab('por-variable')} disabled={tab === 'por-variable'}>
          Por variable
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <StakeholderSelector stakeholders={stakeholders} value={selectedStakeholder} onChange={setSelectedStakeholder} />
      </div>

      {tab === 'agregado' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 480, textAlign: 'center' }}>
            <h3>Distribución por variable</h3>
            <Doughnut data={pieData} />
          </div>
          <div style={{ width: 480, textAlign: 'center' }}>
            <h3>Impacto por entorno (agregado)</h3>
            <Doughnut data={envPie} />
          </div>
        </div>
      )}

      {tab === 'por-variable' && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ width: 320 }}>
            <h3>Variables (clic para ver impacto por entorno)</h3>
            <ul>
              {labels.map((l) => (
                <li key={l} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => onVariableClick(l)}
                    style={{
                      cursor: 'pointer',
                      background: l === selectedVariable ? '#eee' : 'transparent',
                      border: '1px solid #ccc',
                      padding: '6px 8px',
                    }}
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ width: 480, textAlign: 'center' }}>
            <h3>{selectedVariable ? `Impacto por entorno — ${selectedVariable}` : 'Selecciona una variable'}</h3>
            <Doughnut data={envPie} />
          </div>
        </div>
      )}
    </div>
  )
}

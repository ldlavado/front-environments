import React, { useMemo, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function RadarProfile({ stakeholders, environments }) {
  const [selected, setSelected] = useState(stakeholders[0]?.stakeholder || '')

  const labels = environments.map((e) => String(e).charAt(0).toUpperCase() + String(e).slice(1))

  const data = useMemo(() => {
    const s = stakeholders.find((x) => x.stakeholder === selected) || stakeholders[0]
    const values = environments.map((env) => Object.keys(s.variables || {}).reduce((acc, v) => acc + Number((s.variables[v].impacto_pct?.[env] || 0)), 0))
    return { labels, datasets: [{ label: selected, data: values, backgroundColor: 'rgba(54,162,235,0.2)', borderColor: '#36a2eb' }] }
  }, [selected, stakeholders, environments, labels])

  return (
    <div style={{ padding: 12 }}>
      <h2>Perfil radar por stakeholder</h2>
      <div style={{ marginBottom: 8 }}>
        <label>Stakeholder: </label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {stakeholders.map((s) => (
            <option key={s.stakeholder} value={s.stakeholder}>{s.stakeholder}</option>
          ))}
        </select>
      </div>
      <Radar data={data} />
    </div>
  )
}

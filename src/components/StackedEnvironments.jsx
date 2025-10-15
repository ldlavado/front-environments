import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const COLORS = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#ffd166', '#c3bef0']

export default function StackedEnvironments({ stakeholders, environments }) {
  const { labels, datasets } = useMemo(() => {
    const labels = environments.map((e) => String(e).charAt(0).toUpperCase() + String(e).slice(1))
    const datasets = stakeholders.map((s, i) => {
      const data = environments.map((env) => {
        // sum impacto across variables for this stakeholder and env
        const vars = s.variables || {}
        return Object.keys(vars).reduce((acc, v) => acc + Number((vars[v].impacto_pct?.[env] || 0)), 0)
      })
      return {
        label: s.stakeholder,
        data,
        backgroundColor: COLORS[i % COLORS.length],
      }
    })
    return { labels, datasets }
  }, [stakeholders, environments])

  const data = { labels, datasets }
  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { x: { stacked: false }, y: { stacked: true } },
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Comparativa por entorno (barras apiladas)</h2>
      <Bar data={data} options={options} />
    </div>
  )
}

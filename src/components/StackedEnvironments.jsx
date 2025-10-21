import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const COLORS = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#ffd166', '#c3bef0']

export default function StackedEnvironments({ stakeholders, environments }) {
  // Resolve theme-aware chart colors from CSS variables so Canvas gets concrete values
  const rootStyles = typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement) : null
  const chartLegend = (rootStyles?.getPropertyValue('--chart-legend') || '').trim() || '#111827'
  const chartTick = (rootStyles?.getPropertyValue('--chart-tick') || '').trim() || '#111827'
  const chartGrid = (rootStyles?.getPropertyValue('--chart-grid') || '').trim() || 'rgba(0,0,0,0.1)'

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
        maxBarThickness: 56,
      }
    })
    return { labels, datasets }
  }, [stakeholders, environments])

  const data = { labels, datasets }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 200,
    plugins: {
      legend: { position: 'top', labels: { color: chartLegend } },
      tooltip: { mode: 'index', intersect: false },
    },
    interaction: { mode: 'index', intersect: false },
    layout: { padding: 8 },
    elements: { bar: { borderWidth: 0, maxBarThickness: 56 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: chartTick },
        grid: { color: chartGrid },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: chartTick },
        grid: { color: chartGrid },
      },
    },
  }

  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ marginBottom: 12 }}>Comparativa por entorno (barras apiladas)</h2>
      {/* Full-bleed chart area to overcome #root max-width */}
      <div style={{ margin: '0 calc(50% - 50vw)', width: '100vw' }}>
        <div style={{ width: '100%', height: 'clamp(360px, 65vh, 900px)', padding: '0 16px' }}>
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  )
}

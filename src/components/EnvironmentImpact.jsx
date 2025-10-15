import React, { useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function EnvironmentImpact({ stakeholders, environments }) {
  const [env, setEnv] = useState(environments[0])

  // calcular impacto total por stakeholder para el entorno seleccionado
  const impacts = useMemo(() => {
    return stakeholders.map((s) => {
      const vars = s.variables || {}
      const total = Object.keys(vars).reduce((acc, v) => {
        const imp = vars[v].impacto_pct || {}
        return acc + Number(imp[env] || 0)
      }, 0)
      return { stakeholder: s.stakeholder, total }
    })
  }, [stakeholders, env])

  // ordenar desc
  const sorted = useMemo(() => {
    return [...impacts].sort((a, b) => b.total - a.total)
  }, [impacts])

  const top = sorted[0]

  const sumTotal = impacts.reduce((s, i) => s + i.total, 0)

  // datos para la barra horizontal (porcentajes relativos respecto a la suma total)
  const barData = useMemo(() => {
    return {
      labels: sorted.map((s) => s.stakeholder),
      datasets: [
        {
          label: `Impacto en ${env} (porcentaje sobre total)`,
          data: sorted.map((s) => (sumTotal > 0 ? Number(((s.total / sumTotal) * 100).toFixed(1)) : 0)),
          backgroundColor: sorted.map((s, idx) => (idx === 0 ? '#4caf50' : '#90caf9')),
        },
      ],
    }
  }, [sorted, env, sumTotal])

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.x}%`,
        },
      },
    },
    scales: {
      x: { max: 100, ticks: { callback: (v) => `${v}%` } },
    },
  }

  return (
    <div style={{ marginTop: 24, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
      <h2>Impacto por entorno</h2>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="env-select">Entorno: </label>
        <select id="env-select" value={env} onChange={(e) => setEnv(e.target.value)}>
          {environments.map((e) => (
            <option key={e} value={e}>
              {String(e).charAt(0).toUpperCase() + String(e).slice(1)}
            </option>
          ))}
        </select>
      </div>

      {top ? (
        <div>
          <strong>Stakeholder con mayor incidencia:</strong>
          <div style={{ marginTop: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>{top.stakeholder}</span>
            <span style={{ marginLeft: 12, color: '#555' }}>
              ({top.total} pts — {sumTotal > 0 ? ((top.total / sumTotal) * 100).toFixed(1) : 0}%)
            </span>
          </div>

          <h3>Ranking</h3>
          <div style={{ width: '100%', maxWidth: 720 }}>
            <Bar data={barData} options={barOptions} />
          </div>
          <ol>
            {sorted.map((s) => (
              <li key={s.stakeholder} style={{ marginBottom: 6 }}>
                {s.stakeholder} — {s.total} pts — {sumTotal > 0 ? ((s.total / sumTotal) * 100).toFixed(1) : 0}%
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div>No hay datos</div>
      )}
    </div>
  )
}

import React, { useMemo } from 'react'
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
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

// Resiliencia del entorno: qué tan distribuida está la contribución al entorno entre stakeholders
// Métrica: 1 - HHI (Herfindahl-Hirschman Index) de la participación por stakeholder en cada entorno
// HHI = sum_i (share_i^2), share_i = contrib_i / total_entorno; Resiliencia = 1 - HHI (0 = concentrado, ~1 = muy distribuido)

export default function EnvironmentResilience({ stakeholders, environments }) {
  // matriz contribuciones: entorno -> stakeholder -> puntos
  const envShares = useMemo(() => {
    const map = {}
    for (const env of environments) {
      const rows = stakeholders.map((s) => {
        const vars = s.variables || {}
        const pts = Object.keys(vars).reduce((acc, v) => acc + Number(vars[v]?.impacto_pct?.[env] || 0), 0)
        return { name: s.stakeholder, pts }
      })
      const total = rows.reduce((a, r) => a + r.pts, 0)
      const shares = rows.map((r) => ({ name: r.name, share: total > 0 ? r.pts / total : 0 }))
      map[env] = shares
    }
    return map
  }, [stakeholders, environments])

  const resilience = useMemo(() => {
    return environments.map((env) => {
      const shares = envShares[env] || []
      const hhi = shares.reduce((acc, s) => acc + s.share * s.share, 0)
      const score = 1 - hhi
      return { env, score }
    })
  }, [envShares, environments])

  const data = useMemo(
    () => ({
      labels: resilience.map((r) => r.env),
      datasets: [
        {
          label: 'Resiliencia del entorno (1 - HHI)',
          data: resilience.map((r) => Number((r.score * 100).toFixed(1))),
          backgroundColor: '#8ad1c2',
        },
      ],
    }),
    [resilience],
  )

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#222',
        anchor: 'end',
        align: 'top',
        formatter: (v) => `${v}%`,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `Resiliencia: ${ctx.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
    },
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Capacidad de resistencia del entorno</h2>
      <p style={{ color: '#555', marginTop: 4 }}>
        Medimos la resiliencia como 1 − HHI de la participación de cada stakeholder en el entorno. Valores más altos indican
        que el impacto está más distribuido (más resiliente) y valores bajos indican concentración en pocos actores.
      </p>
      <div style={{ width: '100%', maxWidth: 820 }}>
        <Bar data={data} options={options} />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#777' }}>
        Nota: participación de stakeholder = contribución en puntos de ese actor al entorno / total de puntos del entorno.
      </div>
    </div>
  )
}

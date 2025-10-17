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
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

export default function EnvironmentImpact({ stakeholders, environments }) {
  const [env, setEnv] = useState(environments[0])
  const [selectedStakeholder, setSelectedStakeholder] = useState(null)
  const [onlyExclusive, setOnlyExclusive] = useState(false)

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

  // stakeholder actualmente seleccionado (si no hay, tomamos el top)
  const selectedName = useMemo(() => {
    if (!selectedStakeholder) return top?.stakeholder || null
    return sorted.some((s) => s.stakeholder === selectedStakeholder) ? selectedStakeholder : top?.stakeholder || null
  }, [selectedStakeholder, sorted, top])

  const sumTotal = impacts.reduce((s, i) => s + i.total, 0)

  // datos para la barra horizontal (porcentajes relativos respecto a la suma total)
  const barData = useMemo(() => {
    return {
      labels: sorted.map((s) => s.stakeholder),
      datasets: [
        {
          label: `Impacto en ${env} (porcentaje sobre total)`,
          data: sorted.map((s) => (sumTotal > 0 ? Number(((s.total / sumTotal) * 100).toFixed(1)) : 0)),
          backgroundColor: sorted.map((s) => (s.stakeholder === selectedName ? '#4caf50' : '#90caf9')),
        },
      ],
    }
  }, [sorted, env, sumTotal, selectedName])

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

  // Variables que explican el impacto del stakeholder seleccionado para el entorno actual
  const selectedStakeholderObj = useMemo(
    () => stakeholders.find((s) => s.stakeholder === selectedName) || null,
    [stakeholders, selectedName],
  )

  const varPairs = useMemo(() => {
    if (!selectedStakeholderObj) return []
    const vars = selectedStakeholderObj.variables || {}
    let arr = Object.keys(vars).map((key) => {
      const imp = vars[key]?.impacto_pct || {}
      const value = Number(imp?.[env] || 0)
      const sumOther = environments
        .filter((e) => e !== env)
        .reduce((acc, e) => acc + Number(imp?.[e] || 0), 0)
      const exclusive = value > 0 && sumOther === 0
      return [key, value, exclusive]
    })
    // filtrar ceros y, si corresponde, dejar solo exclusivas
    let filtered = arr.filter(([, v]) => v > 0)
    if (onlyExclusive) {
      filtered = filtered.filter(([, , exclusive]) => exclusive)
    }
    // dejar solo [key, value]
    const compact = filtered.map(([k, v]) => [k, v])
    compact.sort((a, b) => b[1] - a[1])
    return compact
  }, [selectedStakeholderObj, env, environments, onlyExclusive])

  const stakeholderEnvTotal = useMemo(() => varPairs.reduce((acc, [, v]) => acc + v, 0), [varPairs])

  // Para descomponer el % global (sobre el entorno) usamos TODAS las variables (>0) del stakeholder en el entorno actual
  const allVarPairs = useMemo(() => {
    if (!selectedStakeholderObj) return []
    const vars = selectedStakeholderObj.variables || {}
    const arr = Object.keys(vars)
      .map((key) => [key, Number(vars[key]?.impacto_pct?.[env] || 0)])
      .filter(([, v]) => v > 0)
    arr.sort((a, b) => b[1] - a[1])
    return arr
  }, [selectedStakeholderObj, env])

  const selectedStakeholderTotalPts = useMemo(
    () => impacts.find((i) => i.stakeholder === selectedName)?.total || 0,
    [impacts, selectedName],
  )
  const stakeholderPctOverEnv = useMemo(
    () => (sumTotal > 0 ? (selectedStakeholderTotalPts / sumTotal) * 100 : 0),
    [selectedStakeholderTotalPts, sumTotal],
  )

  // Stacked bar: una sola categoría con datasets por variable donde cada valor es (pts_var / sumTotal_env) * 100
  const palette = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#ffa600', '#8ad1c2', '#ffd166', '#f28b82']
  const varShareStackedData = useMemo(
    () => ({
      labels: ['% sobre el entorno'],
      datasets: allVarPairs.map(([name, v], i) => ({
        label: name,
        data: [sumTotal > 0 ? (v / sumTotal) * 100 : 0],
        backgroundColor: palette[i % palette.length],
        stack: 'vars',
      })),
    }),
    [allVarPairs, sumTotal],
  )

  const varShareStackedOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.x || 0).toFixed(1)}%`,
          },
        },
        datalabels: {
          color: '#222',
          anchor: 'center',
          align: 'center',
          formatter: (v) => `${Number(v).toFixed(1)}%`,
          clip: true,
        },
      },
      scales: {
        x: { stacked: true, max: 100, ticks: { callback: (v) => `${v}%` } },
        y: { stacked: true },
      },
    }),
    [],
  )

  const varBarData = useMemo(
    () => ({
      labels: varPairs.map(([k]) => k),
      datasets: [
        {
          label: `Contribución de variables a ${env}`,
          data: varPairs.map(([, v]) => v),
          backgroundColor: '#90caf9',
        },
      ],
    }),
    [varPairs, env],
  )

  const varBarOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = Number(ctx.parsed.x || 0)
              const p = stakeholderEnvTotal > 0 ? ((v / stakeholderEnvTotal) * 100).toFixed(1) : '0.0'
              return `${v} pts (${p}%)`
            },
          },
        },
        datalabels: {
          color: '#222',
          anchor: 'end',
          align: 'right',
          formatter: (v) => {
            const p = stakeholderEnvTotal > 0 ? ((v / stakeholderEnvTotal) * 100).toFixed(1) : '0.0'
            return `${v} pts (${p}%)`
          },
          clip: true,
        },
      },
      scales: {
        x: { beginAtZero: true },
      },
    }),
    [stakeholderEnvTotal],
  )

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
            <Bar
              data={barData}
              options={barOptions}
              onClick={(_, elements) => {
                const first = elements?.[0]
                if (!first) return
                const idx = first.index
                const name = barData.labels?.[idx]
                if (name) setSelectedStakeholder(name)
              }}
            />
          </div>
          <ol>
            {sorted.map((s) => {
              const isSel = s.stakeholder === selectedName
              return (
                <li
                  key={s.stakeholder}
                  onClick={() => setSelectedStakeholder(s.stakeholder)}
                  style={{ marginBottom: 6, cursor: 'pointer', fontWeight: isSel ? 600 : 400 }}
                >
                  {s.stakeholder} — {s.total} pts — {sumTotal > 0 ? ((s.total / sumTotal) * 100).toFixed(1) : 0}%
                </li>
              )
            })}
          </ol>

          {selectedName && (
            <div style={{ marginTop: 24 }}>
              <h3>
                Variables que explican el impacto en {env} — <span style={{ color: '#2e7d32' }}>{selectedName}</span>
              </h3>
              <div style={{ marginBottom: 8 }}>
                <label style={{ userSelect: 'none', cursor: 'pointer' }}>
                  <input type="checkbox" checked={onlyExclusive} onChange={(e) => setOnlyExclusive(e.target.checked)} />{' '}
                  Mostrar solo variables que influyen exclusivamente en este entorno
                </label>
              </div>
              <div style={{ width: '100%', maxWidth: 840 }}>
                <Bar data={varBarData} options={varBarOptions} />
              </div>
              {varPairs.length === 0 && (
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <span style={{ color: '#777' }}>
                    No hay variables que influyan {onlyExclusive ? 'exclusivamente ' : ''}en "{env}" para {selectedName}.
                  </span>
                  {onlyExclusive && (
                    <>
                      {' '}
                      <button
                        onClick={() => setOnlyExclusive(false)}
                        style={{ marginLeft: 8, padding: '2px 6px', fontSize: 12 }}
                      >
                        Mostrar todas
                      </button>
                    </>
                  )}
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 12, color: '#777' }}>
                Nota: el total del stakeholder en "{env}" es la suma de estas contribuciones por variable.
              </div>

              <div style={{ marginTop: 24 }}>
                <h3>¿Cómo se obtiene el % mostrado en el ranking?</h3>
                <div style={{ width: '100%', maxWidth: 840 }}>
                  <Bar data={varShareStackedData} options={varShareStackedOptions} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
                  {selectedStakeholderTotalPts} pts de {selectedName} en "{env}" divididos entre el total del entorno ({sumTotal} pts)
                  dan {(stakeholderPctOverEnv).toFixed(1)}%. Cada segmento de color muestra el aporte de una variable a ese porcentaje.
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#777' }}>
                  Esta descomposición usa todas las variables con aporte &gt; 0 en este entorno (no aplica el filtro de exclusivas).
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>No hay datos</div>
      )}
    </div>
  )
}

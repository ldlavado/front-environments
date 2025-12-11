import React, { useMemo, useState, useEffect } from 'react'
import { Radar } from 'react-chartjs-2'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function RadarProfile({ stakeholders, environments }) {
  const [selected, setSelected] = useState(stakeholders[0]?.stakeholder || '')
  const [compare, setCompare] = useState(false)
  const [selected2, setSelected2] = useState('')

  // keep selected valid when stakeholders list changes
  useEffect(() => {
    if (!stakeholders?.length) return
    if (!stakeholders.find((s) => s.stakeholder === selected)) {
      setSelected(stakeholders[0]?.stakeholder || '')
    }
  }, [stakeholders, selected])

  useEffect(() => {
    if (!stakeholders?.length) return
    if (selected2 && !stakeholders.find((s) => s.stakeholder === selected2)) {
      setSelected2('')
    }
    if (selected2 && selected2 === selected) {
      // evitar comparar el mismo
      setSelected2('')
    }
  }, [stakeholders, selected, selected2])

  const labels = environments.map((e) => String(e).charAt(0).toUpperCase() + String(e).slice(1))

  const cssVar = (name, fallback) => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      return v || fallback
    } catch { return fallback }
  }

  const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(0,0,0,${alpha})`
    let h = hex.replace('#', '')
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const num = parseInt(h, 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const primary = cssVar('--link', '#36a2eb')
  const secondary = cssVar('--link-hover', '#ef4444')

  const sumValuesFor = useMemo(() => (name) => {
    const s = stakeholders.find((x) => x.stakeholder === name) || stakeholders[0]
    if (!s) return environments.map(() => 0)
    return environments.map((env) =>
      Object.keys(s.variables || {}).reduce((acc, v) => acc + Number((s.variables[v].impacto_pct?.[env] || 0)), 0),
    )
  }, [stakeholders, environments])

  const data = useMemo(() => {
    const datasets = []
    const values1 = sumValuesFor(selected)
    datasets.push({
      label: selected || 'Stakeholder',
      data: values1,
      backgroundColor: hexToRgba(primary, 0.2),
      borderColor: primary,
      pointBackgroundColor: primary,
    })
    if (compare && selected2 && selected2 !== selected) {
      const values2 = sumValuesFor(selected2)
      datasets.push({
        label: selected2,
        data: values2,
        backgroundColor: hexToRgba(secondary, 0.2),
        borderColor: secondary,
        pointBackgroundColor: secondary,
      })
    }
    return { labels, datasets }
  }, [labels, selected, selected2, compare, primary, secondary, sumValuesFor])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: cssVar('--chart-legend', '#222') } },
      tooltip: { enabled: true },
    },
    scales: {
      r: {
        grid: { color: cssVar('--chart-grid', '#ddd') },
        angleLines: { color: cssVar('--chart-grid', '#ddd') },
        pointLabels: { color: cssVar('--chart-tick', '#222'), font: { size: 12 } },
        ticks: { display: true, color: cssVar('--chart-tick', '#222'), backdropColor: 'transparent' },
      },
    },
    elements: { line: { borderWidth: 2 } },
  }), [])

  return (
    <section className="card" style={{ padding: 12 }}>
      <h2>Perfil radar por stakeholder</h2>
      <div style={{ marginBottom: 8 }}>
        <label>Stakeholder: </label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {stakeholders.map((s) => (
            <option key={s.stakeholder} value={s.stakeholder}>{s.stakeholder}</option>
          ))}
        </select>
        <label style={{ marginLeft: 12 }}>
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Comparar
        </label>
        <select
          value={selected2}
          onChange={(e) => setSelected2(e.target.value)}
          disabled={!compare}
          style={{ marginLeft: 8, minWidth: 180 }}
        >
          <option value="">(Selecciona segundo)</option>
          {stakeholders
            .filter((s) => s.stakeholder !== selected)
            .map((s) => (
              <option key={s.stakeholder} value={s.stakeholder}>{s.stakeholder}</option>
            ))}
        </select>
      </div>
      <div style={{ width: '100%', maxWidth: 960, height: 'clamp(320px, 60vh, 720px)', margin: '0 auto' }}>
        <Radar data={data} options={options} />
      </div>
    </section>
  )
}

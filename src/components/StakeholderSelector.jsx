import React from 'react'

export default function StakeholderSelector({ stakeholders, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor="stakeholder">Stakeholder: </label>
      <select id="stakeholder" value={value} onChange={(e) => onChange(e.target.value)}>
        {stakeholders.map((s) => (
          <option key={s.stakeholder} value={s.stakeholder}>
            {s.stakeholder}
          </option>
        ))}
      </select>
    </div>
  )
}

import "./groupedgrid.css"

function CardBar({ pct }) {
  if (pct == null) return <span className="card-bar-na">—</span>
  const color = pct > 60 ? "#10b981" : pct > 30 ? "#f59e0b" : "#f87171"
  return (
    <span className="card-bar">
      <span className="card-bar-track">
        <span className="card-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="card-bar-label">{pct}%</span>
    </span>
  )
}

function calcOverall(hp, hu) {
  return Math.min(100, Math.round(hp + hu * 0.15))
}

function MuCard({ mu, onSelect }) {
  const obj = mu.objekt
  const hp = mu.unitAvgHealthPct
  const hu = mu.unitAvgHungerPct
  const overall = hp != null && hu != null ? calcOverall(hp, hu) : null
  const warPct = mu.warPct
  const cardClass = warPct == null ? 'mu-card'
    : warPct >= 75 ? 'mu-card mu-card-war'
    : warPct <= 25 ? 'mu-card mu-card-eco'
    : 'mu-card'

  return (
    <div className={cardClass} onClick={() => onSelect(mu)}>
      <div className="mu-card-header">
        {obj.avatarUrl ? (
          <img src={obj.avatarUrl} alt={obj.name} className="mu-card-avatar" />
        ) : (
          <div className="mu-card-avatar-placeholder">?</div>
        )}
        <h3 className="mu-card-name">{obj.name}</h3>
      </div>

      <div className="mu-card-stats">
        <div className="mu-card-stat">
          Weekly Damage
          <span>{obj.rankings?.muWeeklyDamages?.toLocaleString() || "0"}</span>
        </div>
        <div className="mu-card-stat">
          Wealth
          <span className="text-gold">{obj.rankings?.muWealth?.toLocaleString() || "0"} BTC</span>
        </div>
        <div className="mu-card-stat">
          Overall HP&H
          <CardBar pct={overall} />
        </div>
        <div className="mu-card-stat">
          Kriegstüchtige
          <CardBar pct={mu.unitAvgWarOverall} />
        </div>
      </div>

      <div className="mu-card-members">
        {obj.members?.length || 0} members
      </div>
    </div>
  )
}

function groupByCategory(items) {
  const map = new Map()
  items.forEach((item) => {
    const cat = item.category || "unknown"
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(item)
  })
  return Array.from(map.entries())
}

export default function GroupedGrid({ muData = [], onSelectMu }) {
  if (muData.length === 0) {
    return (
      <div className="grid-loading">
        No military units configured. Add MU IDs to src/config.js.
      </div>
    )
  }

  const groups = groupByCategory(muData).map(([category, items]) => [
    category,
    [...items].sort((a, b) => {
      const dmgA = a.objekt?.rankings?.muWeeklyDamages ?? 0
      const dmgB = b.objekt?.rankings?.muWeeklyDamages ?? 0
      return dmgB - dmgA
    }),
  ])

  return (
    <>
      {groups.map(([category, items]) => (
        <section key={category} className="mu-category-section">
          <h2 className="mu-category-header">{category}</h2>
          <div className="grid-container">
            {items.map((mu) => (
              <MuCard key={mu.id} mu={mu} onSelect={onSelectMu} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

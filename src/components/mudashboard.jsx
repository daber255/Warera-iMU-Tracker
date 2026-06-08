import { useState, useEffect } from "react"
import "./mudashboard.css"

function MuGeneralStats({ rankings = {}, activeUpgradeLevels = {} }) {
  return (
    <div className="mu-stats-box">
      <h3 className="mu-section-title">Unit Statistics</h3>
      <div className="mu-stats-grid">
        <div className="mu-stat-entry">
          <span className="mu-label">Wealth:</span>
          <span className="mu-value text-gold">{rankings.muWealth?.toLocaleString() || "0"} BTC</span>
        </div>
        <div className="mu-stat-entry">
          <span className="mu-label">Weekly Damage:</span>
          <span className="mu-value">{rankings.muWeeklyDamages?.toLocaleString() || "0"}</span>
        </div>
        <div className="mu-stat-entry">
          <span className="mu-label">Total Damage:</span>
          <span className="mu-value">{rankings.muDamages?.toLocaleString() || "0"}</span>
        </div>
        <div className="mu-stat-entry">
          <span className="mu-label">HQ Level:</span>
          <span className="mu-value">{activeUpgradeLevels.headquarters || "N/A"}</span>
        </div>
        <div className="mu-stat-entry">
          <span className="mu-label">Dormitories:</span>
          <span className="mu-value">{activeUpgradeLevels.dormitories || "N/A"}</span>
        </div>
      </div>
    </div>
  )
}

function MuManagement({ managers = [], commanders = [] }) {
  return (
    <div className="mu-management-box">
      <h3 className="mu-section-title">Leadership</h3>

      <div className="mu-management-section">
        <h4>Managers ({managers.length})</h4>
        {managers.length === 0 ? (
          <p className="mu-no-data">No managers assigned</p>
        ) : (
          <div className="mu-management-cards-container">
            {managers.map((mgr, idx) => {
              const hasAvatar = mgr.avatarUrl && mgr.avatarUrl !== ""
              return (
                <div key={mgr._id || idx} className="mu-leader-card manager-item">
                  <div className="mu-leader-avatar-wrapper">
                    {hasAvatar ? (
                      <img src={mgr.avatarUrl} alt={mgr.username} className="mu-leader-avatar" />
                    ) : (
                      <div className="mu-leader-avatar-placeholder">?</div>
                    )}
                  </div>
                  <span className="mu-leader-name">{mgr.username || `ID: ${mgr._id?.substring(0, 6)}`}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mu-management-section">
        <h4>Commanders ({commanders.length})</h4>
        {commanders.length === 0 ? (
          <p className="mu-no-data">No commanders assigned</p>
        ) : (
          <div className="mu-management-cards-container">
            {commanders.map((cmd, idx) => {
              const hasAvatar = cmd.avatarUrl && cmd.avatarUrl !== ""
              return (
                <div key={cmd._id || idx} className="mu-leader-card commander-item">
                  <div className="mu-leader-avatar-wrapper">
                    {hasAvatar ? (
                      <img src={cmd.avatarUrl} alt={cmd.username} className="mu-leader-avatar" />
                    ) : (
                      <div className="mu-leader-avatar-placeholder">?</div>
                    )}
                  </div>
                  <span className="mu-leader-name">{cmd.username || `ID: ${cmd._id?.substring(0, 6)}`}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniBar({ current, max, compact }) {
  const pct = max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0
  const color = pct > 60 ? "#10b981" : pct > 30 ? "#f59e0b" : "#f87171"
  const w = compact ? 48 : 60
  return (
    <div className="status-bar-cell" style={compact ? { gap: 4 } : undefined}>
      <div className="status-bar-bg" style={{ width: w }}>
        <div className="status-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="status-bar-text">{pct}%</span>
    </div>
  )
}

function calcOverall(health, hunger) {
  const hp = health?.total > 0 ? (health.currentBarValue / health.total) * 100 : 0
  const hu = hunger?.total > 0 ? (hunger.currentBarValue / hunger.total) * 100 : 0
  return Math.min(100, Math.round(hp + hu * 0.15))
}

function HpHungerOverallCell({ skills = {} }) {
  const health = skills.health || {}
  const hunger = skills.hunger || {}
  const overall = calcOverall(skills.health, skills.hunger)
  const ovPct = Math.max(0, Math.min(overall, 100))
  const ovColor = ovPct > 60 ? "#10b981" : ovPct > 30 ? "#f59e0b" : "#f87171"
  return (
    <div className="hp-hunger-cell">
      <div className="hp-hunger-row">
        <span className="hp-hunger-label">HP</span>
        <MiniBar current={health.currentBarValue} max={health.total} compact />
      </div>
      <div className="hp-hunger-row">
        <span className="hp-hunger-label">H</span>
        <MiniBar current={hunger.currentBarValue} max={hunger.total} compact />
      </div>
      <div className="hp-hunger-row hp-hunger-row-overall">
        <span className="hp-hunger-label">OV</span>
        <div className="status-bar-cell" style={{ gap: 4 }}>
          <div className="status-bar-bg" style={{ width: 48 }}>
            <div className="status-bar-fill" style={{ width: `${ovPct}%`, background: ovColor }} />
          </div>
          <span className="status-bar-text">{overall}%</span>
        </div>
      </div>
    </div>
  )
}

function warSP(skills) {
  if (!skills) return 0
  return (
    (skills.attack?.level || 0) +
    (skills.criticalChance?.level || 0) +
    (skills.criticalDamages?.level || 0) +
    (skills.armor?.level || 0) +
    (skills.precision?.level || 0) +
    (skills.dodge?.level || 0)
  )
}

function ecoSP(skills) {
  if (!skills) return 0
  return (
    (skills.energy?.level || 0) +
    (skills.companies?.level || 0) +
    (skills.entrepreneurship?.level || 0) +
    (skills.production?.level || 0) +
    (skills.management?.level || 0) +
    (skills.lootChance?.level || 0)
  )
}

function buildType(skills) {
  const w = warSP(skills)
  const e = ecoSP(skills)
  const total = w + e
  if (total > 0 && w / total > 0.5 && (skills?.attack?.level || 0) >= 2) return "war"
  return "eco"
}

function BuildTag({ skills = {} }) {
  const w = warSP(skills)
  const e = ecoSP(skills)
  const atkLv = skills?.attack?.level || 0
  const type = buildType(skills)
  return (
    <span className={`build-tag build-${type}`} title={`War Σ: ${w}, Eco Σ: ${e}, Attack Lv: ${atkLv}, Result: ${type}`}>
      {type === "war" ? "War" : "Eco"}
    </span>
  )
}

function BuffSvg() {
  return (
    <svg className="buff-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.22 11.29a1 1 0 0 1 .32-1.44l1.5-.86-.53-1.73a1 1 0 0 1 1.52-1.1L10 7.5l2.97-2.34a1 1 0 0 1 1.52 1.1l-.53 1.73 1.5.86a1 1 0 0 1 .32 1.44l-1.2 1.58.4 1.78a1 1 0 0 1-1.52 1.1L10 11.5l-2.97 2.34a1 1 0 0 1-1.52-1.1l.4-1.78-1.2-1.58z" fill="#10b981" />
    </svg>
  )
}

function DebuffSvg() {
  return (
    <svg className="buff-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4l12 12M16 4L4 16" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function formatTimer(dateStr) {
  const diffMs = new Date(dateStr).getTime() - Date.now()
  if (diffMs <= 0) return null
  return `${Math.floor(diffMs / 3600000)}h ${Math.floor((diffMs % 3600000) / 60000)}m`
}

function NameBuffIndicator({ buffs = {} }) {
  if (!buffs) return null

  if (buffs.buffCodes?.length > 0 && buffs.buffEndAt) {
    const timer = formatTimer(buffs.buffEndAt)
    if (!timer) return <span className="name-buff name-buff-expired">buff expired</span>
    return (
      <span className="name-buff name-buff-active">
        <BuffSvg />
        <span className="name-buff-timer">{timer}</span>
      </span>
    )
  }

  if (buffs.debuffCodes?.length > 0 && buffs.debuffEndAt) {
    const timer = formatTimer(buffs.debuffEndAt)
    if (!timer) return <span className="name-buff name-debuff-expired">debuff expired</span>
    return (
      <span className="name-buff name-debuff-active">
        <DebuffSvg />
        <span className="name-buff-timer">{timer}</span>
      </span>
    )
  }

  return null
}

function MuUserList({ members = [], muUsers = [], isLoadingUsers = false }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "desc" })

  const displayList = muUsers.length > 0 ? muUsers : members

  const requestSort = (key) => {
    let direction = "desc"
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc"
    }
    setSortConfig({ key, direction })
  }

  const sortedList = [...displayList].sort((a, b) => {
    if (!sortConfig.key) return 0

    let valA, valB
    if (sortConfig.key === "name") {
      valA = (a.username || "").toLowerCase()
      valB = (b.username || "").toLowerCase()
    } else if (sortConfig.key === "damage") {
      valA = a.rankings?.weeklyUserDamages?.value || a.weeklyUserDamages || 0
      valB = b.rankings?.weeklyUserDamages?.value || b.weeklyUserDamages || 0
    } else if (sortConfig.key === "level") {
      valA = a.level || 0
      valB = b.level || 0
    } else if (sortConfig.key === "active") {
      valA = a.isActive ? 1 : 0
      valB = b.isActive ? 1 : 0
    } else if (sortConfig.key === "hp") {
      valA = a.skills?.health?.currentBarValue || 0
      valB = b.skills?.health?.currentBarValue || 0
    } else if (sortConfig.key === "overall") {
      valA = calcOverall(a.skills?.health, a.skills?.hunger)
      valB = calcOverall(b.skills?.health, b.skills?.hunger)
    }

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const getClassNamesFor = (name) => {
    if (sortConfig.key !== name) return ""
    return sortConfig.direction === "asc" ? " ▲" : " ▼"
  }

  return (
    <div className="mu-userlist-box">
      <h3 className="mu-section-title">Members ({members.length})</h3>

      {isLoadingUsers && <div className="mu-loading-inline">Loading user data...</div>}

      {sortedList.length === 0 ? (
        <p className="mu-no-data">No members found in this unit.</p>
      ) : (
        <table className="mu-user-table">
          <thead>
            <tr>
              <th onClick={() => requestSort("name")} className="sortable-header">
                Name{getClassNamesFor("name")}
              </th>
              <th onClick={() => requestSort("damage")} className="sortable-header">
                Weekly Damage{getClassNamesFor("damage")}
              </th>
              <th onClick={() => requestSort("level")} className="sortable-header">
                Level{getClassNamesFor("level")}
              </th>
              <th onClick={() => requestSort("active")} className="sortable-header">
                Active{getClassNamesFor("active")}
              </th>
              <th onClick={() => requestSort("hp")} className="sortable-header">
                HP/H/OV{getClassNamesFor("hp")}
              </th>
              <th>Build</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((user, idx) => {
              const weeklyDmg = user.rankings?.weeklyUserDamages?.value || user.weeklyUserDamages || 0
              const isActive = user.isActive
              const hasAvatar = user.avatarUrl && user.avatarUrl !== ""

              return (
                <tr key={user._id || idx}>
                  <td>
                    <div className="user-name-cell">
                      <div className="mu-table-avatar-wrapper">
                        {hasAvatar ? (
                          <img src={user.avatarUrl} alt={user.username} className="mu-table-avatar" />
                        ) : (
                          <div className="mu-table-avatar-placeholder">?</div>
                        )}
                      </div>
                      <span className="mu-table-username-text">{user.username}</span>
                      <NameBuffIndicator buffs={user.buffs} />
                    </div>
                  </td>
                  <td>{weeklyDmg.toLocaleString()}</td>
                  <td>{user.level || "?"}</td>
                  <td>
                    <span className={`status-dot ${isActive ? "active" : "inactive"}`}></span>
                    {isActive ? "active" : "inactive"}
                  </td>
                  <td>
                    <HpHungerOverallCell skills={user.skills} />
                  </td>
                  <td>
                    <BuildTag skills={user.skills} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function MuDashboard({ selectedMu = null, dataHandler }) {
  const [muUsers, setMuUsers] = useState({ managers: [], commanders: [], members: [] })
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    if (!selectedMu?.objekt?._id) return

    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const data = await dataHandler.getMUUserData(selectedMu.objekt._id)
        setMuUsers(data)
      } catch (err) {
        console.error("Error loading user details:", err)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [selectedMu, dataHandler])

  if (!selectedMu || !selectedMu.objekt) {
    return <div className="mu-no-selection">Select a military unit to view details.</div>
  }

  const muData = selectedMu.objekt

  return (
    <div className="mu-dashboard-wrapper">
      <div className="mu-dashboard-header">
        {muData.avatarUrl && <img src={muData.avatarUrl} alt={muData.name} className="mu-dashboard-avatar" />}
        <h2>{muData.name}</h2>
      </div>

      <div className="mu-dashboard-top-row">
        <MuGeneralStats rankings={muData.rankings} activeUpgradeLevels={muData.activeUpgradeLevels} />
        <MuManagement managers={muUsers.managers} commanders={muUsers.commanders} />
      </div>

      <div className="mu-dashboard-bottom-row">
        <MuUserList members={muData.members} muUsers={muUsers.members} isLoadingUsers={isLoadingUsers} />
      </div>
    </div>
  )
}

export default MuDashboard

import { getWarEraClient } from "./apiwrapper.js"
import { MU_CATEGORIES, MU_IDS } from "../config.js"

function calcOverallRaw(health, hunger) {
  const hp = health?.total > 0 ? (health.currentBarValue / health.total) * 100 : 0
  const hu = hunger?.total > 0 ? (hunger.currentBarValue / hunger.total) * 100 : 0
  return Math.min(100, Math.round(hp + hu * 0.15))
}

function isWarBuild(skills) {
  if (!skills) return false
  const war = (skills.attack?.level || 0) + (skills.criticalChance?.level || 0) +
    (skills.criticalDamages?.level || 0) + (skills.armor?.level || 0) +
    (skills.precision?.level || 0) + (skills.dodge?.level || 0)
  const eco = (skills.energy?.level || 0) + (skills.companies?.level || 0) +
    (skills.entrepreneurship?.level || 0) + (skills.production?.level || 0) +
    (skills.management?.level || 0) + (skills.lootChance?.level || 0)
  const total = war + eco
  return total > 0 && war / total > 0.5 && (skills.attack?.level || 0) >= 2
}

function isInDebuff(buffs) {
  return buffs?.debuffCodes?.length > 0
}

export class DataHandler {
  constructor(forceUpdate = false) {
    this.client = getWarEraClient()
    this.forceUpdate = forceUpdate
    this.MU_CACHE = 15 * 60 * 1000
    this.USER_CACHE = 60 * 60 * 1000
  }

  updateClient() {
    this.client = getWarEraClient()
  }

  setForceUpdate(forceUpdate = false) {
    this.forceUpdate = forceUpdate
  }

  getConfiguredMUIds() {
    return [...MU_IDS]
  }

  async #setMUCache(muId, cacheKey) {
    const now = Date.now()
    const response = await this.client.mu.getById({ muId })
    const muData = response?.result?.data || response

    const formatted = {
      _id: muData._id,
      avatarUrl: muData.avatarUrl,
      name: muData.name,
      managers: muData.roles?.managers || [],
      commanders: muData.roles?.commanders || [],
      members: muData.members || [],
      activeUpgradeLevels: {
        headquarters: muData.activeUpgradeLevels?.headquarters || 0,
        dormitories: muData.activeUpgradeLevels?.dormitories || 0,
      },
      rankings: {
        muWeeklyDamages: muData.rankings?.muWeeklyDamages?.value,
        muBounty: muData.rankings?.muBounty?.value,
        muDamages: muData.rankings?.muDamages?.value,
        muTerrain: muData.rankings?.muTerrain?.value,
        muWealth: muData.rankings?.muWealth?.value,
      },
    }

    localStorage.setItem(cacheKey, JSON.stringify({ data: formatted, timestamp: now }))
    return formatted
  }

  async #getMU(muIds) {
    const apiTasks = []
    const finalResults = []
    const now = Date.now()
    const pendingRequests = new Map()

    muIds.forEach((id) => {
      const cacheKey = `mu_cache_${id}`
      const cached = localStorage.getItem(cacheKey)

      if (cached && !this.forceUpdate) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (now - timestamp < this.MU_CACHE) {
            finalResults.push({ id, objekt: data })
            return
          }
        } catch (e) {
          console.error("Cache parse error:", e)
        }
      }

      if (pendingRequests.has(id)) {
        const dup = (async () => {
          const muData = await pendingRequests.get(id)
          return { id, objekt: muData }
        })()
        apiTasks.push(dup)
        return
      }

      const fetchTask = (async () => {
        try {
          return await this.#setMUCache(id, cacheKey)
        } catch (error) {
          console.error(`Error fetching MU ${id}:`, error)
          return { _id: id, name: `Error (${id.substring(0, 4)})`, members: [] }
        }
      })()

      pendingRequests.set(id, fetchTask)

      const mainTask = (async () => {
        const muData = await fetchTask
        return { id, objekt: muData }
      })()

      apiTasks.push(mainTask)
    })

    if (apiTasks.length > 0) {
      const results = await Promise.all(apiTasks)
      finalResults.push(...results)
    }

    return finalResults.filter((e) => e !== null)
  }

  async loadAllMUs() {
    const ids = this.getConfiguredMUIds()
    if (ids.length === 0) return []

    const idToCategory = new Map()
    MU_CATEGORIES.forEach((cat) => {
      cat.ids.forEach((id) => idToCategory.set(id, cat.name))
    })

    const results = await this.#getMU(ids)

    const allMemberIds = []
    const memberSet = new Set()
    results.forEach((item) => {
      ;(item.objekt?.members || []).forEach((id) => {
        const cleanId = typeof id === "object" ? id._id || id.id : id
        if (cleanId && !memberSet.has(cleanId)) {
          memberSet.add(cleanId)
          allMemberIds.push(cleanId)
        }
      })
    })
    if (allMemberIds.length > 0) await this.#getUsers(allMemberIds)

    return results.map((item) => {
      const members = item.objekt?.members || []
      let healthSum = 0, healthCount = 0
      let hungerSum = 0, hungerCount = 0
      let warOverallSum = 0, warOverallCount = 0
      let warBuildCount = 0, ecoBuildCount = 0

      members.forEach((memberId) => {
        const cached = localStorage.getItem(`user_cache_${memberId}`)
        if (!cached) return
        try {
          const { data } = JSON.parse(cached)
          const h = data.skills?.health
          if (h?.total > 0) {
            healthSum += (h.currentBarValue / h.total) * 100
            healthCount++
          }
          const hu = data.skills?.hunger
          if (hu?.total > 0) {
            hungerSum += (hu.currentBarValue / hu.total) * 100
            hungerCount++
          }
          if (data.skills) {
            if (isWarBuild(data.skills)) warBuildCount++
            else ecoBuildCount++
          }
          if (data.isActive && isWarBuild(data.skills) && !isInDebuff(data.buffs)) {
            warOverallSum += calcOverallRaw(data.skills?.health, data.skills?.hunger)
            warOverallCount++
          }
        } catch {}
      })

      return {
        ...item,
        category: idToCategory.get(item.id) || "unknown",
        unitAvgHealthPct: healthCount > 0 ? Math.round(healthSum / healthCount) : null,
        unitAvgHungerPct: hungerCount > 0 ? Math.round(hungerSum / hungerCount) : null,
        unitAvgWarOverall: warOverallCount > 0 ? Math.round(warOverallSum / warOverallCount) : null,
        warPct: (warBuildCount + ecoBuildCount) > 0 ? Math.round((warBuildCount / (warBuildCount + ecoBuildCount)) * 100) : null,
      }
    })
  }

  async #setUserCache(userId, cacheKey) {
    const now = Date.now()
    const response = await this.client.user.getUserById({ userId })
    const userData = response?.result?.data || response

    const formatted = {
      _id: userData._id,
      username: userData.username,
      country: userData.country,
      level: userData.leveling?.level,
      isActive: userData.isActive,
      militaryRank: userData.militaryRank,
      avatarUrl: userData.avatarUrl,
      dates: userData.dates ? { lastConnectionAt: userData.dates.lastConnectionAt } : {},
      skills: userData.skills
        ? {
            energy: {
              total: userData.skills.energy?.total,
              level: userData.skills.energy?.level,
              currentBarValue: userData.skills.energy?.currentBarValue,
              hourlyBarRegen: userData.skills.energy?.hourlyBarRegen,
            },
            health: {
              total: userData.skills.health?.total,
              currentBarValue: userData.skills.health?.currentBarValue,
              hourlyBarRegen: userData.skills.health?.hourlyBarRegen,
            },
            hunger: {
              total: userData.skills.hunger?.total,
              currentBarValue: userData.skills.hunger?.currentBarValue,
              hourlyBarRegen: userData.skills.hunger?.hourlyBarRegen,
            },
            attack: {
              total: userData.skills.attack?.total,
              level: userData.skills.attack?.level,
              ammoPercent: userData.skills.attack?.ammoPercent,
              buffsPercent: userData.skills.attack?.buffsPercent,
              debuffsPercent: userData.skills.attack?.debuffsPercent,
              militaryRankPercent: userData.skills.attack?.militaryRankPercent,
            },
            companies: { total: userData.skills.companies?.total, level: userData.skills.companies?.level },
            entrepreneurship: { total: userData.skills.entrepreneurship?.total, level: userData.skills.entrepreneurship?.level },
            production: { total: userData.skills.production?.total, level: userData.skills.production?.level },
            criticalChance: { total: userData.skills.criticalChance?.total, level: userData.skills.criticalChance?.level },
            criticalDamages: { total: userData.skills.criticalDamages?.total, level: userData.skills.criticalDamages?.level },
            armor: { total: userData.skills.armor?.total, level: userData.skills.armor?.level },
            precision: { total: userData.skills.precision?.total, level: userData.skills.precision?.level },
            dodge: { total: userData.skills.dodge?.total, level: userData.skills.dodge?.level },
            lootChance: { total: userData.skills.lootChance?.total, level: userData.skills.lootChance?.level },
            management: { total: userData.skills.management?.total, level: userData.skills.management?.level },
          }
        : {},
      stats: userData.stats
        ? { damagesCount: userData.stats.damagesCount }
        : {},
      rankings: userData.rankings
        ? {
            userDamages: userData.rankings.userDamages,
            weeklyUserDamages: userData.rankings.weeklyUserDamages,
            userWealth: userData.rankings.userWealth,
            userLevel: userData.rankings.userLevel,
          }
        : {},
      buffs: userData.buffs
        ? {
            buffCodes: userData.buffs.buffCodes || [],
            buffEndAt: userData.buffs.buffEndAt || null,
            debuffCodes: userData.buffs.debuffCodes || [],
            debuffEndAt: userData.buffs.debuffEndAt || null,
          }
        : { buffCodes: [], buffEndAt: null, debuffCodes: [], debuffEndAt: null },
    }

    localStorage.setItem(cacheKey, JSON.stringify({ data: formatted, timestamp: now }))
    return formatted
  }

  async #getUsers(userIds = []) {
    const apiTasks = []
    const finalResults = []
    const now = Date.now()
    const pending = new Map()

    userIds.forEach((id) => {
      const cleanId = typeof id === "object" ? id._id || id.id : id
      if (!cleanId) return

      const cacheKey = `user_cache_${cleanId}`
      const cached = localStorage.getItem(cacheKey)

      if (cached && !this.forceUpdate) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (now - timestamp < this.USER_CACHE) {
            finalResults.push(data)
            return
          }
        } catch (e) {
          console.error("User cache parse error:", e)
        }
      }

      if (pending.has(cleanId)) {
        apiTasks.push(pending.get(cleanId))
        return
      }

      const task = (async () => {
        try {
          return await this.#setUserCache(cleanId, cacheKey)
        } catch (error) {
          console.error(`Error fetching user ${cleanId}:`, error)
          return { _id: cleanId, username: `Error (${cleanId.substring(0, 4)})`, level: 0, isActive: false }
        }
      })()

      pending.set(cleanId, task)
      apiTasks.push(task)
    })

    if (apiTasks.length > 0) {
      const results = await Promise.all(apiTasks)
      finalResults.push(...results)
    }

    return finalResults.filter((u) => u !== null)
  }

  async getMUUserData(muId) {
    if (!muId) return { managers: [], commanders: [], members: [] }

    const muResult = await this.#getMU([muId])
    if (!muResult || muResult.length === 0 || !muResult[0].objekt) {
      return { managers: [], commanders: [], members: [] }
    }

    const mu = muResult[0].objekt
    const rawManagers = mu.managers || []
    const managerIds = (Array.isArray(rawManagers) ? rawManagers : [rawManagers]).map((id) => id?.toString()).filter(Boolean)
    const commanderIds = (mu.commanders || []).map((id) => id?.toString()).filter(Boolean)
    const memberIds = (mu.members || []).map((id) => id?.toString()).filter(Boolean)

    const allIds = new Set([...managerIds, ...commanderIds, ...memberIds])
    const loaded = await this.#getUsers(Array.from(allIds))

    const userMap = new Map()
    loaded.forEach((u) => {
      if (u && u._id) userMap.set(u._id.toString(), u)
    })

    const resolveUser = (id, fallback) => {
      const existing = userMap.get(id)
      if (existing && existing.username) return existing
      return { _id: id, username: `${fallback} (${id.substring(0, 6)})`, level: 0, isActive: false }
    }

    this.setForceUpdate()
    return {
      managers: managerIds.map((id) => resolveUser(id, "Manager")),
      commanders: commanderIds.map((id) => resolveUser(id, "Commander")),
      members: memberIds.map((id) => resolveUser(id, "Member")),
    }
  }
}

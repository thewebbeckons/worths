/**
 * Integrity Check Plugin (Client-Only)
 *
 * Runs after database initialization to verify snapshot integrity.
 * Detects months with balances but missing/mismatched snapshots and auto-repairs.
 */
import { getDb, regenerateSnapshotForMonth, generateAllSnapshots } from './db.client'

/**
 * Get all unique months from balance data
 */
async function getAllBalanceMonths(): Promise<string[]> {
  const db = getDb()
  const balances = await db.balances.toArray()
  const months = new Set<string>()

  for (const balance of balances) {
    const month = balance.date.substring(0, 7)
    months.add(month)
  }

  return Array.from(months).sort()
}

/**
 * Get the last day of a month
 */
function getMonthEndDate(month: string): string {
  const parts = month.split('-').map(Number)
  const year = parts[0] ?? 2000
  const monthNum = parts[1] ?? 1
  const lastDay = new Date(year, monthNum, 0).getDate()
  return `${month}-${String(lastDay).padStart(2, '0')}`
}

/**
 * Calculate expected snapshot values for a month
 */
async function calculateExpectedSnapshot(month: string): Promise<{
  assetsTotal: number
  liabilitiesTotal: number
  netWorth: number
  categoryTotals: Map<number, number>
}> {
  const db = getDb()
  const monthEnd = getMonthEndDate(month)
  const accounts = await db.accounts.toArray()

  let assetsTotal = 0
  let liabilitiesTotal = 0
  const categoryTotals = new Map<number, number>()

  for (const account of accounts) {
    if (!account.id) continue // Skip accounts without id

    const balance = await db.balances
      .where('accountId').equals(account.id)
      .filter(b => b.date <= monthEnd)
      .last()

    if (!balance) continue

    const value = balance.value

    if (account.type === 'asset') {
      assetsTotal += value
    } else {
      // Keep the sign: positive = debt, negative = credit (overpaid)
      liabilitiesTotal += value
    }

    const categoryKey = account.categoryId
    categoryTotals.set(categoryKey, (categoryTotals.get(categoryKey) || 0) + value)
  }

  return {
    assetsTotal,
    liabilitiesTotal,
    netWorth: assetsTotal - liabilitiesTotal,
    categoryTotals
  }
}

/**
 * Compare stored snapshot with computed values
 */
async function verifySnapshot(month: string): Promise<boolean> {
  const db = getDb()
  const stored = await db.monthlySnapshots.get(month)

  if (!stored) {
    console.warn(`[integrity] Missing snapshot for month: ${month}`)
    return false
  }

  const expected = await calculateExpectedSnapshot(month)

  // Check net worth
  if (Math.abs(stored.netWorth - expected.netWorth) > 0.01) {
    console.warn(`[integrity] Net worth mismatch for ${month}: stored=${stored.netWorth}, expected=${expected.netWorth}`)
    return false
  }

  // Check category totals
  const storedCategorySnapshots = await db.categorySnapshots.where('month').equals(month).toArray()
  const storedCategoryTotals = new Map<number, number>()
  for (const cs of storedCategorySnapshots) {
    storedCategoryTotals.set(cs.categoryId, cs.total)
  }

  for (const [categoryId, expectedTotal] of expected.categoryTotals) {
    const storedTotal = storedCategoryTotals.get(categoryId)
    if (storedTotal === undefined || Math.abs(storedTotal - expectedTotal) > 0.01) {
      console.warn(`[integrity] Category ${categoryId} mismatch for ${month}: stored=${storedTotal}, expected=${expectedTotal}`)
      return false
    }
  }

  return true
}

/**
 * Run integrity check and repair corrupted snapshots
 */
async function runIntegrityCheck(): Promise<void> {
  const db = getDb()
  const months = await getAllBalanceMonths()

  if (months.length === 0) {
    console.log('[integrity] No balance data, skipping integrity check')
    return
  }

  console.log(`[integrity] Checking ${months.length} months...`)

  let repairCount = 0

  for (const month of months) {
    const isValid = await verifySnapshot(month)

    if (!isValid) {
      console.log(`[integrity] Repairing snapshot for ${month}`)
      await regenerateSnapshotForMonth(db, month)
      repairCount++
    }
  }

  if (repairCount > 0) {
    console.log(`[integrity] Repaired ${repairCount} snapshots`)
  } else {
    console.log('[integrity] All snapshots verified')
  }
}

export default defineNuxtPlugin(() => {
  // Only run on client
  if (import.meta.server) return

  // Run integrity check in background (non-blocking)
  // Use setTimeout to let the app render first
  setTimeout(async () => {
    try {
      await runIntegrityCheck()
    } catch (error) {
      console.error('[integrity] Integrity check failed:', error)

      // If integrity check fails catastrophically, try to regenerate all snapshots
      try {
        console.log('[integrity] Attempting full snapshot regeneration...')
        const db = getDb()
        await generateAllSnapshots(db)
      } catch (regenerateError) {
        console.error('[integrity] Full regeneration also failed:', regenerateError)
      }
    }
  }, 1000) // Wait 1 second before running
})

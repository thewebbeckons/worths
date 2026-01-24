/**
 * Dexie IndexedDB Database Plugin (Client-Only)
 *
 * This plugin initializes the IndexedDB database.
 * It only runs on the client.
 */
import Dexie, { type EntityTable } from 'dexie'
import type {
  DbAccount,
  DbBalance,
  DbCategory,
  DbTransaction,
  DbMonthlySnapshot,
  DbCategorySnapshot,
  DbProfile
} from '~/types/db'
import { DEFAULT_CATEGORIES } from '~/types/db'

// Database class with typed tables
class NetWorthDatabase extends Dexie {
  accounts!: EntityTable<DbAccount, 'id'>
  balances!: EntityTable<DbBalance, 'id'>
  categories!: EntityTable<DbCategory, 'id'>
  transactions!: EntityTable<DbTransaction, 'id'>
  monthlySnapshots!: EntityTable<DbMonthlySnapshot, 'month'>
  categorySnapshots!: EntityTable<DbCategorySnapshot, 'id'>
  profile!: EntityTable<DbProfile, 'id'>

  constructor() {
    super('networth-db')

    // Version 2 schema
    this.version(2).stores({
      accounts: '++id, legacyId, categoryId, type, bank',
      balances: '++id, accountId, date',
      categories: '++id, name',
      transactions: '++id, legacyId, accountId, date',
      monthlySnapshots: 'month',
      categorySnapshots: '++id, [month+categoryId], categoryId'
    })

    // Version 4 schema - simplified owner model with profile
    // This version resets the database for the new owner structure
    this.version(4).stores({
      accounts: '++id, legacyId, categoryId, type, bank, owner',
      balances: '++id, accountId, date',
      categories: '++id, name',
      transactions: '++id, legacyId, accountId, date',
      monthlySnapshots: 'month',
      categorySnapshots: '++id, [month+categoryId], categoryId',
      profile: '++id'
    })

    // Version 5 schema - add type field to categories
    this.version(5).stores({
      accounts: '++id, legacyId, categoryId, type, bank, owner',
      balances: '++id, accountId, date',
      categories: '++id, name, type',
      transactions: '++id, legacyId, accountId, date',
      monthlySnapshots: 'month',
      categorySnapshots: '++id, [month+categoryId], categoryId',
      profile: '++id'
    }).upgrade(async (tx) => {
      // Migrate existing categories to have a type
      const categories = await tx.table('categories').toArray()
      for (const cat of categories) {
        // Default existing categories to asset, except known liability names
        const liabilityNames = ['loan', 'mortgage', 'credit']
        const isLiability = liabilityNames.some(n => cat.name.toLowerCase().includes(n))
        await tx.table('categories').update(cat.id, { type: isLiability ? 'liability' : 'asset' })
      }
    })

    // Version 6 schema - add notes field to accounts
    this.version(6).stores({
      accounts: '++id, legacyId, categoryId, type, bank, owner',
      balances: '++id, accountId, date',
      categories: '++id, name, type',
      transactions: '++id, legacyId, accountId, date',
      monthlySnapshots: 'month',
      categorySnapshots: '++id, [month+categoryId], categoryId',
      profile: '++id'
    })

    // Version 7 schema - add icon and color fields to categories
    this.version(7).stores({
      accounts: '++id, legacyId, categoryId, type, bank, owner',
      balances: '++id, accountId, date',
      categories: '++id, name, type',
      transactions: '++id, legacyId, accountId, date',
      monthlySnapshots: 'month',
      categorySnapshots: '++id, [month+categoryId], categoryId',
      profile: '++id'
    }).upgrade(async (tx) => {
      // Add default icons and colors to existing categories
      const categories = await tx.table('categories').toArray()
      const defaultIcons: Record<string, { icon: string, color: string }> = {
        'property': { icon: 'lucide-home', color: 'primary' },
        'tfsa': { icon: 'lucide-leaf', color: 'success' },
        'rrsp': { icon: 'lucide-piggy-bank', color: 'warning' },
        'cash': { icon: 'lucide-wallet', color: 'neutral' },
        'crypto': { icon: 'lucide-bitcoin', color: 'secondary' },
        'investment': { icon: 'lucide-trending-up', color: 'info' },
        'mortgage': { icon: 'lucide-home', color: 'error' },
        'credit': { icon: 'lucide-credit-card', color: 'error' },
        'loan': { icon: 'lucide-hand-coins', color: 'error' }
      }

      for (const cat of categories) {
        const normalizedName = cat.name.toLowerCase()
        const defaults = defaultIcons[normalizedName]

        if (defaults) {
          await tx.table('categories').update(cat.id, {
            icon: defaults.icon,
            color: defaults.color
          })
        } else {
          // Default fallback based on type
          await tx.table('categories').update(cat.id, {
            icon: cat.type === 'asset' ? 'lucide-wallet' : 'lucide-credit-card',
            color: cat.type === 'asset' ? 'primary' : 'error'
          })
        }
      }
    })
  }
}

/**
 * Seed default categories if none exist
 */
async function seedDefaultCategories(database: NetWorthDatabase): Promise<void> {
  const existingCategories = await database.categories.count()
  if (existingCategories === 0) {
    console.log('[db.client] Seeding default categories')
    await database.categories.bulkAdd(DEFAULT_CATEGORIES.map(c => ({ ...c })))
  }
}

// Singleton database instance
let db: NetWorthDatabase | null = null

/**
 * Return the NetWorthDatabase singleton, creating it on first access.
 *
 * @returns The NetWorthDatabase singleton instance.
 */
export function getDb(): NetWorthDatabase {
  if (!db) {
    db = new NetWorthDatabase()
  }
  return db
}

/**
 * Get all unique months from balance data
 */
async function getAllMonths(database: NetWorthDatabase): Promise<string[]> {
  const balances = await database.balances.toArray()
  const months = new Set<string>()

  for (const balance of balances) {
    // Extract yyyy-mm from yyyy-mm-dd
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
 * Calculate snapshot data for a specific month
 */
async function calculateSnapshotForMonth(
  database: NetWorthDatabase,
  month: string
): Promise<{
  assetsTotal: number
  liabilitiesTotal: number
  netWorth: number
  categoryTotals: Map<number, { type: 'asset' | 'liability', total: number }>
}> {
  const monthEnd = getMonthEndDate(month)
  const accounts = await database.accounts.toArray()

  let assetsTotal = 0
  let liabilitiesTotal = 0
  const categoryTotals = new Map<number, { type: 'asset' | 'liability', total: number }>()

  for (const account of accounts) {
    if (!account.id) continue // Skip accounts without id

    // Get the latest balance for this account <= month end
    const balance = await database.balances
      .where('accountId').equals(account.id)
      .filter(b => b.date <= monthEnd)
      .last()

    if (!balance) continue

    const value = balance.value

    // Update totals based on account type
    if (account.type === 'asset') {
      assetsTotal += value
    } else {
      // Keep the sign: positive = debt, negative = credit (overpaid)
      liabilitiesTotal += value
    }

    // Update category totals
    const categoryKey = account.categoryId
    const existing = categoryTotals.get(categoryKey)
    if (existing) {
      existing.total += value
    } else {
      categoryTotals.set(categoryKey, {
        type: account.type,
        total: value
      })
    }
  }

  return {
    assetsTotal,
    liabilitiesTotal,
    netWorth: assetsTotal - liabilitiesTotal,
    categoryTotals
  }
}

/**
 * Save snapshot data for a specific month (shared helper)
 */
async function saveSnapshotData(
  database: NetWorthDatabase,
  month: string,
  data: {
    assetsTotal: number
    liabilitiesTotal: number
    netWorth: number
    categoryTotals: Map<number, { type: 'asset' | 'liability', total: number }>
  }
): Promise<void> {
  // Upsert monthly snapshot
  await database.monthlySnapshots.put({
    month,
    assetsTotal: data.assetsTotal,
    liabilitiesTotal: data.liabilitiesTotal,
    netWorth: data.netWorth,
    createdAt: new Date().toISOString()
  })

  // Delete existing category snapshots for this month
  await database.categorySnapshots.where('month').equals(month).delete()

  // Insert category snapshots
  for (const [categoryId, { type, total }] of data.categoryTotals) {
    await database.categorySnapshots.add({
      month,
      categoryId,
      type,
      total
    })
  }
}

/**
 * Generate all monthly snapshots from historical data
 */
export async function generateAllSnapshots(database: NetWorthDatabase): Promise<void> {
  const months = await getAllMonths(database)

  if (months.length === 0) {
    console.log('[db.client] No balance data found, skipping snapshot generation')
    return
  }

  console.log(`[db.client] Generating snapshots for ${months.length} months`)

  await database.transaction('rw', [
    database.monthlySnapshots,
    database.categorySnapshots,
    database.accounts,
    database.balances
  ], async () => {
    for (const month of months) {
      const data = await calculateSnapshotForMonth(database, month)
      await saveSnapshotData(database, month, data)
    }
  })

  console.log('[db.client] Snapshot generation complete')
}

/**
 * Regenerate a specific month's snapshot
 */
export async function regenerateSnapshotForMonth(
  database: NetWorthDatabase,
  month: string
): Promise<void> {
  const data = await calculateSnapshotForMonth(database, month)

  await database.transaction('rw', [
    database.monthlySnapshots,
    database.categorySnapshots
  ], async () => {
    await saveSnapshotData(database, month, data)
  })
}

export default defineNuxtPlugin(async () => {
  // Only run on client
  if (import.meta.server) return {}

  const database = getDb()

  try {
    // Open the database
    await database.open()
    // Seed default categories if this is a fresh database
    await seedDefaultCategories(database)
    console.log('[db.client] Database initialized successfully')
  } catch (error) {
    console.error('[db.client] Failed to initialize database:', error)
  }

  return {
    provide: {
      db: database
    }
  }
})

// Export types for use elsewhere
export type { NetWorthDatabase }

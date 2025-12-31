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
    DbOwner
} from '~/types/db'

// Database class with typed tables
class NetWorthDatabase extends Dexie {
    accounts!: EntityTable<DbAccount, 'id'>
    balances!: EntityTable<DbBalance, 'id'>
    categories!: EntityTable<DbCategory, 'id'>
    transactions!: EntityTable<DbTransaction, 'id'>
    monthlySnapshots!: EntityTable<DbMonthlySnapshot, 'month'>
    categorySnapshots!: EntityTable<DbCategorySnapshot, 'id'>
    owners!: EntityTable<DbOwner, 'id'>

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

        // Version 3 schema with owners table
        this.version(3).stores({
            accounts: '++id, legacyId, categoryId, type, bank, ownerId',
            owners: '++id, name'
        }).upgrade(async (trans) => {
            // Migrate existing owner strings to owners table
            const accounts = await trans.table('accounts').toArray()
            const ownerNames = [...new Set(accounts.map(a => a.owner).filter(Boolean))]

            const ownerMap = new Map<string, number>()
            for (const name of ownerNames) {
                const id = await trans.table('owners').add({ name }) as number
                ownerMap.set(name, id)
            }

            for (const account of accounts) {
                if (account.owner && ownerMap.has(account.owner)) {
                    await trans.table('accounts').update(account.id, {
                        ownerId: ownerMap.get(account.owner)
                    })
                }
            }
        })
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
            liabilitiesTotal += Math.abs(value) // Store liability as positive for calculation
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
        await database.monthlySnapshots.put({
            month,
            assetsTotal: data.assetsTotal,
            liabilitiesTotal: data.liabilitiesTotal,
            netWorth: data.netWorth,
            createdAt: new Date().toISOString()
        })

        await database.categorySnapshots.where('month').equals(month).delete()

        for (const [categoryId, { type, total }] of data.categoryTotals) {
            await database.categorySnapshots.add({
                month,
                categoryId,
                type,
                total
            })
        }
    })
}

export default defineNuxtPlugin(async () => {
    // Only run on client
    if (import.meta.server) return {}

    const database = getDb()

    try {
        // Open the database
        await database.open()
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
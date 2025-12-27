/**
 * Database Service Composable
 * 
 * Provides reactive access to the IndexedDB database and CRUD operations.
 * All operations are client-only safe.
 */
import { getDb, generateAllSnapshots } from '~/plugins/db.client'
import type {
    DbAccount,
    DbBalance,
    DbCategory,
    DbMonthlySnapshot,
    DbCategorySnapshot,
    DbOwner
} from '~/types/db'
import { isLiabilityCategory } from '~/types/db'

/**
 * Extended account type with resolved category name and latest balance
 */
export interface AccountWithDetails extends DbAccount {
    categoryName: string
    ownerName: string
    ownerAvatar?: string
    latestBalance: number
}

// Reactive state
const isReady = ref(false)
const accounts = ref<AccountWithDetails[]>([])
const categories = ref<DbCategory[]>([])
const owners = ref<DbOwner[]>([])

// Flag to track if we've initialized
let initialized = false

/**
 * Load all accounts with their category names and latest balances
 */
async function loadAccounts(): Promise<void> {
    if (import.meta.server) return

    const db = getDb()
    const allAccounts = await db.accounts.toArray()
    const allCategories = await db.categories.toArray()
    const allOwners = await db.owners.toArray()

    // Create lookup maps
    const categoryMap = new Map<number, string>()
    for (const cat of allCategories) {
        if (cat.id) categoryMap.set(cat.id, cat.name)
    }

    const ownerMap = new Map<number, { name: string, avatar?: string }>()
    for (const owner of allOwners) {
        if (owner.id) ownerMap.set(owner.id, { name: owner.name, avatar: owner.avatar })
    }

    // Load accounts with details
    const accountsWithDetails: AccountWithDetails[] = []

    for (const account of allAccounts) {
        if (!account.id) continue // Skip accounts without id

        // Get latest balance for this account
        const latestBalance = await db.balances
            .where('accountId').equals(account.id)
            .last()

        const ownerInfo = account.ownerId ? ownerMap.get(account.ownerId) : null

        accountsWithDetails.push({
            ...account,
            categoryName: categoryMap.get(account.categoryId) || 'Unknown',
            ownerName: ownerInfo ? ownerInfo.name : (account.owner || 'Unknown'),
            ownerAvatar: ownerInfo?.avatar,
            latestBalance: latestBalance?.value || 0
        })
    }

    accounts.value = accountsWithDetails
    categories.value = allCategories
    owners.value = allOwners
}

/**
 * Initialize the database composable
 */
async function initialize(): Promise<void> {
    if (import.meta.server || initialized) return

    try {
        const db = getDb()
        await db.open()
        await loadAccounts()
        isReady.value = true
        initialized = true
    } catch (error) {
        console.error('[useDatabase] Failed to initialize:', error)
    }
}

/**
 * Add a new account
 */
async function addAccount(data: {
    name: string
    bank: string
    category: string
    owner: string
    initialBalance: number
}): Promise<number | undefined> {
    if (import.meta.server) return

    const db = getDb()

    // First, create the account and balance in a transaction
    const accountId = await db.transaction('rw', [db.accounts, db.balances, db.categories, db.owners], async () => {
        // Find or create category
        let category = await db.categories.where('name').equals(data.category).first()
        let categoryId: number

        if (category && category.id) {
            categoryId = category.id
        } else {
            categoryId = await db.categories.add({ name: data.category }) as number
        }

        // Find or create owner
        let owner = await db.owners.where('name').equals(data.owner).first()
        let ownerId: number

        if (owner && owner.id) {
            ownerId = owner.id
        } else {
            ownerId = await db.owners.add({ name: data.owner }) as number
        }

        // Determine account type
        const accountType = isLiabilityCategory(data.category) ? 'liability' : 'asset'

        // Create account
        const newAccountId = await db.accounts.add({
            name: data.name,
            bank: data.bank,
            categoryId,
            owner: data.owner,
            ownerId,
            type: accountType,
            createdAt: new Date().toISOString()
        }) as number

        // Create initial balance
        await db.balances.add({
            accountId: newAccountId,
            date: new Date().toISOString().slice(0, 10),
            value: data.initialBalance
        })

        return newAccountId
    })

    // After transaction completes, reload accounts and regenerate snapshots
    await loadAccounts()
    await generateAllSnapshots(db)

    return accountId
}

/**
 * Update balance for an account
 */
async function updateBalance(accountId: number, value: number, date: string): Promise<void> {
    if (import.meta.server) return

    const db = getDb()

    await db.transaction('rw', [db.balances], async () => {
        // Check if balance for this date already exists
        const existing = await db.balances
            .where('accountId').equals(accountId)
            .filter(b => b.date === date)
            .first()

        if (existing) {
            // Update existing balance
            await db.balances.update(existing.id!, { value })
        } else {
            // Add new balance
            await db.balances.add({
                accountId,
                date,
                value
            })
        }
    })

    // Reload accounts to update latest balances
    await loadAccounts()

    // Regenerate snapshots
    await generateAllSnapshots(db)
}

/**
 * Get all balances for an account
 */
async function getAccountBalances(accountId: number): Promise<DbBalance[]> {
    if (import.meta.server) return []

    const db = getDb()
    return await db.balances
        .where('accountId').equals(accountId)
        .sortBy('date')
}

/**
 * Get monthly snapshots
 */
async function getMonthlySnapshots(): Promise<DbMonthlySnapshot[]> {
    if (import.meta.server) return []

    const db = getDb()
    return await db.monthlySnapshots.toArray()
}

/**
 * Get category snapshots for a month
 */
async function getCategorySnapshots(month: string): Promise<DbCategorySnapshot[]> {
    if (import.meta.server) return []

    const db = getDb()
    return await db.categorySnapshots.where('month').equals(month).toArray()
}

/**
 * Find account by legacy ID (for backward compatibility)
 */
async function findAccountByLegacyId(legacyId: string): Promise<DbAccount | undefined> {
    if (import.meta.server) return undefined

    const db = getDb()
    return await db.accounts.where('legacyId').equals(legacyId).first()
}

/**
 * Find account by ID
 */
async function findAccountById(id: number): Promise<AccountWithDetails | undefined> {
    if (import.meta.server) return undefined

    return accounts.value.find(a => a.id === id)
}

/**
 * Add a new owner
 */
async function addOwner(name: string, avatar?: string): Promise<number | undefined> {
    if (import.meta.server) return
    const db = getDb()
    const id = await db.owners.add({ name, avatar }) as number
    await loadAccounts()
    return id
}

/**
 * Delete an owner
 */
async function deleteOwner(ownerId: number): Promise<void> {
    if (import.meta.server) return
    const db = getDb()

    // Check if any account is using this ownerId
    const count = await db.accounts.where('ownerId').equals(ownerId).count()
    if (count > 0) {
        throw new Error('Cannot delete owner referenced by accounts')
    }

    await db.owners.delete(ownerId)
    await loadAccounts()
}

/**
 * Export database to JSON
 */
async function exportDatabase() {
    if (import.meta.server) return
    const db = getDb()

    return await db.transaction('r', [
        db.accounts, db.balances, db.categories,
        db.transactions, db.monthlySnapshots, db.categorySnapshots, db.owners
    ], async () => {
        const data = {
            accounts: await db.accounts.toArray(),
            balances: await db.balances.toArray(),
            categories: await db.categories.toArray(),
            transactions: await db.transactions.toArray(),
            snapshots: await db.monthlySnapshots.toArray(),
            categorySnapshots: await db.categorySnapshots.toArray(),
            owners: await db.owners.toArray()
        }

        return {
            version: db.verno,
            exportedAt: new Date().toISOString(),
            data
        }
    })
}

/**
 * Import database from JSON
 */
async function importDatabase(json: any) {
    if (import.meta.server) return
    const db = getDb()

    // Basic validation
    if (!json.version || !json.data) {
        throw new Error('Invalid export file format')
    }

    await db.transaction('rw', [
        db.accounts, db.balances, db.categories,
        db.transactions, db.monthlySnapshots, db.categorySnapshots, db.owners
    ], async () => {
        // Clear all tables
        await Promise.all([
            db.accounts.clear(),
            db.balances.clear(),
            db.categories.clear(),
            db.transactions.clear(),
            db.monthlySnapshots.clear(),
            db.categorySnapshots.clear(),
            db.owners.clear()
        ])

        // Add all data
        await Promise.all([
            db.accounts.bulkAdd(json.data.accounts || []),
            db.balances.bulkAdd(json.data.balances || []),
            db.categories.bulkAdd(json.data.categories || []),
            db.transactions.bulkAdd(json.data.transactions || []),
            db.monthlySnapshots.bulkAdd(json.data.snapshots || []),
            db.categorySnapshots.bulkAdd(json.data.categorySnapshots || []),
            db.owners.bulkAdd(json.data.owners || [])
        ])
    })

    // Reload state
    await loadAccounts()

    // Run integrity check (implicitly via reload and snapshot generation)
    await generateAllSnapshots(db)
}

/**
 * Reset application data
 */
async function resetDatabase() {
    if (import.meta.server) return
    const db = getDb()
    await db.delete()
    localStorage.removeItem('networth-db-migrated')
    window.location.reload()
}

export function useDatabase() {
    // Initialize on first use (client-only)
    if (import.meta.client && !initialized) {
        initialize()
    }

    return {
        // State
        isReady: readonly(isReady),
        accounts: readonly(accounts),
        categories: readonly(categories),
        owners: readonly(owners),

        // Actions
        addAccount,
        updateBalance,
        getAccountBalances,
        getMonthlySnapshots,
        getCategorySnapshots,
        findAccountByLegacyId,
        findAccountById,
        addOwner,
        deleteOwner,
        exportDatabase,
        importDatabase,
        resetDatabase,
        refresh: loadAccounts
    }
}

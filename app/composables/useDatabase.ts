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
  DbProfile,
  DbTransaction,
  OwnerType
} from '~/types/db'

/**
 * Extended account type with resolved category name and latest balance
 */
export interface AccountWithDetails extends DbAccount {
  categoryName: string
  ownerName: string
  ownerColor?: string
  latestBalance: number
}

type DatabaseExportData = {
  accounts: DbAccount[]
  balances: DbBalance[]
  categories: DbCategory[]
  transactions: DbTransaction[]
  snapshots: DbMonthlySnapshot[]
  categorySnapshots: DbCategorySnapshot[]
  profile: DbProfile[]
}

type DatabaseExport = {
  version: number
  exportedAt: string
  data: DatabaseExportData
}

function isDatabaseExport(value: unknown): value is DatabaseExport {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (typeof record.version !== 'number') return false
  if (!record.data || typeof record.data !== 'object') return false
  return true
}

/**
 * Helper to get display name for owner type
 */
function getOwnerDisplayName(owner: OwnerType, profileData: DbProfile | null): string {
  if (owner === 'me') {
    return profileData?.userName || 'Me'
  } else if (owner === 'spouse') {
    return profileData?.spouseName || 'Spouse'
  } else {
    return 'Joint'
  }
}

/**
 * Helper to get color for owner type
 */
function getOwnerColorValue(owner: OwnerType, profileData: DbProfile | null): string {
  if (owner === 'me') {
    return profileData?.userColor || 'primary'
  } else if (owner === 'spouse') {
    return profileData?.spouseColor || 'secondary'
  } else {
    return 'info' // Joint accounts get a neutral color
  }
}

// Module-level reactive state: intentional singleton pattern for shared state across components.
// This ensures all components using useDatabase() share the same reactive data.
const isReady = ref(false)
const accounts = ref<AccountWithDetails[]>([])
const categories = ref<DbCategory[]>([])
const profile = ref<DbProfile | null>(null)

// Flag to track if we've initialized
let initialized = false

/**
 * Load profile from database
 */
async function loadProfile(): Promise<DbProfile | null> {
  if (import.meta.server) return null

  const db = getDb()
  const profiles = await db.profile.toArray()
  return profiles[0] || null
}

/**
 * Load all accounts with their category names and latest balances
 */
async function loadAccounts(): Promise<void> {
  if (import.meta.server) return

  const db = getDb()
  const allAccounts = await db.accounts.toArray()
  const allCategories = await db.categories.toArray()
  const currentProfile = await loadProfile()

  // Create lookup maps
  const categoryMap = new Map<number, string>()
  for (const cat of allCategories) {
    if (cat.id) categoryMap.set(cat.id, cat.name)
  }

  // Load accounts with details
  const accountsWithDetails: AccountWithDetails[] = []

  for (const account of allAccounts) {
    if (!account.id) continue // Skip accounts without id

    // Get latest balance for this account
    const latestBalance = await db.balances
      .where('accountId').equals(account.id)
      .last()

    accountsWithDetails.push({
      ...account,
      categoryName: categoryMap.get(account.categoryId) || 'Unknown',
      ownerName: getOwnerDisplayName(account.owner, currentProfile),
      ownerColor: getOwnerColorValue(account.owner, currentProfile),
      latestBalance: latestBalance?.value || 0
    })
  }

  accounts.value = accountsWithDetails
  categories.value = allCategories
  profile.value = currentProfile
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
  owner: OwnerType
  initialBalance: number
  notes?: string
}): Promise<number | undefined> {
  if (import.meta.server) return

  const db = getDb()

  // First, create the account and balance in a transaction
  const accountId = await db.transaction('rw', [db.accounts, db.balances, db.categories], async () => {
    // Find category by name
    const category = await db.categories.where('name').equals(data.category).first()
    if (!category || !category.id) {
      throw new Error(`Category "${data.category}" not found`)
    }
    const categoryId = category.id

    // Use category's type for account type
    const accountType = category.type

    // Create account
    const newAccountId = await db.accounts.add({
      name: data.name,
      bank: data.bank,
      categoryId,
      owner: data.owner,
      type: accountType,
      createdAt: new Date().toISOString(),
      notes: data.notes
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
 * Update an account's details
 */
async function updateAccount(accountId: number, data: {
  name: string
  bank: string
  category: string
  owner: OwnerType
  notes?: string
}): Promise<void> {
  if (import.meta.server) return

  const db = getDb()

  await db.transaction('rw', [db.accounts, db.categories], async () => {
    // Find category by name
    const category = await db.categories.where('name').equals(data.category).first()
    if (!category || !category.id) {
      throw new Error(`Category "${data.category}" not found`)
    }
    const categoryId = category.id

    // Use category's type for account type
    const accountType = category.type

    // Update account
    await db.accounts.update(accountId, {
      name: data.name,
      bank: data.bank,
      categoryId,
      owner: data.owner,
      type: accountType,
      notes: data.notes
    })
  })

  // Reload accounts and regenerate snapshots
  await loadAccounts()
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
 * Update or create profile
 */
async function updateProfile(data: Partial<DbProfile>): Promise<void> {
  if (import.meta.server) return
  const db = getDb()

  const existing = await db.profile.toArray()
  if (existing.length > 0 && existing[0]?.id) {
    // Update existing profile
    await db.profile.update(existing[0].id, data)
  } else {
    // Create new profile
    await db.profile.add(data as DbProfile)
  }

  // Reload to update owner display names
  await loadAccounts()
}

/**
 * Get current profile
 */
async function getProfile(): Promise<DbProfile | null> {
  return loadProfile()
}

/**
 * Delete an account and all its balances
 */
async function deleteAccount(accountId: number): Promise<void> {
  if (import.meta.server) return
  const db = getDb()

  await db.transaction('rw', [db.accounts, db.balances], async () => {
    // Delete all balances for this account
    await db.balances.where('accountId').equals(accountId).delete()
    // Delete the account
    await db.accounts.delete(accountId)
  })

  // Reload accounts and regenerate snapshots
  await loadAccounts()
  await generateAllSnapshots(db)
}

/**
 * Add a new category
 */
async function addCategory(name: string, type: 'asset' | 'liability'): Promise<number | undefined> {
  if (import.meta.server) return
  const db = getDb()

  // Check if category with same name exists
  const existing = await db.categories.where('name').equalsIgnoreCase(name).first()
  if (existing) {
    throw new Error(`Category "${name}" already exists`)
  }

  const id = await db.categories.add({ name, type }) as number
  await loadAccounts() // Refresh categories
  return id
}

/**
 * Update an existing category
 */
async function updateCategory(id: number, name: string, type: 'asset' | 'liability'): Promise<void> {
  if (import.meta.server) return
  const db = getDb()

  // Check if another category with same name exists
  const existing = await db.categories.where('name').equalsIgnoreCase(name).first()
  if (existing && existing.id !== id) {
    throw new Error(`Category "${name}" already exists`)
  }

  await db.categories.update(id, { name, type })

  // Update all accounts using this category to reflect the new type
  const accountsWithCategory = await db.accounts.where('categoryId').equals(id).toArray()
  for (const account of accountsWithCategory) {
    await db.accounts.update(account.id!, { type })
  }

  await loadAccounts() // Refresh categories and accounts
  await generateAllSnapshots(db)
}

/**
 * Delete a category
 */
async function deleteCategory(id: number): Promise<void> {
  if (import.meta.server) return
  const db = getDb()

  // Check if any accounts use this category
  const accountsUsingCategory = await db.accounts.where('categoryId').equals(id).count()
  if (accountsUsingCategory > 0) {
    throw new Error(`Cannot delete category: ${accountsUsingCategory} account(s) are using it`)
  }

  await db.categories.delete(id)
  await loadAccounts() // Refresh categories
}

/**
 * Export database to JSON
 */
async function exportDatabase() {
  if (import.meta.server) return
  const db = getDb()

  return await db.transaction('r', [
    db.accounts, db.balances, db.categories,
    db.transactions, db.monthlySnapshots, db.categorySnapshots, db.profile
  ], async () => {
    const data = {
      accounts: await db.accounts.toArray(),
      balances: await db.balances.toArray(),
      categories: await db.categories.toArray(),
      transactions: await db.transactions.toArray(),
      snapshots: await db.monthlySnapshots.toArray(),
      categorySnapshots: await db.categorySnapshots.toArray(),
      profile: await db.profile.toArray()
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
async function importDatabase(json: unknown) {
  if (import.meta.server) return
  const db = getDb()

  // Basic validation
  if (!isDatabaseExport(json)) {
    throw new Error('Invalid export file format')
  }

  const exportData = json.data

  await db.transaction('rw', [
    db.accounts, db.balances, db.categories,
    db.transactions, db.monthlySnapshots, db.categorySnapshots, db.profile
  ], async () => {
    // Clear all tables
    await Promise.all([
      db.accounts.clear(),
      db.balances.clear(),
      db.categories.clear(),
      db.transactions.clear(),
      db.monthlySnapshots.clear(),
      db.categorySnapshots.clear(),
      db.profile.clear()
    ])

    // Add all data
    await Promise.all([
      db.accounts.bulkAdd(exportData.accounts || []),
      db.balances.bulkAdd(exportData.balances || []),
      db.categories.bulkAdd(exportData.categories || []),
      db.transactions.bulkAdd(exportData.transactions || []),
      db.monthlySnapshots.bulkAdd(exportData.snapshots || []),
      db.categorySnapshots.bulkAdd(exportData.categorySnapshots || []),
      db.profile.bulkAdd(exportData.profile || [])
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
    profile: readonly(profile),

    // Actions
    addAccount,
    updateAccount,
    updateBalance,
    getAccountBalances,
    getMonthlySnapshots,
    getCategorySnapshots,
    findAccountByLegacyId,
    findAccountById,
    updateProfile,
    getProfile,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    exportDatabase,
    importDatabase,
    resetDatabase,
    refresh: loadAccounts
  }
}

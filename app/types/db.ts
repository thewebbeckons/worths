/**
 * Database schema types for IndexedDB via Dexie
 * These types match the target database schema for the NetWorth app
 */

// Account table schema
export interface DbAccount {
    id?: number
    legacyId?: string
    name: string
    bank: string
    categoryId: number
    owner: string // Keeping for backward compatibility/migration
    ownerId?: number // New reference
    type: 'asset' | 'liability'
    createdAt: string
}

// Owner table schema
export interface DbOwner {
    id?: number
    name: string
    avatar?: string // base64 or object URL
}

// Balance table schema
export interface DbBalance {
    id?: number
    accountId: number
    date: string  // yyyy-mm-dd
    value: number
}

// Category table schema
export interface DbCategory {
    id?: number
    name: string
}

// Transaction table schema
export interface DbTransaction {
    id?: number
    legacyId?: string
    accountId: number
    date: string
    amount: number
    description: string
}

// Monthly snapshot schema (primary key: month)
export interface DbMonthlySnapshot {
    month: string  // yyyy-mm (primary key)
    assetsTotal: number
    liabilitiesTotal: number
    netWorth: number
    createdAt: string
}

// Category snapshot schema
export interface DbCategorySnapshot {
    id?: number
    month: string
    categoryId: number
    type: 'asset' | 'liability'
    total: number
}

// Legacy types from LocalStorage (used for migration)
export interface LegacyBalanceRecord {
    date: string
    value: number
}

export interface LegacyAccount {
    id: string
    name: string
    bank: string
    category: string
    owner: string
    balances: LegacyBalanceRecord[]
}

export interface LegacyTransaction {
    id: string
    accountId: string
    date: string
    amount: number
    description: string
}

// Category to type mapping for migration
export const LIABILITY_CATEGORIES = ['Loan', 'Mortgage', 'Credit Card'] as const

/**
 * Determines if a category should be treated as a liability
 */
export function isLiabilityCategory(categoryName: string): boolean {
    return LIABILITY_CATEGORIES.some(
        c => categoryName.toLowerCase().includes(c.toLowerCase())
    )
}

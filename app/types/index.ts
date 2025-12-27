/**
 * Legacy types - kept for reference
 * The application now uses types from ~/types/db.ts for IndexedDB
 */

// Re-export database types as the primary types
export type { DbAccount as Account, DbBalance as Balance, DbCategory as Category } from './db'

/**
 * Database schema types for IndexedDB via Dexie
 * These types match the target database schema for the NetWorth app
 */

// Account table schema
export interface DbAccount {
  id?: number;
  legacyId?: string;
  name: string;
  bank: string;
  categoryId: number;
  owner: "me" | "spouse" | "joint";
  type: "asset" | "liability";
  createdAt: string;
  notes?: string; // Optional markdown/HTML notes for the account
}

// Owner type for accounts
export type OwnerType = "me" | "spouse" | "joint";

// Profile table schema (single row for user settings)
export interface DbProfile {
  id?: number;
  userName?: string;
  spouseName?: string;
  userColor?: string; // Nuxt UI semantic color (primary, secondary, etc.)
  spouseColor?: string; // Nuxt UI semantic color
}

// Balance table schema
export interface DbBalance {
  id?: number;
  accountId: number;
  date: string; // yyyy-mm-dd
  value: number;
}

// Category table schema
export interface DbCategory {
  id?: number;
  name: string;
  type: "asset" | "liability";
  icon?: string; // Icon name (e.g., 'lucide-home', 'lucide-credit-card')
  color?: string; // Nuxt UI semantic color (primary, error, success, warning, info, etc.)
}

// Transaction table schema
export interface DbTransaction {
  id?: number;
  legacyId?: string;
  accountId: number;
  date: string;
  amount: number;
  description: string;
}

// Monthly snapshot schema (primary key: month)
export interface DbMonthlySnapshot {
  month: string; // yyyy-mm (primary key)
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  createdAt: string;
}

// Category snapshot schema
export interface DbCategorySnapshot {
  id?: number;
  month: string;
  categoryId: number;
  type: "asset" | "liability";
  total: number;
}

// Default categories for new databases
export const DEFAULT_CATEGORIES: Omit<DbCategory, "id">[] = [
  { name: "Property", type: "asset", icon: "lucide-home", color: "primary" },
  { name: "TFSA", type: "asset", icon: "lucide-leaf", color: "success" },
  { name: "RRSP", type: "asset", icon: "lucide-piggy-bank", color: "warning" },
  { name: "Cash", type: "asset", icon: "lucide-wallet", color: "neutral" },
  { name: "Crypto", type: "asset", icon: "lucide-bitcoin", color: "secondary" },
  { name: "Mortgage", type: "liability", icon: "lucide-home", color: "error" },
  { name: "Credit Card", type: "liability", icon: "lucide-credit-card", color: "error" },
];

/**
 * Determines if a category is a liability based on its type
 */
export function isLiabilityCategory(category: DbCategory): boolean {
  return category.type === "liability";
}

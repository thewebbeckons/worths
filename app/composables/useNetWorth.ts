/**
 * Net Worth Composable
 * 
 * Provides reactive net worth calculations using IndexedDB via useDatabase.
 * This is the primary API for UI components to access financial data.
 */
import { useDatabase } from './useDatabase'
import type { AccountWithDetails } from './useDatabase'
import type { OwnerType } from '~/types/db'

export const useNetWorth = () => {
    const {
        accounts: dbAccounts,
        isReady,
        addAccount: dbAddAccount,
        updateAccount: dbUpdateAccount,
        updateBalance: dbUpdateBalance,
        deleteAccount: dbDeleteAccount,
        getAccountBalances,
        getMonthlySnapshots
    } = useDatabase()

    // Reactive state for snapshots (loaded async)
    const monthlySnapshots = ref<{ month: string; netWorth: number; assetsTotal: number; liabilitiesTotal: number }[]>([])
    const snapshotsLoaded = ref(false)

    // Load monthly snapshots for history display
    const loadSnapshots = async () => {
        if (import.meta.server) return

        const snapshots = await getMonthlySnapshots()
        monthlySnapshots.value = snapshots
            .map(s => ({
                month: s.month,
                netWorth: s.netWorth,
                assetsTotal: s.assetsTotal,
                liabilitiesTotal: s.liabilitiesTotal
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
        snapshotsLoaded.value = true
    }

    // Trigger snapshot loading when on client
    if (import.meta.client) {
        loadSnapshots()
    }

    // Transform database accounts to UI-friendly format
    const accounts = computed(() => {
        return dbAccounts.value.map(acc => ({
            id: String(acc.id),
            name: acc.name,
            bank: acc.bank,
            category: acc.categoryName,
            owner: acc.ownerName,
            ownerColor: acc.ownerColor,
            type: acc.type,
            latestBalance: acc.latestBalance,
            notes: acc.notes
        }))
    })

    /**
     * Get full balance history for an account (async)
     */
    const getBalanceHistory = async (accountId: string | number): Promise<{ date: string; value: number }[]> => {
        const numericId = typeof accountId === 'number'
            ? accountId
            : parseInt(accountId, 10)

        if (isNaN(numericId)) return []

        const balances = await getAccountBalances(numericId)
        return balances.map(b => ({ date: b.date, value: b.value }))
    }

    /**
     * Add a new account
     */
    const addAccount = async (account: {
        name: string
        bank: string
        category: string
        owner: OwnerType
        initialBalance: number
        notes?: string
    }): Promise<void> => {
        await dbAddAccount(account)
        await loadSnapshots() // Refresh snapshots after adding
    }

    /**
     * Update balance for an account
     */
    const updateBalance = async (accountId: string, amount: number, date?: string): Promise<void> => {
        const numericId = parseInt(accountId, 10)
        if (isNaN(numericId)) {
            console.error('[useNetWorth] Invalid account ID:', accountId)
            return
        }

        const dateStr = date || new Date().toISOString().slice(0, 10)
        await dbUpdateBalance(numericId, amount, dateStr)
        await loadSnapshots() // Refresh snapshots after update
    }

    /**
     * Update account details
     */
    const updateAccount = async (accountId: string, data: {
        name: string
        bank: string
        category: string
        owner: OwnerType
        notes?: string
    }): Promise<void> => {
        const numericId = parseInt(accountId, 10)
        if (isNaN(numericId)) {
            console.error('[useNetWorth] Invalid account ID:', accountId)
            return
        }

        await dbUpdateAccount(numericId, data)
        await loadSnapshots() // Refresh snapshots after update
    }

    /**
     * Delete an account
     */
    const deleteAccount = async (accountId: string): Promise<void> => {
        const numericId = parseInt(accountId, 10)
        if (isNaN(numericId)) {
            console.error('[useNetWorth] Invalid account ID:', accountId)
            return
        }

        await dbDeleteAccount(numericId)
        await loadSnapshots() // Refresh snapshots after delete
    }

    /**
     * Get net worth history from monthly snapshots
     */
    const getNetWorthHistory = computed(() => {
        return monthlySnapshots.value.map(s => ({
            date: `${s.month}-01`, // Convert yyyy-mm to yyyy-mm-dd for chart
            value: s.netWorth
        }))
    })

    /**
     * Current net worth (latest value from accounts)
     * Assets are added, liabilities are subtracted (using absolute value)
     */
    const currentNetWorth = computed(() => {
        return dbAccounts.value.reduce((sum, acc) => {
            if (acc.type === 'liability') {
                return sum - Math.abs(acc.latestBalance)
            }
            return sum + acc.latestBalance
        }, 0)
    })

    /**
     * Monthly growth (comparing last two snapshots)
     */
    const monthlyGrowth = computed(() => {
        const snapshots = monthlySnapshots.value
        if (snapshots.length < 2) return 0

        const latest = snapshots[snapshots.length - 1]
        const previous = snapshots[snapshots.length - 2]

        if (!latest || !previous) return 0
        return latest.netWorth - previous.netWorth
    })

    /**
     * Monthly growth percentage
     */
    const monthlyGrowthPercentage = computed(() => {
        const snapshots = monthlySnapshots.value
        if (snapshots.length < 2) return 0

        const latest = snapshots[snapshots.length - 1]
        const previous = snapshots[snapshots.length - 2]

        if (!latest || !previous || previous.netWorth === 0) return 0
        return ((latest.netWorth - previous.netWorth) / Math.abs(previous.netWorth)) * 100
    })

    /**
     * Get growth for a specific period starting from a date
     * @param startDate - The start date for calculating growth
     * @returns Object containing growth amount and percentage
     */
    const getGrowthForPeriod = (startDate: Date | null) => {
        const snapshots = monthlySnapshots.value
        if (snapshots.length === 0) return { growth: 0, percentage: 0 }

        // Get current net worth (latest snapshot or current calculated)
        const latestSnapshot = snapshots[snapshots.length - 1]
        const currentValue = latestSnapshot?.netWorth ?? currentNetWorth.value

        // If no start date (All Time), use first snapshot
        if (!startDate) {
            const firstSnapshot = snapshots[0]
            if (!firstSnapshot || snapshots.length < 2) return { growth: 0, percentage: 0 }
            const growth = currentValue - firstSnapshot.netWorth
            const percentage = firstSnapshot.netWorth !== 0
                ? (growth / Math.abs(firstSnapshot.netWorth)) * 100
                : 0
            return { growth, percentage }
        }

        // Find snapshot closest to or after start date
        const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`

        // Find the first snapshot >= startMonth
        let startSnapshot = snapshots.find(s => s.month >= startMonth)

        // If no snapshot found at or after start date, use first available
        if (!startSnapshot) {
            startSnapshot = snapshots[0]
        }

        if (!startSnapshot) return { growth: 0, percentage: 0 }

        const growth = currentValue - startSnapshot.netWorth
        const percentage = startSnapshot.netWorth !== 0
            ? (growth / Math.abs(startSnapshot.netWorth)) * 100
            : 0

        return { growth, percentage }
    }

    /**
     * Get assets growth for a specific period starting from a date
     * @param startDate - The start date for calculating growth
     * @returns Object containing growth amount and percentage
     */
    const getAssetsGrowthForPeriod = (startDate: Date | null) => {
        const snapshots = monthlySnapshots.value
        if (snapshots.length === 0) return { growth: 0, percentage: 0 }

        const latestSnapshot = snapshots[snapshots.length - 1]
        const currentValue = latestSnapshot?.assetsTotal ?? totalAssets.value

        if (!startDate) {
            const firstSnapshot = snapshots[0]
            if (!firstSnapshot || snapshots.length < 2) return { growth: 0, percentage: 0 }
            const growth = currentValue - firstSnapshot.assetsTotal
            const percentage = firstSnapshot.assetsTotal !== 0
                ? (growth / Math.abs(firstSnapshot.assetsTotal)) * 100
                : 0
            return { growth, percentage }
        }

        const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
        let startSnapshot = snapshots.find(s => s.month >= startMonth)
        if (!startSnapshot) startSnapshot = snapshots[0]
        if (!startSnapshot) return { growth: 0, percentage: 0 }

        const growth = currentValue - startSnapshot.assetsTotal
        const percentage = startSnapshot.assetsTotal !== 0
            ? (growth / Math.abs(startSnapshot.assetsTotal)) * 100
            : 0

        return { growth, percentage }
    }

    /**
     * Get liabilities growth for a specific period starting from a date
     * @param startDate - The start date for calculating growth
     * @returns Object containing growth amount and percentage
     */
    const getLiabilitiesGrowthForPeriod = (startDate: Date | null) => {
        const snapshots = monthlySnapshots.value
        if (snapshots.length === 0) return { growth: 0, percentage: 0 }

        const latestSnapshot = snapshots[snapshots.length - 1]
        const currentValue = latestSnapshot?.liabilitiesTotal ?? totalLiabilities.value

        if (!startDate) {
            const firstSnapshot = snapshots[0]
            if (!firstSnapshot || snapshots.length < 2) return { growth: 0, percentage: 0 }
            const growth = currentValue - firstSnapshot.liabilitiesTotal
            const percentage = firstSnapshot.liabilitiesTotal !== 0
                ? (growth / Math.abs(firstSnapshot.liabilitiesTotal)) * 100
                : 0
            return { growth, percentage }
        }

        const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
        let startSnapshot = snapshots.find(s => s.month >= startMonth)
        if (!startSnapshot) startSnapshot = snapshots[0]
        if (!startSnapshot) return { growth: 0, percentage: 0 }

        const growth = currentValue - startSnapshot.liabilitiesTotal
        const percentage = startSnapshot.liabilitiesTotal !== 0
            ? (growth / Math.abs(startSnapshot.liabilitiesTotal)) * 100
            : 0

        return { growth, percentage }
    }

    /**
     * Get filtered net worth history based on start date
     */
    const getFilteredHistory = (startDate: Date | null) => {
        const history = getNetWorthHistory.value
        if (!startDate) return history

        const startStr = startDate.toISOString().slice(0, 10)
        return history.filter(item => item.date >= startStr)
    }

    /**
     * Get accounts grouped by a property
     */
    const getGroupedBreakdown = (groupBy: 'category' | 'owner') => {
        const groups: Record<string, number> = {}

        for (const acc of dbAccounts.value) {
            const key = groupBy === 'category' ? acc.categoryName : acc.owner
            groups[key] = (groups[key] || 0) + acc.latestBalance
        }

        return Object.entries(groups).map(([name, value]) => ({ name, value }))
    }

    /**
     * Get asset categories breakdown formatted for CategoryDistribution chart
     * Only includes asset accounts, grouped by category
     */
    const getAssetCategoryBreakdown = computed(() => {
        const assetAccounts = dbAccounts.value.filter(acc => acc.type === 'asset')
        const totalAssetValue = assetAccounts.reduce((sum, acc) => sum + acc.latestBalance, 0)

        // Group by category
        const groups: Record<string, number> = {}
        for (const acc of assetAccounts) {
            groups[acc.categoryName] = (groups[acc.categoryName] || 0) + acc.latestBalance
        }

        // Colors for the chart - modern, vibrant palette
        const colors = ['#6366f1', '#22d3ee', '#10b981', '#f59e42', '#ec4899', '#8b5cf6', '#f97316']

        // Convert to CategoryDistribution format
        return Object.entries(groups)
            .filter(([_, value]) => value > 0)
            .sort((a, b) => b[1] - a[1]) // Sort by value descending
            .map(([label, value], index) => ({
                label,
                value,
                percentage: totalAssetValue > 0 ? (value / totalAssetValue) * 100 : 0,
                color: colors[index % colors.length]
            }))
    })

    /**
     * Get accounts grouped by category for either assets or liabilities
     * Returns an array of category groups with their accounts and totals
     */
    const getAccountsGroupedByCategory = (type: 'asset' | 'liability') => {
        const filteredAccounts = dbAccounts.value.filter(acc => acc.type === type)

        // Group by category
        const groups: Record<string, { accounts: typeof filteredAccounts; total: number }> = {}

        for (const acc of filteredAccounts) {
            if (!groups[acc.categoryName]) {
                groups[acc.categoryName] = { accounts: [], total: 0 }
            }
            groups[acc.categoryName]!.accounts.push(acc)
            groups[acc.categoryName]!.total += Math.abs(acc.latestBalance)
        }

        // Convert to array and sort by total descending
        return Object.entries(groups)
            .map(([category, data]) => ({
                category,
                accounts: data.accounts.map(acc => ({
                    id: String(acc.id),
                    name: acc.name,
                    owner: acc.ownerName,
                    ownerColor: acc.ownerColor,
                    bank: acc.bank,
                    balance: acc.latestBalance
                })),
                total: data.total
            }))
            .sort((a, b) => b.total - a.total)
    }

    /**
     * Get total assets
     */
    const totalAssets = computed(() => {
        return dbAccounts.value
            .filter(acc => acc.type === 'asset')
            .reduce((sum, acc) => sum + acc.latestBalance, 0)
    })

    /**
     * Get total liabilities
     */
    const totalLiabilities = computed(() => {
        return dbAccounts.value
            .filter(acc => acc.type === 'liability')
            .reduce((sum, acc) => sum + Math.abs(acc.latestBalance), 0)
    })

    return {
        // State
        accounts,
        isReady,
        snapshotsLoaded,
        monthlySnapshots,

        // Computed
        getNetWorthHistory,
        currentNetWorth,
        monthlyGrowth,
        monthlyGrowthPercentage,
        totalAssets,
        totalLiabilities,
        getAssetCategoryBreakdown,
        getAccountsGroupedByCategory,

        // Actions
        addAccount,
        updateAccount,
        updateBalance,
        deleteAccount,
        getBalanceHistory,
        getGroupedBreakdown,
        getGrowthForPeriod,
        getAssetsGrowthForPeriod,
        getLiabilitiesGrowthForPeriod,
        getFilteredHistory,
        refreshSnapshots: loadSnapshots
    }
}

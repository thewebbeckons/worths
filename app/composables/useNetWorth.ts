/**
 * Net Worth Composable
 * 
 * Provides reactive net worth calculations using IndexedDB via useDatabase.
 * This is the primary API for UI components to access financial data.
 */
import { useDatabase } from './useDatabase'
import type { AccountWithDetails } from './useDatabase'

export const useNetWorth = () => {
    const {
        accounts: dbAccounts,
        isReady,
        addAccount: dbAddAccount,
        updateBalance: dbUpdateBalance,
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
            ownerAvatar: acc.ownerAvatar,
            type: acc.type,
            latestBalance: acc.latestBalance
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
        owner: string
        initialBalance: number
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
     */
    const currentNetWorth = computed(() => {
        return dbAccounts.value.reduce((sum, acc) => sum + acc.latestBalance, 0)
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
        totalAssets,
        totalLiabilities,

        // Actions
        addAccount,
        updateBalance,
        getBalanceHistory,
        getGroupedBreakdown,
        refreshSnapshots: loadSnapshots
    }
}

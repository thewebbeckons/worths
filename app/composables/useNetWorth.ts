/**
 * Net Worth Composable
 *
 * Provides reactive net worth calculations using IndexedDB via useDatabase.
 * This is the primary API for UI components to access financial data.
 *
 * This composable acts as a facade, re-exporting functionality from:
 * - useSnapshots: Monthly snapshot management
 * - useGrowth: Growth calculations
 * - useAccounts: Account CRUD operations
 */
import { useDatabase } from './useDatabase'
import { useSnapshots } from './useSnapshots'
import { useGrowth } from './useGrowth'
import { useAccounts } from './useAccounts'

export const useNetWorth = () => {
  const { accounts: dbAccounts, isReady } = useDatabase()

  // Import from split composables
  const {
    monthlySnapshots,
    snapshotsLoaded,
    getNetWorthHistory,
    loadSnapshots,
    getFilteredHistory
  } = useSnapshots()

  const {
    getGrowthForPeriod: growthForPeriod,
    getAssetsGrowthForPeriod: assetsGrowthForPeriod,
    getLiabilitiesGrowthForPeriod: liabilitiesGrowthForPeriod
  } = useGrowth()

  const {
    addAccount,
    updateAccount,
    updateBalance,
    deleteAccount,
    getBalanceHistory
  } = useAccounts()

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
   * Current net worth (latest value from accounts)
   * Assets are added, liabilities are subtracted
   */
  const currentNetWorth = computed(() => {
    return dbAccounts.value.reduce((sum, acc) => {
      if (acc.type === 'liability') {
        return sum - acc.latestBalance
      }
      return sum + acc.latestBalance
    }, 0)
  })

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
      .reduce((sum, acc) => sum + acc.latestBalance, 0)
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

  // Wrapper functions to match the original API signatures
  const getGrowthForPeriod = (startDate: Date | null) => {
    return growthForPeriod(startDate, currentNetWorth.value)
  }

  const getAssetsGrowthForPeriod = (startDate: Date | null) => {
    return assetsGrowthForPeriod(startDate, totalAssets.value)
  }

  const getLiabilitiesGrowthForPeriod = (startDate: Date | null) => {
    return liabilitiesGrowthForPeriod(startDate, totalLiabilities.value)
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
   */
  const getAssetCategoryBreakdown = computed(() => {
    const assetAccounts = dbAccounts.value.filter(acc => acc.type === 'asset')
    const totalAssetValue = assetAccounts.reduce((sum, acc) => sum + acc.latestBalance, 0)

    // Group by category
    const groups: Record<string, number> = {}
    for (const acc of assetAccounts) {
      groups[acc.categoryName] = (groups[acc.categoryName] || 0) + acc.latestBalance
    }

    // Colors for the chart
    const colors = ['#6366f1', '#22d3ee', '#10b981', '#f59e42', '#ec4899', '#8b5cf6', '#f97316']

    return Object.entries(groups)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], index) => ({
        label,
        value,
        percentage: totalAssetValue > 0 ? (value / totalAssetValue) * 100 : 0,
        color: colors[index % colors.length]
      }))
  })

  /**
   * Get accounts grouped by category for either assets or liabilities
   */
  const getAccountsGroupedByCategory = (type: 'asset' | 'liability') => {
    const filteredAccounts = dbAccounts.value.filter(acc => acc.type === type)

    const groups: Record<string, { accounts: typeof filteredAccounts, total: number, icon?: string, color?: string }> = {}

    for (const acc of filteredAccounts) {
      if (!groups[acc.categoryName]) {
        groups[acc.categoryName] = {
          accounts: [],
          total: 0,
          icon: acc.categoryIcon,
          color: acc.categoryColor
        }
      }
      groups[acc.categoryName]!.accounts.push(acc)
      groups[acc.categoryName]!.total += acc.latestBalance
    }

    return Object.entries(groups)
      .map(([category, data]) => ({
        category,
        icon: data.icon,
        color: data.color,
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

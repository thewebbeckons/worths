/**
 * Snapshots Composable
 *
 * Manages monthly snapshot data for net worth history tracking.
 * Provides reactive state and methods for loading/filtering historical data.
 */
import { useDatabase } from './useDatabase'

export interface MonthlySnapshotData {
  month: string
  netWorth: number
  assetsTotal: number
  liabilitiesTotal: number
}

// Module-level state: intentional singleton pattern for shared reactive state
const monthlySnapshots = ref<MonthlySnapshotData[]>([])
const snapshotsLoaded = ref(false)
let snapshotsInitialized = false

export function useSnapshots() {
  const { getMonthlySnapshots } = useDatabase()

  /**
   * Load monthly snapshots from the database
   */
  async function loadSnapshots(): Promise<void> {
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

  // Trigger snapshot loading on first use (client only)
  if (import.meta.client && !snapshotsInitialized) {
    snapshotsInitialized = true
    loadSnapshots()
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
   * Get filtered net worth history based on start date
   */
  function getFilteredHistory(startDate: Date | null): { date: string, value: number }[] {
    const history = getNetWorthHistory.value
    if (!startDate) return history

    const startStr = startDate.toISOString().slice(0, 10)
    return history.filter(item => item.date >= startStr)
  }

  return {
    // State
    monthlySnapshots: readonly(monthlySnapshots),
    snapshotsLoaded: readonly(snapshotsLoaded),

    // Computed
    getNetWorthHistory,

    // Actions
    loadSnapshots,
    getFilteredHistory
  }
}

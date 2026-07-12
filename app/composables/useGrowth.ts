/**
 * Growth Calculations Composable
 *
 * Provides growth calculation logic for net worth, assets, and liabilities.
 * Consolidates the previously duplicated growth functions into a single generic implementation.
 */
import { useSnapshots, type MonthlySnapshotData } from './useSnapshots'

export interface GrowthResult {
  growth: number
  percentage: number
}

export interface QuarterlyGrowth {
  label: string
  year: number
  quarter: number
  growth: number
  percentage: number
  startNetWorth: number
  endNetWorth: number
}

type ValueKey = 'netWorth' | 'assetsTotal' | 'liabilitiesTotal'

function parseMonth(month: string): { year: number, month: number } {
  const [year, m] = month.split('-').map(Number)
  return { year: year!, month: m! }
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function getQuarter(month: number): number {
  return Math.floor((month - 1) / 3) + 1
}

function getLastMonthOfQuarter(year: number, quarter: number): { year: number, month: number } {
  return { year, month: quarter * 3 }
}

function getPreviousQuarterLastMonth(year: number, quarter: number): { year: number, month: number } {
  if (quarter === 1) {
    return { year: year - 1, month: 12 }
  }
  return { year, month: (quarter - 1) * 3 }
}

function findSnapshotAtOrBefore(month: string, snapshots: readonly MonthlySnapshotData[]): MonthlySnapshotData | undefined {
  let result: MonthlySnapshotData | undefined
  for (const snapshot of snapshots) {
    if (snapshot.month <= month) {
      result = snapshot
    } else {
      break
    }
  }
  return result
}

export function useGrowth() {
  const { monthlySnapshots } = useSnapshots()

  /**
   * Generic growth calculation for any value type
   * @param startDate - The start date for calculating growth (null = all time)
   * @param valueKey - Which value to calculate growth for
   * @param currentValue - The current value to compare against
   */
  function calculateGrowth(
    startDate: Date | null,
    valueKey: ValueKey,
    currentValue: number
  ): GrowthResult {
    const snapshots = monthlySnapshots.value
    if (snapshots.length === 0) return { growth: 0, percentage: 0 }

    // Get the latest snapshot value or use provided current value
    const latestSnapshot = snapshots[snapshots.length - 1]
    const current = latestSnapshot?.[valueKey] ?? currentValue

    // If no start date (All Time), use first snapshot
    if (!startDate) {
      const firstSnapshot = snapshots[0]
      if (!firstSnapshot || snapshots.length < 2) return { growth: 0, percentage: 0 }

      const startValue = firstSnapshot[valueKey]
      const growth = current - startValue
      const percentage = startValue !== 0
        ? (growth / Math.abs(startValue)) * 100
        : 0
      return { growth, percentage }
    }

    // Find snapshot closest to or after start date
    const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`

    // Find the first snapshot >= startMonth
    let startSnapshot: MonthlySnapshotData | undefined = snapshots.find(s => s.month >= startMonth)

    // If no snapshot found at or after start date, use first available
    if (!startSnapshot) {
      startSnapshot = snapshots[0]
    }

    if (!startSnapshot) return { growth: 0, percentage: 0 }

    const startValue = startSnapshot[valueKey]
    const growth = current - startValue
    const percentage = startValue !== 0
      ? (growth / Math.abs(startValue)) * 100
      : 0

    return { growth, percentage }
  }

  /**
   * Get net worth growth for a specific period
   * @param startDate - The start date for calculating growth (null = all time)
   * @param currentNetWorth - The current net worth value
   */
  function getGrowthForPeriod(startDate: Date | null, currentNetWorth: number = 0): GrowthResult {
    return calculateGrowth(startDate, 'netWorth', currentNetWorth)
  }

  /**
   * Get assets growth for a specific period
   * @param startDate - The start date for calculating growth (null = all time)
   * @param currentAssets - The current total assets value
   */
  function getAssetsGrowthForPeriod(startDate: Date | null, currentAssets: number = 0): GrowthResult {
    return calculateGrowth(startDate, 'assetsTotal', currentAssets)
  }

  /**
   * Get liabilities growth for a specific period
   * @param startDate - The start date for calculating growth (null = all time)
   * @param currentLiabilities - The current total liabilities value
   */
  function getLiabilitiesGrowthForPeriod(startDate: Date | null, currentLiabilities: number = 0): GrowthResult {
    return calculateGrowth(startDate, 'liabilitiesTotal', currentLiabilities)
  }

  /**
   * Get quarter-over-quarter net worth growth for the trailing quarters.
   * @param quarterCount - Number of quarters to return (default 4)
   */
  function getQuarterlyGrowth(quarterCount: number = 4): QuarterlyGrowth[] {
    const snapshots = monthlySnapshots.value
    if (snapshots.length === 0) return []

    const latestSnapshot = snapshots[snapshots.length - 1]
    if (!latestSnapshot) return []

    const { year: latestYear, month: latestMonth } = parseMonth(latestSnapshot.month)
    let currentYear = latestYear
    let currentQuarter = getQuarter(latestMonth)

    const result: QuarterlyGrowth[] = []

    while (result.length < quarterCount) {
      // For the most recent quarter, end at the latest snapshot month (may be partial)
      const isCurrentQuarter = result.length === 0
      const endMonthInfo = getLastMonthOfQuarter(currentYear, currentQuarter)
      const endMonth = isCurrentQuarter
        ? formatMonth(latestYear, latestMonth)
        : formatMonth(endMonthInfo.year, endMonthInfo.month)

      const endSnapshot = findSnapshotAtOrBefore(endMonth, snapshots)

      const prevQuarterInfo = getPreviousQuarterLastMonth(currentYear, currentQuarter)
      const startMonth = formatMonth(prevQuarterInfo.year, prevQuarterInfo.month)
      const startSnapshot = findSnapshotAtOrBefore(startMonth, snapshots)

      if (endSnapshot && startSnapshot) {
        const growth = endSnapshot.netWorth - startSnapshot.netWorth
        const percentage = startSnapshot.netWorth !== 0
          ? (growth / Math.abs(startSnapshot.netWorth)) * 100
          : 0

        result.push({
          label: `Q${currentQuarter} ${currentYear}`,
          year: currentYear,
          quarter: currentQuarter,
          growth,
          percentage,
          startNetWorth: startSnapshot.netWorth,
          endNetWorth: endSnapshot.netWorth
        })
      }

      // Move to previous quarter
      const prev = getPreviousQuarterLastMonth(currentYear, currentQuarter)
      currentYear = prev.year
      currentQuarter = getQuarter(prev.month)

      // Safety break to avoid infinite loop with malformed data
      if (currentYear < 1900) break
    }

    return result
  }

  return {
    calculateGrowth,
    getGrowthForPeriod,
    getAssetsGrowthForPeriod,
    getLiabilitiesGrowthForPeriod,
    getQuarterlyGrowth
  }
}

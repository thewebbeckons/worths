<script setup lang="ts">
import { AreaChart } from 'vue-chrts'

interface PeriodGrowth {
  growth: number
  percentage: number
}

const props = defineProps<{
  currentNetWorth: number
  totalAssets: number
  totalLiabilities: number
  periodGrowth: PeriodGrowth
  startDate?: Date | null
}>()

const { monthlySnapshots } = useNetWorth()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// Parse date string as local date to avoid timezone offset issues
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year!, month! - 1, day || 1)
}

// Transform snapshots for the chart
const chartData = computed(() => {
  let snapshots = monthlySnapshots.value
  
  // Filter by start date if provided
  if (props.startDate) {
    const startMonth = `${props.startDate.getFullYear()}-${String(props.startDate.getMonth() + 1).padStart(2, '0')}`
    snapshots = snapshots.filter(s => s.month >= startMonth)
  }
  
  return snapshots.map(s => ({
    date: new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(parseLocalDate(`${s.month}-01`)),
    netWorth: s.netWorth,
    assets: s.assetsTotal,
    liabilities: s.liabilitiesTotal
  }))
})

const categories = {
  assets: {
    name: 'Assets',
    color: '#22c55e' // Green
  },
  liabilities: {
    name: 'Liabilities', 
    color: '#ef4444' // Red
  }
} as any

const xFormatter = (tick: number, i?: number) => {
  if (typeof i === 'number' && chartData.value[i]) {
    return chartData.value[i].date
  }
  return ''
}

const yFormatter = (tick: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short'
  }).format(tick)
}
</script>

<template>
  <UCard class="md:w-1/2 relative overflow-hidden" variant="soft">
    <div class="relative flex flex-col h-full">
      <!-- Top Section: Net Worth + Growth Indicator -->
      <div class="mb-4">
        <div class="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Net Worth</div>
        <div class="text-3xl font-bold text-neutral-900 dark:text-white">
          {{ formatCurrency(currentNetWorth) }}
        </div>
        
        <!-- Growth Indicator (Below Net Worth) -->
        <div 
          v-if="periodGrowth.growth !== 0" 
          class="flex items-center gap-1.5 mt-1 text-sm font-medium"
          :class="periodGrowth.growth >= 0 ? 'text-green-500' : 'text-red-500'"
        >
          <UIcon 
            :name="periodGrowth.growth >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" 
            class="w-4 h-4" 
          />
          <span>{{ periodGrowth.growth >= 0 ? '+' : '' }}{{ formatCurrency(periodGrowth.growth) }}</span>
          <span class="opacity-70">({{ periodGrowth.growth >= 0 ? '+' : '' }}{{ periodGrowth.percentage.toFixed(1) }}%)</span>
        </div>
      </div>

      <!-- Chart Section -->
      <div v-if="chartData.length > 1" class="flex-1 -mx-2 mb-4">
        <AreaChart
          :data="chartData"
          :categories="categories"
          :x-formatter="xFormatter"
          :y-formatter="yFormatter"
          :show-tooltip="true"
          :height="160"
          :show-x-axis="true"
          :show-y-axis="false"
          :show-grid-lines="false"
        />
      </div>
      <div v-else class="flex-1 flex items-center justify-center text-neutral-400 text-sm py-8">
        Not enough data to display chart
      </div>

      <!-- Bottom Section: Assets & Liabilities Side by Side -->
      <div class="flex gap-6 pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <!-- Assets -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Assets</span>
          </div>
          <div class="text-lg font-semibold text-green-500">
            {{ formatCurrency(totalAssets) }}
          </div>
        </div>

        <!-- Liabilities -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="w-2 h-2 rounded-full bg-red-500" />
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Liabilities</span>
          </div>
          <div class="text-lg font-semibold text-red-500">
            {{ formatCurrency(totalLiabilities) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

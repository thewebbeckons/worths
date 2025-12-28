<script setup lang="ts">
import { AreaChart } from 'vue-chrts'

const props = defineProps<{
  balanceHistory: { date: string; value: number }[]
  accountType?: 'asset' | 'liability'
}>()

// Parse date string as local date to avoid timezone offset issues
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year!, month! - 1, day || 1)
}

const data = computed(() => {
  return props.balanceHistory.map(item => ({
    ...item,
    date: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(parseLocalDate(item.date))
  }))
})

const categories = computed(() => ({
  value: {
    name: 'Balance',
    color: props.accountType === 'liability' ? '#ef4444' : '#10b981' // Red for liability, green for asset
  }
} as any))

const xFormatter = (tick: number, i?: number) => {
  if (typeof i === 'number' && data.value[i]) {
    return data.value[i].date // Date is already formatted
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
  <div class="w-full bg-primary/5 rounded-lg p-4">
    <div v-if="data.length > 0" class="h-full">
      <AreaChart
        :data="data"
        :categories="categories"
        :x-formatter="xFormatter"
        :y-formatter="yFormatter"
        :show-tooltip="true"
        :legend-position="LegendPosition.TopRight"
        :height="250"
      />
    </div>
    <div v-else class="h-full flex items-center justify-center text-gray-500 py-8">
      No balance history available
    </div>
  </div>
</template>

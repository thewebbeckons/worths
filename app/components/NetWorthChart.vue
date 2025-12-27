<script setup lang="ts">
import { AreaChart } from 'vue-chrts'

const { getNetWorthHistory } = useNetWorth()

const data = computed(() => getNetWorthHistory.value.map(item => ({
  ...item,
  date: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(item.date))
})))

const categories = {
  value: {
    name: 'Net Worth',
    color: '#3b82f6' // Emerald 500
  }
} as any

const xFormatter = (tick: number, i?: number) => {
  if (typeof i === 'number' && data.value[i]) {
    const date = new Date(data.value[i].date)
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
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

const formatTooltipCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
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
        :height="300"
      />
    </div>
    <div v-else class="h-full flex items-center justify-center text-gray-500">
      No data available
    </div>
  </div>
</template>

<script setup lang="ts">
interface PeriodGrowth {
  growth: number
  percentage: number
}

defineProps<{
  currentNetWorth: number
  totalAssets: number
  totalLiabilities: number
  periodGrowth: PeriodGrowth
}>()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
</script>

<template>
  <UCard class="md:w-1/2">
    <div class="flex">
      <!-- Net Worth Section (Left) -->
      <div class="flex-1 space-y-2 pr-6 border-r border-neutral-200 dark:border-neutral-700">
        <div class="text-lg font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Net Worth</div>
        <div class="text-3xl font-bold text-neutral-900 dark:text-white">
          {{ formatCurrency(currentNetWorth) }}
        </div>
        <div v-if="periodGrowth.growth !== 0" class="flex items-center text-sm font-medium" :class="periodGrowth.growth >= 0 ? 'text-green-500' : 'text-red-500'">
          <UIcon :name="periodGrowth.growth >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="mr-1 w-4 h-4" />
          <span>{{ periodGrowth.growth >= 0 ? '+' : '' }}{{ formatCurrency(periodGrowth.growth) }}</span>
          <span class="ml-1">({{ periodGrowth.growth >= 0 ? '+' : '' }}{{ periodGrowth.percentage.toFixed(2) }}%)</span>
        </div>
      </div>

      <!-- Assets & Liabilities Section (Right, Stacked) -->
      <div class="flex-1 pl-6 space-y-4">
        <!-- Assets -->
        <div class="flex justify-between items-center">
          <div class="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Assets</div>
          <div class="text-lg font-semibold" :class="totalAssets > 0 ? 'text-success' : 'text-error'">
            {{ formatCurrency(totalAssets) }}
          </div>
        </div>

        <!-- Liabilities -->
        <div class="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-700 pt-4">
          <div class="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Liabilities</div>
          <div class="text-lg font-semibold" :class="totalLiabilities < 0 ? 'text-success' : 'text-error'">
            {{ formatCurrency(totalLiabilities) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

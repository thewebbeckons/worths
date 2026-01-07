<script setup lang="ts">
const { getAssetCategoryBreakdown, totalAssets } = useNetWorth()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

// Get the maximum value to calculate relative bar widths
const maxValue = computed(() => {
  if (getAssetCategoryBreakdown.value.length === 0) return 0
  return Math.max(...getAssetCategoryBreakdown.value.map(c => c.value))
})
</script>

<template>
  <UCard class="md:w-1/2" variant="soft">
    <div class="space-y-4">
      <div class="flex items-baseline justify-between gap-3">
        <div class="text-lg font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Asset Breakdown</div>
        <p class="text-sm text-muted font-bold">Total Assets: {{ formatCompactCurrency(totalAssets) }}</p>
      </div>
      
      <!-- Horizontal Bar Chart -->
      <div 
        v-if="getAssetCategoryBreakdown.length > 0"
        class="space-y-3"
      >
        <div
          v-for="category in getAssetCategoryBreakdown"
          :key="category.label"
          class="group"
        >
          <!-- Category Label Row -->
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ category.label }}
            </span>
            <span class="text-sm font-bold text-neutral-500 dark:text-neutral-400">
              {{ formatCompactCurrency(category.value) }}
            </span>
          </div>
          
          <!-- Bar Row with percentage at the end -->
          <div class="flex items-center gap-1.5">
            <!-- Bar Fill -->
            <div
              class="h-5 rounded-md transition-all duration-500 ease-out"
              :style="{
                width: `${maxValue > 0 ? (category.value / maxValue) * 100 : 0}%`,
                backgroundColor: category.color,
                minWidth: category.value > 0 ? '8px' : '0'
              }"
            />
            
            <!-- Percentage attached to end of bar -->
            <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              {{ category.percentage.toFixed(0) }}%
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-neutral-500 dark:text-neutral-400 text-center py-8">
        No asset accounts found
      </div>
    </div>
  </UCard>
</template>

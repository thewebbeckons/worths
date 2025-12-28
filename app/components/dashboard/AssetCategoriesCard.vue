<script setup lang="ts">
const { getAssetCategoryBreakdown, totalAssets } = useNetWorth()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <UCard class="md:w-1/2">
    <div class="space-y-4">
      <div class="flex items-baseline gap-3">
        <div class="text-lg font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Asset Breakdown</div>
        <!-- <span class="text-xl font-bold text-neutral-900 dark:text-white">
          {{ formatCurrency(totalAssets) }}
        </span> -->
      </div>
      
      <!-- Segmented Progress Bar -->
      <div 
        v-if="getAssetCategoryBreakdown.length > 0"
        class="flex gap-1 h-3 rounded-full overflow-hidden"
      >
        <UTooltip
          v-for="(category, index) in getAssetCategoryBreakdown"
          :key="category.label"
          :text="`${category.label}: ${formatCurrency(category.value)} (${category.percentage.toFixed(1)}%)`"
          :delay-duration="0"
          :style="{
            width: `${category.percentage}%`,
            minWidth: category.percentage > 0 ? '4px' : '0'
          }"
          class="h-full"
        >
          <div
            class="h-full w-full rounded-full transition-all duration-300 cursor-default"
            :style="{
              backgroundColor: category.color
            }"
          />
        </UTooltip>
      </div>

      <!-- Legend -->
      <div 
        v-if="getAssetCategoryBreakdown.length > 0"
        class="flex flex-wrap gap-x-6 gap-y-2 mt-4"
      >
        <div
          v-for="category in getAssetCategoryBreakdown"
          :key="category.label"
          class="flex items-center gap-2"
        >
          <span 
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: category.color }"
          />
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ category.label }}
          </span>
        </div>
      </div>

      <div v-else class="text-neutral-500 dark:text-neutral-400 text-center py-8">
        No asset accounts found
      </div>
    </div>
  </UCard>
</template>

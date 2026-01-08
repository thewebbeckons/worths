<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisTooltip } from '@unovis/vue'
import { Donut } from '@unovis/ts'

const { getAssetCategoryBreakdown, totalAssets } = useNetWorth()

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

// Process categories: top 4 + "Others" grouping
const processedCategories = computed(() => {
  const all = getAssetCategoryBreakdown.value
  if (all.length <= 5) return all
  
  const top4 = all.slice(0, 4)
  const others = all.slice(4)
  const othersValue = others.reduce((sum, cat) => sum + cat.value, 0)
  const totalValue = all.reduce((sum, cat) => sum + cat.value, 0)
  const othersPercentage = totalValue > 0 ? (othersValue / totalValue) * 100 : 0
  
  return [
    ...top4,
    {
      label: 'Others',
      value: othersValue,
      percentage: othersPercentage,
      color: '#6b7280' // neutral gray for "Others"
    }
  ]
})

// Format full currency for tooltip
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

// Tooltip trigger with styled HTML content
const triggers = {
  [Donut.selectors.segment]: (_d: unknown, i: number) => {
    const category = processedCategories.value[i]
    if (!category) return ''
    return `
      <div class="chart-tooltip">
        <div class="chart-tooltip-header">${category.label}</div>
        <div class="chart-tooltip-row">
          <span class="chart-tooltip-dot" style="background: ${category.color}"></span>
          <span class="chart-tooltip-label">Value</span>
          <span class="chart-tooltip-value">${formatCurrency(category.value)}</span>
        </div>
        <div class="chart-tooltip-row">
          <span class="chart-tooltip-dot" style="background: ${category.color}; opacity: 0.5"></span>
          <span class="chart-tooltip-label">Share</span>
          <span class="chart-tooltip-value">${category.percentage.toFixed(1)}%</span>
        </div>
      </div>
    `
  }
}

// Donut chart accessors
const value = (d: typeof processedCategories.value[0]) => d.value
const color = (d: typeof processedCategories.value[0]) => d.color

// Top category for center display
const topCategory = computed(() => {
  const all = getAssetCategoryBreakdown.value
  return all.length > 0 ? all[0] : null
})
</script>

<template>
  <UCard class="md:w-1/2 shadow-sm" variant="outline">
    <div class="flex flex-col h-full">
      <!-- Header with Subtitle -->
      <div class="mb-4">
        <div class="text-lg font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          Asset Breakdown
        </div>
        <div class="text-sm text-muted">
          Distribution of assets by category
        </div>
      </div>
      
      <!-- Donut Chart with Legend Layout -->
      <div 
        v-if="processedCategories.length > 0"
        class="flex items-center gap-6 flex-1"
      >
        <!-- Donut Chart (Left) -->
        <div class="w-[200px] h-[200px]">
          <VisSingleContainer :data="processedCategories" :height="200">
            
            <VisDonut 
              :value="value" 
              :color="color"
              :arc-width="24"
              :pad-angle="0"
              :corner-radius="0"
            />
            <VisTooltip :triggers="triggers" />
          </VisSingleContainer>
        </div>
        
        <!-- Category Breakdown (Right) -->
        <div class="flex-1 space-y-2.5">
          <div class="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Category Breakdown</div>
          
          <div 
            v-for="category in processedCategories"
            :key="category.label"
            class="flex items-center gap-3"
          >
            <!-- Color Dot -->
            <div 
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: category.color }"
            />
            
            <!-- Category Name -->
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex-1 truncate">
              {{ category.label }}
            </span>
            
            <!-- Value -->
            <span class="text-sm text-muted tabular-nums">
              {{ formatCompactCurrency(category.value) }}
            </span>
            
            <!-- Percentage -->
            <span class="text-sm font-bold text-neutral-900 dark:text-white w-12 text-right tabular-nums">
              {{ category.percentage.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-neutral-500 dark:text-neutral-400 text-center py-8 flex-1">
        No asset accounts found
      </div>

      <!-- Bottom Section: Top Category & Total Assets Side by Side -->
      <div v-if="processedCategories.length > 0" class="flex gap-6 pt-3 mt-4 border-t border-neutral-200 dark:border-neutral-700">
        <!-- Top Category -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span 
              class="w-2 h-2 rounded-full" 
              :style="{ backgroundColor: topCategory?.color }"
            />
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Top Category</span>
          </div>
          <div class="text-lg font-semibold text-neutral-900 dark:text-white">
            {{ topCategory?.label }}
          </div>
        </div>

        <!-- Total Assets -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="w-2 h-2 rounded-full bg-primary-500" />
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Total Assets</span>
          </div>
          <div class="text-lg font-semibold text-primary-500">
            {{ formatCompactCurrency(totalAssets) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
:deep(.unovis-single-container) {
  --vis-donut-background-color: transparent;
  /* Reset default tooltip container */
  --vis-tooltip-background-color: transparent;
  --vis-tooltip-border-color: transparent;
  --vis-tooltip-shadow-color: transparent;
  --vis-tooltip-padding: 0;
}

/* Chart tooltip styling */
:deep(.chart-tooltip) {
  background: white;
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  min-width: 140px;
}

:deep(.chart-tooltip-header) {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 14px;
}

:deep(.chart-tooltip-row) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

:deep(.chart-tooltip-row:last-child) {
  margin-bottom: 0;
}

:deep(.chart-tooltip-dot) {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

:deep(.chart-tooltip-label) {
  color: #6b7280;
  flex: 1;
}

:deep(.chart-tooltip-value) {
  font-weight: 600;
  color: #1f2937;
}

/* Dark mode tooltip */
.dark :deep(.chart-tooltip) {
  background: #1f2937;
}

.dark :deep(.chart-tooltip-header) {
  color: white;
}

.dark :deep(.chart-tooltip-label) {
  color: #9ca3af;
}

.dark :deep(.chart-tooltip-value) {
  color: white;
}
</style>

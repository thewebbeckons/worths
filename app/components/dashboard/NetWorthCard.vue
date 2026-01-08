<script setup lang="ts">
import { VisXYContainer, VisArea, VisAxis, VisCrosshair, VisLine, VisTooltip } from '@unovis/vue'
import { CurveType } from '@unovis/ts'

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

const formatCompactCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value)
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
  
  return snapshots.map((s, index) => ({
    x: index,
    assets: s.assetsTotal,
    liabilities: s.liabilitiesTotal,
    netWorth: s.netWorth,
    month: s.month,
    formattedDate: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parseLocalDate(`${s.month}-01`))
  }))
})

// Accessors
const x = (d: typeof chartData.value[0]) => d.x
const yAssets = (d: typeof chartData.value[0]) => d.assets
const yLiabilities = (d: typeof chartData.value[0]) => d.liabilities

// Colors
const assetsColor = '#22c55e'
const liabilitiesColor = '#fca5a5'  // Light red (red-300)

// Formatters
const xTickFormat = (tick: number) => {
  const d = chartData.value[Math.round(tick)]
  return d?.formattedDate ?? ''
}

// Tooltip template - styled like reference image
const tooltipTemplate = (d: typeof chartData.value[0]) => {
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(parseLocalDate(`${d.month}-01`))
  return `
    <div class="chart-tooltip">
      <div class="chart-tooltip-header">${month}</div>
      <div class="chart-tooltip-row">
        <span class="chart-tooltip-dot" style="background: ${assetsColor}"></span>
        <span class="chart-tooltip-label">Assets</span>
        <span class="chart-tooltip-value">${formatCompactCurrency(d.assets)}</span>
      </div>
      <div class="chart-tooltip-row">
        <span class="chart-tooltip-dot" style="background: ${liabilitiesColor}"></span>
        <span class="chart-tooltip-label">Liabilities</span>
        <span class="chart-tooltip-value">${formatCompactCurrency(d.liabilities)}</span>
      </div>
    </div>
  `
}
</script>

<template>
  <UCard class="md:w-1/2 relative overflow-hidden shadow-sm" variant="outline">
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
      <div v-if="chartData.length > 1" class="flex-1 mb-4 h-[180px]">
        <VisXYContainer :data="chartData" :height="180" :margin="{ top: 5, right: 10, bottom: 25, left: 10 }">
          <!-- Assets Area (behind) -->
          <VisArea 
            :x="x" 
            :y="yAssets" 
            :color="assetsColor"
            :opacity="0.4"
            :curve-type="CurveType.MonotoneX"
          />
          <!-- Liabilities Area (front) -->
          <VisArea 
            :x="x" 
            :y="yLiabilities" 
            :color="liabilitiesColor"
            :opacity="0.9"
            :curve-type="CurveType.MonotoneX"
          />
          <!-- Assets Line -->
          <VisLine 
            :x="x" 
            :y="yAssets" 
            :color="assetsColor"
            :line-width="2"
            :curve-type="CurveType.MonotoneX"
          />
          <!-- Liabilities Line -->
          <VisLine 
            :x="x" 
            :y="yLiabilities" 
            :color="liabilitiesColor"
            :line-width="2"
            :curve-type="CurveType.MonotoneX"
          />
          <VisAxis 
            type="x" 
            :tick-format="xTickFormat"
            :num-ticks="6"
            :grid-line="false"
            :tick-line="false"
            :domain-line="false"
          />
          <VisTooltip />
          <VisCrosshair :template="tooltipTemplate" />
        </VisXYContainer>
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
            <span class="w-2 h-2 rounded-full bg-red-400" />
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Liabilities</span>
          </div>
          <div class="text-lg font-semibold text-red-400">
            {{ formatCurrency(totalLiabilities) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
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

/* Axis and tooltip styling */
:deep(.unovis-xy-container) {
  --vis-axis-tick-color: rgb(var(--color-neutral-400));
  --vis-axis-label-color: rgb(var(--color-neutral-500));
  --vis-crosshair-circle-stroke-color: white;
  --vis-crosshair-circle-stroke-width: 2px;
  /* Reset default tooltip container to be invisible */
  --vis-tooltip-background-color: transparent;
  --vis-tooltip-border-color: transparent;
  --vis-tooltip-shadow-color: transparent;
  --vis-tooltip-padding: 0;
}

:deep(.unovis-axis-tick text) {
  font-size: 11px;
  fill: rgb(var(--color-neutral-500));
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

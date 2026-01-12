<script setup lang="ts">
import { VisXYContainer, VisArea, VisAxis, VisCrosshair, VisLine } from '@unovis/vue'
import { CurveType } from '@unovis/ts'
import { formatCurrency, formatCompactCurrency, parseLocalDate } from '~/utils/format'

const props = defineProps<{
  startDate?: Date | null
}>()

const { getFilteredHistory } = useNetWorth()

// Transform data for Unovis
const data = computed(() => {
  const history = getFilteredHistory(props.startDate ?? null)
  return history.map((item, index) => ({
    x: index,
    y: item.value,
    date: item.date,
    formattedDate: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(parseLocalDate(item.date)),
    shortDate: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parseLocalDate(item.date))
  }))
})

// Accessors
const x = (d: typeof data.value[0]) => d.x
const y = (d: typeof data.value[0]) => d.y

// Chart color
const color = '#3b82f6' // Blue

// Formatters
const xTickFormat = (tick: number) => {
  const d = data.value[Math.round(tick)]
  return d?.shortDate ?? ''
}

// Tooltip template
const tooltipTemplate = (d: typeof data.value[0]) => {
  return `
    <div class="chart-tooltip">
      <div class="chart-tooltip-header">${d.formattedDate}</div>
      <div class="chart-tooltip-row">
        <span class="chart-tooltip-dot" style="background: ${color}"></span>
        <span class="chart-tooltip-label">Net Worth</span>
        <span class="chart-tooltip-value">${formatCurrency(d.y)}</span>
      </div>
    </div>
  `
}
</script>

<template>
  <div class="w-full">
    <div
      v-if="data.length > 0"
      class="h-[300px]"
    >
      <VisXYContainer
        :data="data"
        :height="300"
        :margin="{ top: 10, right: 10, bottom: 25, left: 50 }"
      >
        <VisArea
          :x="x"
          :y="y"
          :color="color"
          :opacity="0.3"
          :curve-type="CurveType.MonotoneX"
        />
        <VisLine
          :x="x"
          :y="y"
          :color="color"
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
        <VisAxis
          type="y"
          :tick-format="formatCompactCurrency"
          :num-ticks="4"
          :grid-line="true"
          :tick-line="false"
          :domain-line="false"
        />
        <VisCrosshair :template="tooltipTemplate" />
      </VisXYContainer>
    </div>
    <div
      v-else
      class="h-full flex items-center justify-center text-gray-500"
    >
      No data available
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/chart-tooltip.css';
</style>

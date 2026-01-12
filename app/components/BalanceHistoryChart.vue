<script setup lang="ts">
import { VisXYContainer, VisArea, VisAxis, VisCrosshair, VisLine, VisTooltip, VisScatter } from '@unovis/vue'
import { CurveType } from '@unovis/ts'
import { formatCurrency, formatCompactCurrency, parseLocalDate } from '~/utils/format'

const props = defineProps<{
  balanceHistory: { date: string, value: number }[]
  accountType?: 'asset' | 'liability'
  monthsToShow?: number
}>()

// Filter to last N months (default 6)
const filteredHistory = computed(() => {
  const months = props.monthsToShow ?? 6
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - months)

  return props.balanceHistory.filter((item) => {
    const itemDate = parseLocalDate(item.date)
    return itemDate >= cutoffDate
  })
})

// Transform data for Unovis - use timestamp for x-axis
const data = computed(() => {
  return filteredHistory.value.map((item) => {
    const date = parseLocalDate(item.date)
    return {
      x: date.getTime(),
      y: item.value,
      date: item.date,
      formattedDate: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    }
  })
})

// Accessors
const x = (d: typeof data.value[0]) => d.x
const y = (d: typeof data.value[0]) => d.y

// Color based on account type
const color = computed(() => props.accountType === 'liability' ? '#f87171' : '#22c55e')
const label = computed(() => props.accountType === 'liability' ? 'Balance' : 'Balance')

// Formatters - show month and year for x-axis ticks
const xTickFormat = (tick: number) => {
  const date = new Date(tick)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

// Tooltip template
const tooltipTemplate = (d: typeof data.value[0]) => {
  return `
    <div class="chart-tooltip">
      <div class="chart-tooltip-header">${d.formattedDate}</div>
      <div class="chart-tooltip-row">
        <span class="chart-tooltip-dot" style="background: ${color.value}"></span>
        <span class="chart-tooltip-label">${label.value}</span>
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
      class="h-[250px]"
    >
      <VisXYContainer
        :data="data"
        :height="250"
        :margin="{ top: 10, right: 10, bottom: 10, left: 10 }"
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
        <VisScatter
          :x="x"
          :y="y"
          :color="color"
          :size="8"
          :stroke-color="'white'"
          :stroke-width="2"
        />
        <VisAxis
          type="x"
          :tick-format="xTickFormat"
          :num-ticks="5"
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
        <VisTooltip />
        <VisCrosshair :template="tooltipTemplate" />
      </VisXYContainer>
    </div>
    <div
      v-else
      class="h-full flex items-center justify-center text-gray-500 py-8"
    >
      No balance history available
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/chart-tooltip.css';
</style>

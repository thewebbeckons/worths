<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const { getQuarterlyGrowth } = useNetWorth()

const quarters = computed(() => getQuarterlyGrowth(4))

const maxAbsGrowth = computed(() => {
  if (quarters.value.length === 0) return 0
  return Math.max(...quarters.value.map(q => Math.abs(q.growth)))
})

function barWidth(growth: number): number {
  if (maxAbsGrowth.value === 0) return 0
  return (Math.abs(growth) / maxAbsGrowth.value) * 50
}

function formatGrowth(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${formatCurrency(value)}`
}

function formatPercentage(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}
</script>

<template>
  <UCard
    class="h-full min-h-80"
    variant="outline"
    :ui="{ body: 'h-full flex flex-col' }"
  >
    <div class="grid grid-rows-[auto_1fr] h-full gap-4">
      <!-- Header -->
      <div>
        <h2 class="section-title">Quarterly growth</h2>
      </div>

      <!-- Chart -->
      <div
        v-if="quarters.length > 0"
        class="flex flex-col min-h-0"
      >
        <div
          v-for="quarter in quarters"
          :key="quarter.label"
          class="flex flex-1 items-center gap-3 py-1 min-h-0"
        >
          <!-- Quarter Label -->
          <div class="w-20 shrink-0 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {{ quarter.label }}
          </div>

          <!-- Bar Track -->
          <div class="relative flex-1 self-stretch min-h-8">
            <!-- Center baseline -->
            <div class="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />

            <!-- Positive bar (extends right from center) -->
            <div
              v-if="quarter.growth >= 0"
              class="absolute left-1/2 top-0 bottom-0 rounded-r bg-secondary-200 transition-all duration-500 dark:bg-secondary-700/80"
              :style="{ width: `${barWidth(quarter.growth)}%` }"
            />

            <!-- Negative bar (extends left from center) -->
            <div
              v-else
              class="absolute right-1/2 top-0 bottom-0 rounded-l bg-primary-200/80 transition-all duration-500 dark:bg-primary-800/70"
              :style="{ width: `${barWidth(quarter.growth)}%` }"
            />
          </div>

          <!-- Value -->
          <div
            class="w-32 shrink-0 text-right text-sm font-semibold tabular-nums"
            :class="quarter.growth >= 0 ? 'text-secondary-700 dark:text-secondary-300' : 'text-primary-700/80 dark:text-primary-300/80'"
          >
            <div :title="formatCurrency(quarter.growth)">
              {{ formatGrowth(quarter.growth) }}
            </div>
            <div class="text-xs text-muted font-normal">
              {{ formatPercentage(quarter.percentage) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
      >
        <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UIcon name="i-lucide-chart-no-axes-combined" class="size-6" />
        </div>
        <p class="font-semibold text-neutral-900 dark:text-white">
          Not enough data
        </p>
        <p class="mt-1 max-w-sm text-sm text-muted">
          Add balance history across multiple quarters to see quarter-over-quarter growth.
        </p>
      </div>
    </div>
  </UCard>
</template>

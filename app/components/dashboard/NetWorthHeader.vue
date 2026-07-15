<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

const props = defineProps<{
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  startDate: Date;
  periodLabel: string;
}>();

const { getGrowthForPeriod } = useNetWorth();

const growth = computed(() => getGrowthForPeriod(props.startDate));

const hasGrowth = computed(
  () => growth.value.growth !== 0 || growth.value.percentage !== 0,
);
const isPositiveGrowth = computed(() => growth.value.growth >= 0);
</script>

<template>
  <UContainer
    class="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16"
  >
    <div class="reveal-up">
      <h1 class="page-title max-w-2xl">
        Know what you’re worth.
      </h1>
      <div class="mt-6 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div class="metric-value text-4xl font-semibold sm:text-5xl">
          {{ formatCurrency(currentNetWorth) }}
        </div>
        <div
          v-if="hasGrowth"
          class="mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          :class="isPositiveGrowth ? 'bg-secondary/12 text-secondary-700 dark:text-secondary-300' : 'bg-error/10 text-error'"
        >
          <UIcon :name="isPositiveGrowth ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-right'" class="size-3.5" />
          {{ isPositiveGrowth ? "+" : "" }}{{ formatCurrency(growth.growth) }} · {{
            isPositiveGrowth ? "+" : ""
          }}{{ growth.percentage.toFixed(2) }}% {{ periodLabel }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 reveal-up">
      <div class="soft-card rounded-[1.25rem] p-5 sm:p-6">
        <div class="mb-5 flex size-9 items-center justify-center rounded-full bg-secondary/12 text-secondary-700 dark:text-secondary-300">
          <UIcon name="i-lucide-landmark" class="size-4.5" />
        </div>
        <div class="metric-label mb-1.5">
          Assets
        </div>
        <div class="metric-value text-xl font-semibold text-secondary-700 sm:text-2xl dark:text-secondary-300">
          {{ formatCurrency(totalAssets) }}
        </div>
      </div>

      <div class="soft-card rounded-[1.25rem] p-5 sm:p-6">
        <div class="mb-5 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UIcon name="i-lucide-receipt-text" class="size-4.5" />
        </div>
        <div class="metric-label mb-1.5">
          Liabilities
        </div>
        <div class="metric-value text-xl font-semibold text-primary sm:text-2xl">
          {{ formatCurrency(totalLiabilities) }}
        </div>
      </div>
    </div>
  </UContainer>
</template>

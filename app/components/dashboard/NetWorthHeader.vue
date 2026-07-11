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
    class="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-6 sm:gap-12 py-12"
  >
    <!-- Net Worth Section -->
    <div>
      <div
        class="text-2xl sm:text-5xl font-bold text-neutral-900 dark:text-white"
      >
        {{ formatCurrency(currentNetWorth) }}
      </div>

      <!-- Period Growth Text -->
      <div
        v-if="hasGrowth"
        class="mt-2 text-sm font-medium"
        :class="isPositiveGrowth ? 'text-success' : 'text-error'"
      >
        {{ isPositiveGrowth ? "+" : "" }}{{ formatCurrency(growth.growth) }} ({{
          isPositiveGrowth ? "+" : ""
        }}{{ growth.percentage.toFixed(2) }}%) {{ periodLabel }}
      </div>
    </div>

    <!-- Assets & Liabilities -->
    <div class="flex gap-6 sm:gap-12">
      <!-- Total Assets -->
      <div>
        <div
          class="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 mb-1"
        >
          Total Assets
        </div>
        <div class="text-xl sm:text-2xl font-bold text-success">
          {{ formatCurrency(totalAssets) }}
        </div>
      </div>

      <!-- Total Liabilities -->
      <div>
        <div
          class="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 mb-1"
        >
          Total Liabilities
        </div>
        <div class="text-xl sm:text-2xl font-bold text-error">
          {{ formatCurrency(totalLiabilities) }}
        </div>
      </div>
    </div>
  </UContainer>
</template>

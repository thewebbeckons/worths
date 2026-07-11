<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

defineProps<{
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}>();

const { monthlyGrowthPercentage } = useNetWorth();

const isPositiveGrowth = computed(() => monthlyGrowthPercentage.value >= 0);
</script>

<template>
  <div class="bg-white dark:bg-neutral-900 shadow-sm">
    <UContainer
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-12 py-12"
    >
      <!-- Net Worth Section -->
      <div class="flex items-end gap-4">
        <div>
          <div
            class="text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 mb-1"
          >
            Total Net Worth
          </div>
          <div
            class="text-4xl sm:text-7xl font-bold text-neutral-900 dark:text-white"
          >
            {{ formatCurrency(currentNetWorth) }}
          </div>
        </div>

        <!-- MoM Change Badge -->
        <div
          v-if="monthlyGrowthPercentage !== 0"
          class="flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-full text-sm font-medium"
          :class="
            isPositiveGrowth
              ? 'bg-success/10 text-success'
              : 'bg-error/10 text-error'
          "
        >
          <UIcon
            :name="
              isPositiveGrowth
                ? 'i-lucide-trending-up'
                : 'i-lucide-trending-down'
            "
            class="w-4 h-4"
          />
          <span
            >{{ isPositiveGrowth ? "+" : ""
            }}{{ monthlyGrowthPercentage.toFixed(1) }}%</span
          >
        </div>
      </div>

      <!-- Assets & Liabilities -->
      <div class="flex divide-x divide-neutral-200 dark:divide-neutral-800">
        <!-- Total Assets -->
        <div class="px-6">
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
        <div class="px-6">
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
  </div>
</template>

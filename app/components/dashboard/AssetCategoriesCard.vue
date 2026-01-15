<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisTooltip } from "@unovis/vue";
import { Donut } from "@unovis/ts";
import { formatCurrency, formatCompactCurrency } from "~/utils/format";

const { getAssetCategoryBreakdown, totalAssets } = useNetWorth();

// Process categories: top 4 + "Others" grouping
const processedCategories = computed(() => {
  const all = getAssetCategoryBreakdown.value;
  if (all.length <= 5) return all;

  const top4 = all.slice(0, 4);
  const others = all.slice(4);
  const othersValue = others.reduce((sum, cat) => sum + cat.value, 0);
  const totalValue = all.reduce((sum, cat) => sum + cat.value, 0);
  const othersPercentage =
    totalValue > 0 ? (othersValue / totalValue) * 100 : 0;

  return [
    ...top4,
    {
      label: "Others",
      value: othersValue,
      percentage: othersPercentage,
      color: "#6b7280", // neutral gray for "Others"
    },
  ];
});

// Tooltip trigger with styled HTML content
const triggers = {
  [Donut.selectors.segment]: (_d: unknown, i: number) => {
    const category = processedCategories.value[i];
    if (!category) return "";
    return `
      <div class="chart-tooltip">
        <div class="chart-tooltip-header">${category.label}</div>
        <div class="chart-tooltip-row">
          <span class="chart-tooltip-dot" style="background: ${
            category.color
          }"></span>
          <span class="chart-tooltip-label">Value</span>
          <span class="chart-tooltip-value">${formatCurrency(
            category.value
          )}</span>
        </div>
        <div class="chart-tooltip-row">
          <span class="chart-tooltip-dot" style="background: ${
            category.color
          }; opacity: 0.5"></span>
          <span class="chart-tooltip-label">Share</span>
          <span class="chart-tooltip-value">${category.percentage.toFixed(
            1
          )}%</span>
        </div>
      </div>
    `;
  },
};

// Donut chart accessors
const value = (d: (typeof processedCategories.value)[0]) => d.value;
const color = (d: (typeof processedCategories.value)[0]) => d.color;

// Top category for center display
const topCategory = computed(() => {
  const all = getAssetCategoryBreakdown.value;
  return all.length > 0 ? all[0] : null;
});
</script>

<template>
  <UCard class="md:w-1/2 shadow-sm" variant="outline">
    <div class="flex flex-col h-full">
      <!-- Header with Subtitle -->
      <div class="mb-4">
        <div
          class="text-lg font-bold uppercase tracking-wider text-neutral-900 dark:text-white"
        >
          Asset Breakdown
        </div>
        <div class="text-sm text-muted">Distribution of assets by category</div>
      </div>

      <!-- Donut Chart with Legend Layout -->
      <div
        v-if="processedCategories.length > 0"
        class="flex items-center gap-6 flex-1"
      >
        <!-- Donut Chart (Left) -->
        <div class="w-50 h-50">
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
          <div
            class="text-xs uppercase tracking-wide text-muted font-semibold mb-2"
          >
            Category Breakdown
          </div>

          <div
            v-for="category in processedCategories"
            :key="category.label"
            class="flex items-center gap-3"
          >
            <!-- Color Dot -->
            <div
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: category.color }"
            />

            <!-- Category Name -->
            <span
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex-1 truncate"
            >
              {{ category.label }}
            </span>

            <!-- Value -->
            <span class="text-sm text-muted tabular-nums">
              {{ formatCompactCurrency(category.value) }}
            </span>

            <!-- Percentage -->
            <span
              class="text-sm font-bold text-neutral-900 dark:text-white w-12 text-right tabular-nums"
            >
              {{ category.percentage.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-neutral-500 dark:text-neutral-400 text-center py-8 flex-1"
      >
        No asset accounts found
      </div>

      <!-- Bottom Section: Top Category & Total Assets Side by Side -->
      <div
        v-if="processedCategories.length > 0"
        class="flex gap-6 pt-3 mt-4 border-t border-neutral-200 dark:border-neutral-700"
      >
        <!-- Top Category -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: topCategory?.color }"
            />
            <span
              class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >Top Category</span
            >
          </div>
          <div class="text-lg font-semibold text-neutral-900 dark:text-white">
            {{ topCategory?.label }}
          </div>
        </div>

        <!-- Total Assets -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="w-2 h-2 rounded-full bg-primary-500" />
            <span
              class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >Total Assets</span
            >
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
@import "~/assets/css/chart-tooltip.css";
</style>

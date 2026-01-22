<script setup lang="ts">
import {
  VisXYContainer,
  VisAxis,
  VisCrosshair,
  VisLine,
  VisGroupedBar,
  VisTooltip,
  VisScatter,
} from "@unovis/vue";
import { CurveType } from "@unovis/ts";
import { useStorage } from "@vueuse/core";
import {
  formatCurrency,
  formatCompactCurrency,
  parseLocalDate,
} from "~/utils/format";

interface PeriodGrowth {
  growth: number;
  percentage: number;
}

defineProps<{
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}>();

const { monthlySnapshots } = useNetWorth();

const periodOptions = ["1M", "3M", "6M"];
const selectedPeriod = useStorage("networth-card-period", "1M");

const formatMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getMonthsInPeriod = (monthsCount: number) => {
  const now = new Date();
  const months: string[] = [];

  for (let offset = monthsCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push(formatMonth(date));
  }

  return months;
};

const selectedMonthsCount = computed(() => {
  switch (selectedPeriod.value) {
    case "6M":
      return 6;
    case "3M":
      return 3;
    default:
      return 2;
  }
});

// Transform snapshots for the chart
const chartData = computed(() => {
  const snapshotMap = new Map(
    monthlySnapshots.value.map((snapshot) => [snapshot.month, snapshot]),
  );
  const months = getMonthsInPeriod(selectedMonthsCount.value);

  return months.map((month, index) => {
    const snapshot = snapshotMap.get(month);
    const assets = snapshot?.assetsTotal ?? 0;
    const liabilities = snapshot?.liabilitiesTotal ?? 0;
    const netWorth = snapshot?.netWorth ?? 0;

    return {
      x: index,
      assets,
      liabilities,
      netWorth,
      month,
      formattedDate: new Intl.DateTimeFormat("en-US", {
        month: "short",
      }).format(parseLocalDate(`${month}-01`)),
    };
  });
});

const periodGrowth = computed<PeriodGrowth>(() => {
  const data = chartData.value;
  if (data.length < 2) return { growth: 0, percentage: 0 };

  const startValue = data[0]?.netWorth ?? 0;
  const endValue = data[data.length - 1]?.netWorth ?? 0;
  const growth = endValue - startValue;
  const percentage =
    startValue !== 0
      ? (growth / Math.abs(startValue)) * 100
      : endValue !== 0
        ? 100
        : 0;

  return { growth, percentage };
});
// Get unique month labels for x-axis ticks
const uniqueMonthIndices = computed(() => {
  const seen = new Set<string>();
  const indices: number[] = [];
  chartData.value.forEach((d, i) => {
    if (!seen.has(d.formattedDate)) {
      seen.add(d.formattedDate);
      indices.push(i);
    }
  });
  return indices;
});

// Accessors
const x = (d: (typeof chartData.value)[0]) => d.x;
const yAssets = (d: (typeof chartData.value)[0]) => d.assets;
const yLiabilities = (d: (typeof chartData.value)[0]) => d.liabilities;
const yNetWorth = (d: (typeof chartData.value)[0]) => d.netWorth;

// Colors
const assetsColor = "#00C16A";
const liabilitiesColor = "#ef4444"; // Red
const netWorthColor = "#3b82f6"; // Blue
const barColors = [assetsColor, liabilitiesColor];

// X-axis tick values - only show unique months
const xTickValues = computed(() => uniqueMonthIndices.value);

// Formatters
const xTickFormat = (tick: number) => {
  const d = chartData.value[tick];
  return d?.formattedDate ?? "";
};

// Tooltip template - styled like reference image
const tooltipTemplate = (d: (typeof chartData.value)[0]) => {
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    parseLocalDate(`${d.month}-01`),
  );
  return `
    <div class="chart-tooltip">
      <div class="chart-tooltip-header">${month}</div>
      <div class="chart-tooltip-row">
        <span class="chart-tooltip-dot" style="background: ${netWorthColor}"></span>
        <span class="chart-tooltip-label">Net Worth</span>
        <span class="chart-tooltip-value">${formatCompactCurrency(d.netWorth)}</span>
      </div>
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
  `;
};
</script>

<template>
  <UCard class="md:w-1/2 relative overflow-hidden shadow-sm" variant="outline">
    <div class="relative flex flex-col h-full">
      <!-- Top Section: Net Worth + Growth Indicator -->
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <div
            class="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
          >
            Net Worth
          </div>
          <div class="text-3xl font-bold text-neutral-900 dark:text-white">
            {{ formatCurrency(currentNetWorth) }}
          </div>

          <!-- Growth Indicator (Below Net Worth) -->
          <div
            v-if="periodGrowth.growth !== 0"
            class="flex items-center gap-1.5 mt-1 text-sm font-medium"
            :class="
              periodGrowth.growth >= 0 ? 'text-green-500' : 'text-red-500'
            "
          >
            <UIcon
              :name="
                periodGrowth.growth >= 0
                  ? 'i-heroicons-arrow-trending-up'
                  : 'i-heroicons-arrow-trending-down'
              "
              class="w-4 h-4"
            />
            <span
              >{{ periodGrowth.growth >= 0 ? "+" : ""
              }}{{ formatCurrency(periodGrowth.growth) }}</span
            >
            <UBadge
              variant="subtle"
              :color="periodGrowth.growth >= 0 ? 'success' : 'error'"
              >{{ periodGrowth.growth >= 0 ? "+" : ""
              }}{{ periodGrowth.percentage.toFixed(1) }}%</UBadge
            >
          </div>
        </div>
        <USelect v-model="selectedPeriod" :items="periodOptions" class="w-20" />
      </div>

      <!-- Chart Section -->
      <div v-if="chartData.length > 1" class="flex-1 mb-4 h-45">
        <VisXYContainer
          :data="chartData"
          :height="180"
          :margin="{ top: 5, right: 10, bottom: 25, left: 10 }"
        >
          <!-- Net Worth Line with Scatter Points -->
          <VisLine
            :x="x"
            :y="yNetWorth"
            :color="netWorthColor"
            :line-width="2"
            :curve-type="CurveType.MonotoneX"
          />
          <VisScatter :x="x" :y="yNetWorth" :color="netWorthColor" :size="6" />
          <!-- Grouped Bar for Assets & Liabilities -->
          <VisGroupedBar
            :x="x"
            :y="[yAssets, yLiabilities]"
            :color="barColors"
            :bar-width="8"
            :bar-padding="0.2"
          />
          <VisAxis
            type="x"
            :tick-format="xTickFormat"
            :tick-values="xTickValues"
            :grid-line="false"
            :tick-line="false"
            :domain-line="false"
          />
          <VisTooltip />
          <VisCrosshair :template="tooltipTemplate" />
        </VisXYContainer>
      </div>
      <div
        v-else
        class="flex-1 flex items-center justify-center text-neutral-400 text-sm py-8"
      >
        Not enough data to display chart
      </div>

      <!-- Bottom Section: Assets & Liabilities Side by Side -->
      <div
        class="flex gap-6 pt-3 border-t border-neutral-200 dark:border-neutral-700"
      >
        <!-- Assets -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="w-2 h-2 rounded-full bg-green-500" />
            <span
              class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >Assets</span
            >
          </div>
          <div class="text-xl font-bold text-green-500">
            {{ formatCurrency(totalAssets) }}
          </div>
        </div>

        <!-- Liabilities -->
        <div class="flex-1">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="w-2 h-2 rounded-full bg-red-400" />
            <span
              class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
              >Liabilities</span
            >
          </div>
          <div class="text-xl font-bold text-red-400">
            {{ formatCurrency(totalLiabilities) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
@import "~/assets/css/chart-tooltip.css";

/* Additional crosshair styling specific to this chart */
:deep(.unovis-xy-container) {
  --vis-crosshair-circle-stroke-color: white;
  --vis-crosshair-circle-stroke-width: 2px;
}
</style>

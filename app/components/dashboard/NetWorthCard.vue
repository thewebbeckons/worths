<script setup lang="ts">
import {
  VisXYContainer,
  VisAxis,
  VisCrosshair,
  VisLine,
  VisTooltip,
  VisScatter,
} from "@unovis/vue";
import { CurveType } from "@unovis/ts";
import { formatCompactCurrency, parseLocalDate } from "~/utils/format";

const { monthlySnapshots } = useNetWorth();

const props = defineProps<{
  selectedPeriod: string;
  periodOptions: readonly string[];
}>();

const emit = defineEmits<{
  "update:selectedPeriod": [value: string];
}>();

const formatMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getStartMonth = () => {
  const now = new Date();

  switch (props.selectedPeriod) {
    case "1M":
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    case "3M":
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case "6M":
      return new Date(now.getFullYear(), now.getMonth() - 5, 1);
    case "YTD":
      return new Date(now.getFullYear(), 0, 1);
    case "1Y":
      return new Date(now.getFullYear(), now.getMonth() - 11, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
};

const getMonthsInPeriod = () => {
  const start = getStartMonth();
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  const months: string[] = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    months.push(formatMonth(current));
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return months;
};

// Transform snapshots for the chart
const chartData = computed(() => {
  const snapshotMap = new Map(
    monthlySnapshots.value.map((snapshot) => [snapshot.month, snapshot]),
  );
  const months = getMonthsInPeriod();

  let lastNetWorth = 0;

  return months.map((month, index) => {
    const snapshot = snapshotMap.get(month);
    if (snapshot) {
      lastNetWorth = snapshot.netWorth;
    }

    return {
      x: index,
      netWorth: snapshot?.netWorth ?? lastNetWorth,
      month,
      formattedDate: new Intl.DateTimeFormat("en-US", {
        month: "short",
      }).format(parseLocalDate(`${month}-01`)),
    };
  });
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
const yNetWorth = (d: (typeof chartData.value)[0]) => d.netWorth;

const netWorthColor = "#3b82f6";

// X-axis tick values - only show unique months
const xTickValues = computed(() => uniqueMonthIndices.value);

// Formatters
const xTickFormat = (tick: number) => {
  const d = chartData.value[tick];
  return d?.formattedDate ?? "";
};

// Tooltip template
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
    </div>
  `;
};
</script>

<template>
  <div class="w-full">
    <div v-if="chartData.length > 1" class="h-[300px]">
      <VisXYContainer
        :data="chartData"
        :height="300"
        :margin="{ top: 10, right: 10, bottom: 25, left: 10 }"
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
      class="h-[300px] flex items-center justify-center text-neutral-400 text-sm"
    >
      Not enough data to display chart
    </div>

    <!-- Period Selector -->
    <div class="flex items-center gap-1 mt-2">
      <button
        v-for="period in periodOptions"
        :key="period"
        type="button"
        class="px-3 py-1 text-sm font-medium rounded-md transition-colors"
        :class="
          props.selectedPeriod === period
            ? 'bg-primary text-neutral-900 dark:text-white'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        "
        @click="emit('update:selectedPeriod', period)"
      >
        {{ period }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/chart-tooltip.css";

/* Additional crosshair styling specific to this chart */
:deep(.unovis-xy-container) {
  --vis-crosshair-circle-stroke-color: white;
  --vis-crosshair-circle-stroke-width: 2px;
}
</style>

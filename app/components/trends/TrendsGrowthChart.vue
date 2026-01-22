<script setup lang="ts">
import { formatCurrency, formatCompactCurrency } from "~/utils/format";

const { accounts, getBalanceHistory } = useNetWorth();

interface GrowthData {
  category: string;
  growth: number; // Effective growth (positive = good for net worth)
  currentTotal: number;
  previousTotal: number;
  color: string;
  percentage: number;
}

const chartData = ref<GrowthData[]>([]);
const isLoading = ref(true);

// Get previous month date string
const getPreviousMonthDate = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return now.toISOString().slice(0, 7); // yyyy-mm
};

// Load growth data grouped by category
const loadGrowthData = async () => {
  isLoading.value = true;
  const previousMonth = getPreviousMonthDate();

  // Group by category
  const categoryGroups: Record<
    string,
    {
      type: "asset" | "liability";
      currentTotal: number;
      previousTotal: number;
    }
  > = {};

  for (const acc of accounts.value) {
    const history = await getBalanceHistory(acc.id);

    const currentBalance = acc.latestBalance;

    // Find balance from previous month
    let previousBalance = 0;
    const previousEntries = history.filter(
      (h) => h.date.startsWith(previousMonth) || h.date < previousMonth
    );
    if (previousEntries.length > 0) {
      previousBalance = previousEntries[previousEntries.length - 1]?.value || 0;
    }

    const cat = acc.category;
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = {
        type: acc.type,
        currentTotal: 0,
        previousTotal: 0,
      };
    }

    categoryGroups[cat]!.currentTotal += currentBalance;
    categoryGroups[cat]!.previousTotal += previousBalance;
  }

  // Calculate growth for each category
  const growthResults: GrowthData[] = [];

  for (const [category, data] of Object.entries(categoryGroups)) {
    const rawChange = data.currentTotal - data.previousTotal;

    // For liabilities, a decrease in balance is positive for net worth
    const growth = data.type === "liability" ? -rawChange : rawChange;

    // Skip categories with no change
    if (growth === 0) continue;

    growthResults.push({
      category,
      growth,
      currentTotal: data.currentTotal,
      previousTotal: data.previousTotal,
      color: growth >= 0 ? "#22c55e" : "#f87171",
      percentage: 0,
    });
  }

  // Sort by growth: highest positive first, then negative
  growthResults.sort((a, b) => b.growth - a.growth);

  // Calculate percentages based on max absolute growth
  const maxAbsGrowth = Math.max(
    ...growthResults.map((r) => Math.abs(r.growth)),
    1
  );
  growthResults.forEach((item) => {
    item.percentage = (Math.abs(item.growth) / maxAbsGrowth) * 100;
  });

  chartData.value = growthResults;
  isLoading.value = false;
};

// Watch for account changes and reload
watch(accounts, () => loadGrowthData(), { immediate: true });

// Format growth with sign
const formatGrowth = (value: number) => {
  const prefix = value >= 0 ? "+" : "";
  return prefix + formatCompactCurrency(value);
};

// Calculate percent change
const getPercentChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? "+∞%" : "0%";
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const prefix = pct >= 0 ? "+" : "";
  return `${prefix}${pct.toFixed(1)}%`;
};
</script>

<template>
  <div class="w-full">
    <div v-if="isLoading" class="h-[200px] flex items-center justify-center">
      <UIcon
        name="i-heroicons-arrow-path"
        class="animate-spin w-6 h-6 text-gray-400"
      />
    </div>
    <div v-else-if="chartData.length > 0" class="space-y-3">
      <UTooltip
        v-for="item in chartData"
        :key="item.category"
      >
        <template #text>
          <div class="text-xs space-y-1">
            <div class="font-medium">{{ item.category }}</div>
            <div class="flex justify-between gap-4">
              <span>Previous:</span>
              <span>{{ formatCurrency(item.previousTotal) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span>Current:</span>
              <span>{{ formatCurrency(item.currentTotal) }}</span>
            </div>
            <div class="flex justify-between gap-4 pt-1 border-t border-gray-600">
              <span>Change:</span>
              <span :class="item.growth >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatGrowth(item.growth) }}
                ({{ getPercentChange(item.currentTotal, item.previousTotal) }})
              </span>
            </div>
          </div>
        </template>
        <div class="group cursor-default">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
              {{ item.category }}
            </span>
            <span
              class="text-sm font-mono"
              :class="item.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ formatGrowth(item.growth) }}
            </span>
          </div>
          <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-200 group-hover:brightness-110"
              :style="{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }"
            />
          </div>
        </div>
      </UTooltip>
    </div>
    <div
      v-else
      class="h-[200px] flex items-center justify-center text-gray-500"
    >
      No month-over-month changes
    </div>
  </div>
</template>

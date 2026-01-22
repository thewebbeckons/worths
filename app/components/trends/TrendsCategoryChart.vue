<script setup lang="ts">
import { formatCurrency, formatCompactCurrency } from "~/utils/format";

const { accounts } = useNetWorth();

// Colors for each category
const categoryColorMap: Record<string, string> = {
  Investment: "#6366f1",
  Cash: "#22c55e",
  Credit: "#f87171",
  Property: "#f59e42",
  Retirement: "#8b5cf6",
  Savings: "#22d3ee",
  TFSA: "#22d3ee",
  RRSP: "#8b5cf6",
  Mortgage: "#f87171",
  "Credit Card": "#f87171",
  Crypto: "#f59e42",
  Other: "#94a3b8",
};

interface CategoryData {
  category: string;
  type: "asset" | "liability";
  total: number;
  color: string;
  percentage: number;
}

// Group accounts by category and calculate totals (assets only)
const chartData = computed<CategoryData[]>(() => {
  if (!accounts.value || accounts.value.length === 0) {
    return [];
  }

  const groups: Record<
    string,
    { category: string; total: number; type: "asset" | "liability" }
  > = {};

  // Only include assets
  for (const acc of accounts.value) {
    if (acc.type === "liability") continue;

    const cat = acc.category;
    if (!groups[cat]) {
      groups[cat] = { category: cat, total: 0, type: acc.type };
    }
    groups[cat]!.total += acc.latestBalance;
  }

  const sorted = Object.values(groups).sort((a, b) => b.total - a.total);
  const maxTotal = sorted[0]?.total ?? 1;

  return sorted.map((item) => ({
    category: item.category,
    type: item.type,
    total: item.total,
    color: categoryColorMap[item.category] ?? "#94a3b8",
    percentage: (item.total / maxTotal) * 100,
  }));
});
</script>

<template>
  <div class="w-full">
    <div v-if="chartData.length > 0" class="space-y-3">
      <UTooltip
        v-for="item in chartData"
        :key="item.category"
        :text="formatCurrency(item.total)"
      >
        <div class="group cursor-default">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
              {{ item.category }}
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {{ formatCompactCurrency(item.total) }}
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
      class="h-[300px] flex items-center justify-center text-gray-500"
    >
      No asset categories available
    </div>
  </div>
</template>

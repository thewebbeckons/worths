<script setup lang="ts">
import { formatCurrency, formatCompactCurrency } from "~/utils/format";

const { accounts } = useNetWorth();

// Colors for each category
const categoryColorMap: Record<string, string> = {
  Investment: "#c6523f",
  Cash: "#477159",
  Credit: "#a77272",
  Property: "#d7a44b",
  Retirement: "#7e8fa8",
  Savings: "#71866f",
  TFSA: "#71866f",
  RRSP: "#7e8fa8",
  Mortgage: "#a77272",
  "Credit Card": "#a77272",
  Crypto: "#b67b55",
  Other: "#8c806f",
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
    color: categoryColorMap[item.category] ?? "#8c806f",
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
            <span class="text-sm text-muted tabular-nums">
              {{ formatCompactCurrency(item.total) }}
            </span>
          </div>
          <div class="h-3.5 w-full overflow-hidden rounded-full bg-muted">
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

<script setup lang="ts">
import { formatCurrency, formatCompactCurrency } from "~/utils/format";

const { accounts } = useNetWorth();

// Colors for banks
const bankColors = [
  "#c6523f",
  "#477159",
  "#d7a44b",
  "#7e8fa8",
  "#a77272",
  "#71866f",
  "#8c806f",
];

interface BankData {
  bank: string;
  total: number;
  color: string;
  percentage: number;
}

// Group accounts by bank and calculate totals (assets only)
const chartData = computed<BankData[]>(() => {
  if (!accounts.value || accounts.value.length === 0) {
    return [];
  }

  const groups: Record<string, number> = {};

  // Only include assets
  for (const acc of accounts.value) {
    if (acc.type === "liability") continue;

    groups[acc.bank] = (groups[acc.bank] ?? 0) + acc.latestBalance;
  }

  const sorted = Object.entries(groups)
    .map(([bank, total]) => ({ bank, total }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = sorted[0]?.total ?? 1;

  return sorted.map((item, index) => ({
    bank: item.bank,
    total: item.total,
    color: bankColors[index % bankColors.length]!,
    percentage: (item.total / maxTotal) * 100,
  }));
});
</script>

<template>
  <div class="w-full">
    <div v-if="chartData.length > 0" class="space-y-3">
      <UTooltip
        v-for="item in chartData"
        :key="item.bank"
        :text="formatCurrency(item.total)"
      >
        <div class="group cursor-default">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
              {{ item.bank }}
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
      No bank data available
    </div>
  </div>
</template>

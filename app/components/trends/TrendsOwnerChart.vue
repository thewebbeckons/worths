<script setup lang="ts">
import { formatCurrency, formatCompactCurrency } from "~/utils/format";

const { accounts } = useNetWorth();

// Colors for owners (index-based for consistent assignment)
const ownerColorPalette = ["#6366f1", "#22c55e", "#f59e42", "#8b5cf6"];

interface OwnerData {
  owner: string;
  total: number;
  color: string;
  percentage: number;
}

// Group accounts by owner and calculate totals (assets only)
const chartData = computed<OwnerData[]>(() => {
  if (!accounts.value || accounts.value.length === 0) {
    return [];
  }

  const groups: Record<string, number> = {};

  // Only include assets
  for (const acc of accounts.value) {
    if (acc.type === "liability") continue;

    const ownerKey = acc.owner;
    if (!groups[ownerKey]) {
      groups[ownerKey] = 0;
    }
    groups[ownerKey] += acc.latestBalance;
  }

  const sorted = Object.entries(groups)
    .map(([owner, total]) => ({ owner, total }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = sorted[0]?.total ?? 1;

  return sorted.map((item, index) => ({
    owner: item.owner,
    total: item.total,
    color: ownerColorPalette[index % ownerColorPalette.length]!,
    percentage: (item.total / maxTotal) * 100,
  }));
});
</script>

<template>
  <div class="w-full">
    <div v-if="chartData.length > 0" class="space-y-3">
      <UTooltip
        v-for="item in chartData"
        :key="item.owner"
        :text="formatCurrency(item.total)"
      >
        <div class="group cursor-default">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              {{ item.owner }}
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
      No owner data available
    </div>
  </div>
</template>

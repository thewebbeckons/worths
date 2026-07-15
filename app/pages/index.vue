<script setup lang="ts">
import { useStorage } from "@vueuse/core";

const { currentNetWorth, totalAssets, totalLiabilities } = useNetWorth();

const periodOptions = ["1M", "3M", "6M", "YTD", "1Y"] as const;
type PeriodOption = (typeof periodOptions)[number];

const selectedPeriod = useStorage<PeriodOption>("networth-card-period", "1M");

const getStartDate = (): Date => {
  const now = new Date();
  switch (selectedPeriod.value) {
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

const periodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case "1M":
      return "past month";
    case "3M":
      return "past 3 months";
    case "6M":
      return "past 6 months";
    case "YTD":
      return "year to date";
    case "1Y":
      return "past year";
    default:
      return "past month";
  }
});

const startDate = computed(() => getStartDate());
</script>

<template>
  <div class="space-y-2 pb-14">
    <DashboardNetWorthHeader
      :current-net-worth="currentNetWorth"
      :total-assets="totalAssets"
      :total-liabilities="totalLiabilities"
      :start-date="startDate"
      :period-label="periodLabel"
    />

    <UContainer class="space-y-6">
      <div class="reveal-up">
        <DashboardNetWorthCard
          v-model:selected-period="selectedPeriod"
          :period-options="periodOptions"
        />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="reveal-up">
          <DashboardAssetCategoriesCard />
        </div>
        <div class="reveal-up">
          <DashboardQuarterlyGrowthCard />
        </div>
      </div>
    </UContainer>
  </div>
</template>

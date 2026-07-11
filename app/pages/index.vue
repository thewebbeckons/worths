<script setup lang="ts">
const { currentNetWorth, totalAssets, totalLiabilities } = useNetWorth();
</script>

<template>
  <div class="space-y-8 pb-8">
    <!-- Net Worth Header Section -->
    <DashboardNetWorthHeader
      :current-net-worth="currentNetWorth"
      :total-assets="totalAssets"
      :total-liabilities="totalLiabilities"
    />

    <UContainer class="space-y-6">
      <DashboardNetWorthCard />

      <div class="grid gap-6 lg:grid-cols-2">
        <DashboardAssetCategoriesCard />
        <DashboardQuarterlyGrowthCard />
      </div>
    </UContainer>
  </div>
</template>

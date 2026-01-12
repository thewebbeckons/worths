<script setup lang="ts">
const { currentNetWorth, getGrowthForPeriod, totalAssets, totalLiabilities } = useNetWorth()

// Get period growth for all time
const periodGrowth = computed(() => getGrowthForPeriod(null))
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row gap-6">
          <DashboardNetWorthCard
            :current-net-worth="currentNetWorth"
            :total-assets="totalAssets"
            :total-liabilities="totalLiabilities"
            :period-growth="periodGrowth"
          />

          <DashboardAssetCategoriesCard />
        </div>

        <div class="flex flex-col md:flex-row gap-6">
          <DashboardAccountListCard
            type="asset"
            title="Assets"
          />
          <DashboardAccountListCard
            type="liability"
            title="Liabilities"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

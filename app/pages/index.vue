<script setup lang="ts">
const { currentNetWorth, getGrowthForPeriod, totalAssets, totalLiabilities } = useNetWorth()

// Period selector options
const periodOptions = [
  { label: '1 Month', value: '1m' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: 'YTD', value: 'ytd' },
  { label: '1 Year', value: '1y' },
  { label: 'All Time', value: 'all' }
]

// Use initOnMounted to avoid hydration mismatch - localStorage is read after mount
const selectedPeriod = useLocalStorage('networth-selected-period', 'all', { initOnMounted: true })

// Compute start date based on selected period
const startDate = computed(() => {
  const now = new Date()

  switch (selectedPeriod.value) {
    case '1m':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1)
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case 'all':
    default:
      return null
  }
})

// Get period growth based on selected period
const periodGrowth = computed(() => getGrowthForPeriod(startDate.value))
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <USelect v-model="selectedPeriod" :items="periodOptions" class="w-32" size="md" />
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
            :start-date="startDate"
          />

          <DashboardAssetCategoriesCard />
        </div>
        
        <div class="flex flex-col md:flex-row gap-6">
          <DashboardAssetsListCard />
          <DashboardLiabilitiesListCard />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

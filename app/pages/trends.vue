<script setup lang="ts"></script>

<template>
  <UDashboardPanel id="trends">
    <template #header>
      <UDashboardNavbar title="Trends">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Chart Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Category Balances -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-chart-bar"
                  class="w-5 h-5 text-primary"
                />
                <h3 class="font-semibold">Balances by Category</h3>
              </div>
            </template>
            <TrendsCategoryChart />
          </UCard>

          <!-- Bank Breakdown -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-building-library"
                  class="w-5 h-5 text-primary"
                />
                <h3 class="font-semibold">Breakdown by Bank</h3>
              </div>
            </template>
            <TrendsBankChart />
          </UCard>

          <!-- Owner Breakdown -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary" />
                <h3 class="font-semibold">Breakdown by Owner</h3>
              </div>
            </template>
            <TrendsOwnerChart />
          </UCard>

          <!-- MoM Growth -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-arrow-trending-up"
                  class="w-5 h-5 text-primary"
                />
                <h3 class="font-semibold">Month-over-Month Growth</h3>
              </div>
            </template>
            <TrendsGrowthChart />
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

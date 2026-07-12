<script setup lang="ts"></script>

<template>
  <UDashboardPanel id="trends">
    <template #header>
      <div class="bg-white dark:bg-neutral-900 shadow-sm">
        <UContainer class="flex items-center justify-between py-4">
          <h3 class="text-2xl font-bold">Trends</h3>
        </UContainer>
      </div>
    </template>

    <template #body>
      <UContainer class="space-y-6">
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
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts"></script>

<template>
  <UDashboardPanel id="trends">
    <template #header>
      <div>
        <UContainer class="py-10 sm:py-14">
          <h1 class="page-title">Trends</h1>
        </UContainer>
      </div>
    </template>

    <template #body>
      <UContainer class="space-y-6 pb-14">
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
                <h2 class="section-title">Balances by category</h2>
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
                <h2 class="section-title">Breakdown by bank</h2>
              </div>
            </template>
            <TrendsBankChart />
          </UCard>

          <!-- Owner Breakdown -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary" />
                <h2 class="section-title">Breakdown by owner</h2>
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
                <h2 class="section-title">Month-over-month growth</h2>
              </div>
            </template>
            <TrendsGrowthChart />
          </UCard>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

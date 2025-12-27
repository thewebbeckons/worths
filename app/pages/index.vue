<script setup lang="ts">
const { currentNetWorth, monthlyGrowth } = useNetWorth()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const isUpdateBalanceOpen = ref(false)
</script>

<template>
  <UContainer class="py-6 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <UButton label="Update Balance" @click="isUpdateBalanceOpen = true" icon="i-heroicons-arrow-path" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <template #header>
          <div class="text-sm font-medium text-gray-500">Net Worth</div>
        </template>
        <div class="text-3xl font-bold" :class="currentNetWorth >= 0 ? 'text-blue-600' : 'text-red-500'">
          {{ formatCurrency(currentNetWorth) }}
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="text-sm font-medium text-gray-500">Monthly Growth</div>
        </template>
        <div class="text-3xl font-bold" :class="monthlyGrowth >= 0 ? 'text-blue-600' : 'text-red-500'">
          {{ monthlyGrowth >= 0 ? '+' : '' }}{{ formatCurrency(monthlyGrowth) }}
        </div>
      </UCard>
    </div>

    <UCard variant="subtle">
      <template #header>
        <div class="text-lg font-bold">Net Worth Trend</div>
      </template>
      <NetWorthChart />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="text-lg font-bold">Accounts</div>
          <UButton label="Manage Accounts" variant="ghost" to="/accounts" />
        </div>
      </template>
      <AccountList />
    </UCard>

    <UModal v-model:open="isUpdateBalanceOpen">
      <template #content>
        <div class="p-4">
          <h3 class="text-lg font-bold mb-4">Update Balance</h3>
          <UpdateBalanceForm @close="isUpdateBalanceOpen = false" />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
const route = useRoute()
const { accounts, getBalanceHistory } = useNetWorth()

const accountId = route.params.id as string
const account = computed(() => accounts.value.find(a => a.id === accountId))

// Load balance history asynchronously
const balanceHistory = ref<{ date: string; value: number }[]>([])
const isLoading = ref(true)

onMounted(async () => {
  if (accountId) {
    balanceHistory.value = await getBalanceHistory(accountId)
    isLoading.value = false
  }
})

// Reload history after balance update
const reloadHistory = async () => {
  balanceHistory.value = await getBalanceHistory(accountId)
}

const historyColumns = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'value', header: 'Balance' }
]

const historyRows = computed(() => {
  return [...balanceHistory.value].reverse().map(b => ({
    date: b.date,
    value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(b.value)
  }))
})

const isEditModalOpen = ref(false)
const isUpdateBalanceModalOpen = ref(false)

const handleAccountSaved = async () => {
  await reloadHistory()
}

const handleBalanceUpdated = async () => {
  await reloadHistory()
  isUpdateBalanceModalOpen.value = false
}
</script>

<template>
  <UContainer class="py-6 space-y-6">
    <div v-if="account">
      <div class="flex justify-between items-center mb-6">
        <div>
          <UButton variant="link" icon="i-heroicons-arrow-left" to="/accounts" class="p-0 mb-2">Back to Accounts</UButton>
          <h1 class="text-3xl font-bold">{{ account.name }}</h1>
          <div class="flex gap-2 text-gray-500">
            <UBadge color="neutral">{{ account.category }}</UBadge>
            <UBadge color="neutral" variant="outline">{{ account.owner }}</UBadge>
            <UBadge :color="account.type === 'asset' ? 'success' : 'error'" variant="soft">
              {{ account.type === 'asset' ? 'Asset' : 'Liability' }}
            </UBadge>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton label="Update Balance" @click="isUpdateBalanceModalOpen = true" icon="i-lucide-circle-dollar-sign" variant="soft" />
          <UButton label="Edit Account" @click="isEditModalOpen = true" icon="i-lucide-square-pen" />
        </div>
      </div>

      <!-- Balance History Chart -->
      <UCard>
        <template #header>
          <div class="text-lg font-bold">Balance Trend</div>
        </template>
        <div v-if="isLoading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-gray-500" />
        </div>
        <BalanceHistoryChart 
          v-else 
          :balance-history="balanceHistory" 
          :account-type="account?.type"
        />
      </UCard>

      <!-- Balance History Table -->
      <UCard>
        <template #header>
          <div class="text-lg font-bold">Balance History</div>
        </template>
        <div v-if="isLoading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-gray-500" />
        </div>
        <div v-else-if="historyRows.length === 0" class="text-center py-8 text-gray-500">
          No balance history yet
        </div>
        <UTable v-else :columns="historyColumns" :data="historyRows" />
      </UCard>
      
      <!-- Edit Account Modal -->
      <UModal v-model:open="isEditModalOpen">
        <template #content>
          <div class="p-4">
            <h3 class="text-lg font-bold mb-4">Edit Account</h3>
            <EditAccountForm 
              :account="account" 
              @close="isEditModalOpen = false"
              @saved="handleAccountSaved"
            />
          </div>
        </template>
      </UModal>
      
      <!-- Update Balance Modal -->
      <UModal v-model:open="isUpdateBalanceModalOpen">
        <template #content>
          <div class="p-4">
            <h3 class="text-lg font-bold mb-4">Update Balance</h3>
            <UpdateBalanceForm 
              :preselected-account-id="accountId"
              @close="isUpdateBalanceModalOpen = false"
              @saved="handleBalanceUpdated"
            />
          </div>
        </template>
      </UModal>
      
    </div>
    <div v-else class="text-center py-10">
      <p class="text-gray-500">Account not found</p>
      <UButton to="/accounts" class="mt-4">Go Back</UButton>
    </div>
  </UContainer>
</template>


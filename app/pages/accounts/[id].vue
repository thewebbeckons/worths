<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date'

const route = useRoute()
const { accounts, updateBalance, getBalanceHistory } = useNetWorth()

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

const isUpdateModalOpen = ref(false)
const newBalanceValue = ref(0)
const today = new Date()
const newBalanceDate = ref<DateValue>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()))

// Initialize update form with current balance
watchEffect(() => {
  if (account.value) {
    newBalanceValue.value = account.value.latestBalance
  }
})

const saveBalanceUpdate = async () => {
  const dateStr = `${newBalanceDate.value.year}-${String(newBalanceDate.value.month).padStart(2, '0')}-${String(newBalanceDate.value.day).padStart(2, '0')}`
  await updateBalance(accountId, newBalanceValue.value, dateStr)
  await reloadHistory()
  isUpdateModalOpen.value = false
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
        <UButton label="Update Balance" @click="isUpdateModalOpen = true" icon="i-heroicons-pencil-square" />
      </div>

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
      
      <!-- Update Balance Modal -->
      <UModal v-model:open="isUpdateModalOpen">
        <template #content>
          <div class="p-4">
            <h3 class="text-lg font-bold mb-4">Update Balance</h3>
            
            <div class="space-y-4">
              <UFormField label="Date">
                <UInputDate v-model="newBalanceDate">
                  <template #trailing>
                    <UPopover>
                      <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Select a date" class="px-0" />
                      <template #content>
                        <UCalendar v-model="newBalanceDate" class="p-2" />
                      </template>
                    </UPopover>
                  </template>
                </UInputDate>
              </UFormField>
              
              <UFormField label="New Balance">
                <UInputNumber v-model="newBalanceValue" :format-options="{ style: 'currency', currency: 'USD' }" :step="0.01" />
              </UFormField>

              <div class="flex justify-end gap-2 mt-4">
                <UButton label="Cancel" color="neutral" variant="ghost" @click="isUpdateModalOpen = false" />
                <UButton label="Save" color="primary" @click="saveBalanceUpdate" />
              </div>
            </div>
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

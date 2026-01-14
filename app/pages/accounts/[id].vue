<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const route = useRoute()
const { accounts, getBalanceHistory } = useNetWorth()

const accountId = route.params.id as string
const account = computed(() => accounts.value.find(a => a.id === accountId))
const notesText = computed(() => {
  if (!account.value?.notes) return ''
  return account.value.notes.replace(/<[^>]*>/g, '')
})

// Load balance history asynchronously
const balanceHistory = ref<{ date: string, value: number }[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)

onMounted(async () => {
  if (accountId) {
    try {
      balanceHistory.value = await getBalanceHistory(accountId)
    } catch (error) {
      console.error('[AccountDetail] Failed to load balance history:', error)
      loadError.value = 'Failed to load balance history'
    } finally {
      isLoading.value = false
    }
  }
})

// Reload history after balance update
const reloadHistory = async () => {
  try {
    balanceHistory.value = await getBalanceHistory(accountId)
    loadError.value = null
  } catch (error) {
    console.error('[AccountDetail] Failed to reload balance history:', error)
    loadError.value = 'Failed to reload balance history'
  }
}

const historyColumns = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'value', header: 'Balance' }
]

const historyRows = computed(() => {
  return [...balanceHistory.value].reverse().map(b => ({
    date: b.date,
    value: formatCurrency(b.value)
  }))
})

const isEditModalOpen = ref(false)
const isUpdateBalanceModalOpen = ref(false)
const isNotesModalOpen = ref(false)

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
    <div
      v-if="account"
      class="space-y-6"
    >
      <UButton
        variant="link"
        icon="i-heroicons-arrow-left"
        to="/accounts"
        class="p-0 mb-2"
      >
        Back to Accounts
      </UButton>
      <div class="flex justify-between items-start gap-4">
        <div class="space-y-2 flex-1">
          <h1 class="text-3xl font-bold">
            {{ account.name }}
          </h1>
          <div class="flex gap-2 text-gray-500">
            <UBadge color="neutral">
              {{ account.category }}
            </UBadge>
            <UBadge
              color="neutral"
              variant="outline"
            >
              {{ account.owner }}
            </UBadge>
            <UBadge
              :color="account.type === 'asset' ? 'success' : 'error'"
              variant="soft"
            >
              {{ account.type === 'asset' ? 'Asset' : 'Liability' }}
            </UBadge>
          </div>
        </div>

        <div class="flex gap-2 shrink-0">
          <UButton
            v-if="account.notes"
            icon="i-lucide-sticky-note"
            color="neutral"
            variant="soft"
            label="Notes"
            aria-label="View Notes"
            @click="isNotesModalOpen = true"
          />
          <UButton
            label="Update Balance"
            icon="i-lucide-circle-dollar-sign"
            variant="soft"
            @click="isUpdateBalanceModalOpen = true"
          />
          <UButton
            label="Edit Account"
            icon="i-lucide-square-pen"
            @click="isEditModalOpen = true"
          />
        </div>
      </div>

      <!-- Balance History Chart -->
      <UCard
        variant="outline"
        class="shadow-sm"
      >
        <template #header>
          <div class="text-lg font-bold">
            Balance Trend
          </div>
        </template>
        <div
          v-if="isLoading"
          class="flex justify-center py-8"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin text-2xl text-gray-500"
          />
        </div>
        <div
          v-else-if="loadError"
          class="text-center py-8 text-error"
        >
          {{ loadError }}
        </div>
        <BalanceHistoryChart
          v-else
          :balance-history="balanceHistory"
          :account-type="account?.type"
        />
      </UCard>

      <!-- Balance History Table -->
      <UCard
        variant="outline"
        class="shadow-sm"
      >
        <template #header>
          <div class="text-lg font-bold">
            Balance History
          </div>
        </template>
        <div
          v-if="isLoading"
          class="flex justify-center py-8"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin text-2xl text-gray-500"
          />
        </div>
        <div
          v-else-if="loadError"
          class="text-center py-8 text-error"
        >
          {{ loadError }}
        </div>
        <div
          v-else-if="historyRows.length === 0"
          class="text-center py-8 text-gray-500"
        >
          No balance history yet
        </div>
        <UTable
          v-else
          :columns="historyColumns"
          :data="historyRows"
        />
      </UCard>

      <!-- Edit Account Modal -->
      <UModal v-model:open="isEditModalOpen">
        <template #content>
          <div class="p-4">
            <h3 class="text-lg font-bold mb-4">
              Edit Account
            </h3>
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
            <h3 class="text-lg font-bold mb-4">
              Update Balance
            </h3>
            <UpdateBalanceForm
              :preselected-account-id="accountId"
              @close="isUpdateBalanceModalOpen = false"
              @saved="handleBalanceUpdated"
            />
          </div>
        </template>
      </UModal>

      <!-- Notes Modal -->
      <UModal v-model:open="isNotesModalOpen">
        <template #content>
          <div class="p-4">
            <div class="flex items-center gap-2 mb-4">
              <UIcon
                name="i-lucide-sticky-note"
                class="w-5 h-5 text-muted"
              />
              <h3 class="text-lg font-bold">
                Notes
              </h3>
            </div>
            <div class="text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {{ notesText }}
            </div>
            <div class="flex justify-end mt-4">
              <UButton
                label="Close"
                color="neutral"
                variant="ghost"
                @click="isNotesModalOpen = false"
              />
            </div>
          </div>
        </template>
      </UModal>
    </div>
    <div
      v-else
      class="text-center py-10"
    >
      <p class="text-gray-500">
        Account not found
      </p>
      <UButton
        to="/accounts"
        class="mt-4"
      >
        Go Back
      </UButton>
    </div>
  </UContainer>
</template>

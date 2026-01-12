<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { CalendarDate, type DateValue } from '@internationalized/date'

const { accounts, updateBalance, deleteAccount } = useNetWorth()

type AccountRow = {
  id: string
  name: string
  bank: string
  category: string
  owner: string
  ownerColor: string
  type: 'asset' | 'liability'
  balance: number
}

type EditableAccount = {
  id: string
  name: string
  bank: string
  category: string
  owner: string
  type: 'asset' | 'liability'
  latestBalance: number
  notes?: string
}

type SortDirection = 'asc' | 'desc' | false

type SortColumn = {
  getIsSorted: () => SortDirection
  toggleSorting: (desc: boolean) => void
}

// Props for filter values (controlled by parent)
const props = defineProps<{
  searchQuery?: string
  categoryFilter?: string[]
  ownerFilter?: string[]
  bankFilter?: string[]
}>()

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'bank', header: 'Bank' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'owner', header: 'Owner' },
  {
    accessorKey: 'balance',
    header: ({ column }: { column: SortColumn }) => {
      const isSorted = column.getIsSorted()
      return h(resolveComponent('UButton'), {
        color: 'neutral',
        variant: 'ghost',
        label: 'Current Balance',
        icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  { id: 'actions' }
]

const sorting = ref([])

const items = computed<AccountRow[]>(() => {
  return accounts.value.map(acc => ({
    id: acc.id,
    name: acc.name,
    bank: acc.bank,
    category: acc.category,
    owner: acc.owner,
    ownerColor: acc.ownerColor,
    type: acc.type,
    balance: acc.latestBalance
  }))
})

// Apply filters from props
const filteredItems = computed(() => {
  return items.value.filter((item) => {
    // Search filter (name or bank)
    if (props.searchQuery) {
      const query = props.searchQuery.toLowerCase()
      const matchesName = item.name.toLowerCase().includes(query)
      const matchesBank = item.bank.toLowerCase().includes(query)
      if (!matchesName && !matchesBank) return false
    }
    // Dropdown filters
    if (props.categoryFilter && props.categoryFilter.length > 0 && !props.categoryFilter.includes(item.category)) return false
    if (props.ownerFilter && props.ownerFilter.length > 0 && !props.ownerFilter.includes(item.owner)) return false
    if (props.bankFilter && props.bankFilter.length > 0 && !props.bankFilter.includes(item.bank)) return false
    return true
  })
})

// Metrics computed properties
const totalAccountsCount = computed(() => items.value.length)
const filteredAccountsCount = computed(() => filteredItems.value.length)
const filteredAccountsTotal = computed(() => {
  return filteredItems.value.reduce((sum, item) => {
    // Subtract liabilities from the total
    if (item.type === 'liability') {
      return sum - item.balance
    }
    return sum + item.balance
  }, 0)
})

// State for updating balance
const isUpdateModalOpen = ref(false)
const selectedAccount = ref<AccountRow | null>(null)
const newBalanceValue = ref(0)
const today = new Date()
const newBalanceDate = ref<DateValue>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()))

const openUpdateModal = (row: AccountRow) => {
  selectedAccount.value = row
  newBalanceValue.value = row.balance
  isUpdateModalOpen.value = true
}

const saveBalanceUpdate = async () => {
  if (selectedAccount.value) {
    const dateStr = `${newBalanceDate.value.year}-${String(newBalanceDate.value.month).padStart(2, '0')}-${String(newBalanceDate.value.day).padStart(2, '0')}`
    await updateBalance(selectedAccount.value.id, newBalanceValue.value, dateStr)
    isUpdateModalOpen.value = false
  }
}

// State for editing account
const isEditModalOpen = ref(false)
const accountToEdit = ref<EditableAccount | null>(null)

const openEditModal = (row: AccountRow) => {
  accountToEdit.value = {
    id: row.id,
    name: row.name,
    bank: row.bank,
    category: row.category,
    owner: row.owner,
    type: row.type,
    latestBalance: row.balance
  }
  isEditModalOpen.value = true
}

// State for delete confirmation
const isDeleteModalOpen = ref(false)
const accountToDelete = ref<AccountRow | null>(null)

const openDeleteModal = (row: AccountRow) => {
  accountToDelete.value = row
  isDeleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (accountToDelete.value) {
    await deleteAccount(accountToDelete.value.id)
    isDeleteModalOpen.value = false
    accountToDelete.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Metrics Bar -->
    <div class="flex items-center justify-between text-sm">
      <span class="text-muted">
        Showing <span class="font-medium text-default">{{ filteredAccountsCount }}</span> out of <span class="font-medium text-default">{{ totalAccountsCount }}</span> accounts
      </span>
      <span class="font-medium">
        Accounts Total: <span :class="filteredAccountsTotal < 0 ? 'text-error' : 'text-primary'">{{ formatCurrency(filteredAccountsTotal) }}</span>
      </span>
    </div>

    <UTable
      v-model:sorting="sorting"
      :columns="columns"
      :data="filteredItems"
    >
      <template #owner-cell="{ row }">
        <div class="flex items-center gap-2">
          <OwnerBadge
            :name="row.original.owner"
            :color="row.original.ownerColor"
            size="xs"
          />
        </div>
      </template>

      <template #balance-cell="{ row }">
        <span :class="(row.original.type === 'liability' && row.original.balance > 0) || (row.original.type !== 'liability' && row.original.balance < 0) ? 'text-error' : 'text-primary'">
          {{ formatCurrency(row.original.balance) }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-2">
          <UTooltip text="Update Balance">
            <UButton
              icon="i-lucide-circle-dollar-sign"
              color="success"
              variant="ghost"
              class="cursor-pointer"
              @click="openUpdateModal(row.original)"
            />
          </UTooltip>
          <UTooltip text="Edit Account">
            <UButton
              icon="i-lucide-pencil"
              color="primary"
              variant="ghost"
              class="cursor-pointer"
              @click="openEditModal(row.original)"
            />
          </UTooltip>
          <UTooltip text="View History">
            <UButton
              icon="i-lucide-chart-no-axes-combined"
              color="neutral"
              variant="ghost"
              :to="`/accounts/${row.original.id}`"
            />
          </UTooltip>
          <UTooltip text="Delete Account">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              class="cursor-pointer"
              @click="openDeleteModal(row.original)"
            />
          </UTooltip>
        </div>
      </template>
    </UTable>

    <!-- Update Balance Modal -->
    <UModal v-model:open="isUpdateModalOpen">
      <template #content>
        <div class="p-4">
          <h3 class="text-lg font-bold mb-4">
            Update Balance for {{ selectedAccount?.name }}
          </h3>

          <div class="space-y-4">
            <UFormField label="Date">
              <UInputDate
                ref="inputDate"
                v-model="newBalanceDate"
              >
                <template #trailing>
                  <UPopover>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-calendar"
                      aria-label="Select a date"
                      class="px-0"
                    />
                    <template #content>
                      <UCalendar
                        v-model="newBalanceDate"
                        class="p-2"
                      />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>

            <UFormField label="New Balance">
              <UInputNumber
                v-model="newBalanceValue"
                :format-options="{ style: 'currency', currency: 'USD' }"
                :step="0.01"
              />
            </UFormField>

            <div class="flex justify-end gap-2 mt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                @click="isUpdateModalOpen = false"
              />
              <UButton
                label="Save"
                color="primary"
                @click="saveBalanceUpdate"
              />
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Account Modal -->
    <UModal
      v-model:open="isEditModalOpen"
      title="Edit Account"
    >
      <template #body>
        <EditAccountForm
          v-if="accountToEdit"
          :account="accountToEdit"
          @close="isEditModalOpen = false"
          @saved="isEditModalOpen = false"
        />
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-4">
          <h3 class="text-lg font-bold mb-4">
            Delete Account
          </h3>
          <p class="mb-4">
            Are you sure you want to delete <strong>{{ accountToDelete?.name }}</strong>? This action cannot be undone and will remove all balance history for this account.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="isDeleteModalOpen = false"
            />
            <UButton
              label="Delete"
              color="error"
              @click="confirmDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

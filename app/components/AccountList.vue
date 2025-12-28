<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { CalendarDate, type DateValue } from '@internationalized/date'

const { accounts, updateBalance } = useNetWorth()

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
    header: ({ column }: any) => {
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

const items = computed(() => {
  return accounts.value.map(acc => ({
    id: acc.id,
    name: acc.name,
    bank: acc.bank,
    category: acc.category,
    owner: acc.owner,
    ownerAvatar: acc.ownerAvatar,
    type: acc.type,
    balance: acc.latestBalance
  }))
})

// State for updating balance
const isUpdateModalOpen = ref(false)
const selectedAccount = ref<any>(null)
const newBalanceValue = ref(0)
const today = new Date()
const newBalanceDate = ref<DateValue>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()))
const inputDateRef = useTemplateRef('inputDate')

const openUpdateModal = (row: any) => {
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
</script>

<template>
  <UTable v-model:sorting="sorting" :columns="columns" :data="items">
      <template #owner-cell="{ row }">
        <div class="flex items-center gap-2">
          <UAvatar :src="row.original.ownerAvatar" :alt="row.original.owner" size="xs" />
        </div>
      </template>

      <template #balance-cell="{ row }">
        <span :class="row.original.balance < 0 ? 'text-error' : 'text-primary'">
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
          <UTooltip text="View History">
            <UButton 
              icon="i-lucide-chart-no-axes-combined"  
              color="primary" 
              variant="ghost" 
              :to="`/accounts/${row.original.id}`"
            />
          </UTooltip>
        </div>
      </template>
    </UTable>

    <!-- Update Balance Modal -->
    <UModal v-model:open="isUpdateModalOpen">
      <template #content>
        <div class="p-4">
          <h3 class="text-lg font-bold mb-4">Update Balance for {{ selectedAccount?.name }}</h3>
          
          <div class="space-y-4">
            <UFormField label="Date">
              <UInputDate ref="inputDate" v-model="newBalanceDate">
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
</template>

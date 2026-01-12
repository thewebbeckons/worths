<script setup lang="ts">
const { accounts } = useNetWorth()

const isAddAccountOpen = ref(false)

// Filter state (lifted from AccountList)
const searchInput = useTemplateRef('searchInput')
const searchQuery = ref('')
const categoryFilter = ref<string[]>([])
const ownerFilter = ref<string[]>([])
const bankFilter = ref<string[]>([])

// Keyboard shortcut to focus search
defineShortcuts({
  '/': () => {
    searchInput.value?.inputRef?.focus()
  }
})

// Compute items and filter options from accounts
const items = computed(() => {
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

const categoryOptions = computed(() => {
  const unique = [...new Set(items.value.map(i => i.category))].sort()
  return unique.map(c => ({ label: c, value: c }))
})

const ownerOptions = computed(() => {
  const unique = [...new Set(items.value.map(i => i.owner))].sort()
  return unique.map(o => ({ label: o, value: o }))
})

const bankOptions = computed(() => {
  const unique = [...new Set(items.value.map(i => i.bank))].sort()
  return unique.map(b => ({ label: b, value: b }))
})
</script>

<template>
  <UDashboardPanel id="accounts">
    <template #header>
      <UDashboardNavbar
        title="Accounts"
        description="Manage your assets and liabilities"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Add Account"
            icon="i-heroicons-plus"
            @click="isAddAccountOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex items-center justify-between gap-4">
          <UInput
            ref="searchInput"
            v-model="searchQuery"
            placeholder="Search by name or bank..."
            icon="i-lucide-search"
            clear
            class="w-64"
          >
            <template #trailing>
              <UKbd value="/" />
            </template>
          </UInput>
          <div class="flex flex-wrap gap-4">
            <USelectMenu
              v-if="categoryOptions.length > 1"
              v-model="categoryFilter"
              :items="categoryOptions"
              value-key="value"
              placeholder="All Categories"
              multiple
              class="w-48"
            />
            <USelectMenu
              v-if="ownerOptions.length > 1"
              v-model="ownerFilter"
              :items="ownerOptions"
              value-key="value"
              placeholder="All Owners"
              multiple
              class="w-48"
            />
            <USelectMenu
              v-if="bankOptions.length > 1"
              v-model="bankFilter"
              :items="bankOptions"
              value-key="value"
              placeholder="All Banks"
              multiple
              class="w-48"
            />
          </div>
        </div>

        <UCard
          variant="outline"
          class="shadow-sm"
        >
          <AccountList
            :search-query="searchQuery"
            :category-filter="categoryFilter"
            :owner-filter="ownerFilter"
            :bank-filter="bankFilter"
          />
        </UCard>
      </div>

      <UModal
        v-model:open="isAddAccountOpen"
        title="Add Account"
      >
        <template #body>
          <AccountForm @close="isAddAccountOpen = false" />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

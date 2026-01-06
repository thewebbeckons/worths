<script setup lang="ts">
const { accounts } = useNetWorth()
const { categories } = useDatabase()
const toast = useToast()

// Exclusion state
const excludedCategoryIds = ref<Set<number>>(new Set())
const excludedAccountIds = ref<Set<string>>(new Set())

// Group accounts by category for display
const accountsByCategory = computed(() => {
  const grouped: Record<string, typeof accounts.value> = {}
  
  for (const acc of accounts.value) {
    if (!grouped[acc.category]) {
      grouped[acc.category] = []
    }
    grouped[acc.category]!.push(acc)
  }
  
  return grouped
})

// Get category ID by name
const getCategoryId = (categoryName: string): number | undefined => {
  const cat = categories.value.find(c => c.name === categoryName)
  return cat?.id
}

// Check if a category is excluded
const isCategoryExcluded = (categoryName: string): boolean => {
  const catId = getCategoryId(categoryName)
  return catId !== undefined && excludedCategoryIds.value.has(catId)
}

// Toggle category exclusion
const toggleCategory = (categoryName: string) => {
  const catId = getCategoryId(categoryName)
  if (catId === undefined) return
  
  const newSet = new Set(excludedCategoryIds.value)
  if (newSet.has(catId)) {
    newSet.delete(catId)
  } else {
    newSet.add(catId)
  }
  excludedCategoryIds.value = newSet
}

// Check if an account is excluded
const isAccountExcluded = (accountId: string): boolean => {
  return excludedAccountIds.value.has(accountId)
}

// Toggle account exclusion
const toggleAccount = (accountId: string) => {
  const newSet = new Set(excludedAccountIds.value)
  if (newSet.has(accountId)) {
    newSet.delete(accountId)
  } else {
    newSet.add(accountId)
  }
  excludedAccountIds.value = newSet
}

// Get filtered accounts based on exclusions
const filteredAccounts = computed(() => {
  return accounts.value.filter(acc => {
    if (excludedAccountIds.value.has(acc.id)) {
      return false
    }
    const catId = getCategoryId(acc.category)
    if (catId !== undefined && excludedCategoryIds.value.has(catId)) {
      return false
    }
    return true
  })
})

// Count of accounts that will be exported
const exportCount = computed(() => filteredAccounts.value.length)
const totalCount = computed(() => accounts.value.length)

// Reset exclusions
const resetExclusions = () => {
  excludedCategoryIds.value = new Set()
  excludedAccountIds.value = new Set()
}

// Export to CSV
const exportToCsv = () => {
  const today = new Date().toISOString().slice(0, 10)
  const header = 'date,name,bank,category,owner,balance'
  
  const rows = filteredAccounts.value.map(account => {
    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }
    
    return [
      today,
      escapeCsvField(account.name),
      escapeCsvField(account.bank),
      escapeCsvField(account.category),
      escapeCsvField(account.owner),
      account.latestBalance.toString()
    ].join(',')
  })
  
  const csvContent = [header, ...rows].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `account-balances-${today}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  toast.add({ title: `Exported ${exportCount.value} accounts`, color: 'success' })
}
</script>

<template>
  <UCard variant="soft">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold">Export Accounts</h3>
          <p class="text-sm text-muted">Export your account balances to CSV to use in excel or google sheets</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            v-if="excludedCategoryIds.size > 0 || excludedAccountIds.size > 0"
            label="Reset"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="resetExclusions"
          />
          <UButton
            label="Export CSV"
            icon="i-heroicons-arrow-down-tray"
            :disabled="exportCount === 0"
            class="cursor-pointer"
            @click="exportToCsv"
          />
        </div>
      </div>
    </template>

    <div class="space-y-4">
    <p class="text-sm text-muted">Click on an account to exclude it from the export</p>
      <!-- Export count indicator -->
      <p class="text-sm" :class="exportCount < totalCount ? 'text-warning' : 'text-muted'">
        <template v-if="exportCount < totalCount">
          Exporting {{ exportCount }} of {{ totalCount }} accounts
        </template>
        <template v-else>
          Exporting all {{ totalCount }} accounts
        </template>
      </p>

      <!-- Categories section -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium">Exclude by Category</h4>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="cat in Object.keys(accountsByCategory)"
            :key="cat"
            :label="cat"
            size="sm"
            :variant="isCategoryExcluded(cat) ? 'solid' : 'outline'"
            :color="isCategoryExcluded(cat) ? 'error' : 'neutral'"
            @click="toggleCategory(cat)"
          />
        </div>
      </div>

      <!-- Accounts section -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium">Exclude by Account</h4>
        <div class="space-y-3">
          <div v-for="(accs, category) in accountsByCategory" :key="category" class="space-y-1">
            <p class="text-xs text-muted font-medium">{{ category }}</p>
            <div class="flex flex-wrap gap-1">
              <UButton
                v-for="acc in accs"
                :key="acc.id"
                :label="acc.name"
                size="xs"
                :variant="isAccountExcluded(acc.id) ? 'solid' : 'soft'"
                :color="isAccountExcluded(acc.id) ? 'error' : 'neutral'"
                :disabled="isCategoryExcluded(acc.category)"
                @click="toggleAccount(acc.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

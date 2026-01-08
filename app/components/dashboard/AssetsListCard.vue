<script setup lang="ts">
const { getAccountsGroupedByCategory, totalAssets } = useNetWorth()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// Get grouped assets
const assetGroups = computed(() => getAccountsGroupedByCategory('asset'))

// Transform to accordion items format
const accordionItems = computed(() => 
  assetGroups.value.map(group => ({
    label: group.category,
    value: group.category,
    content: '', // We'll use custom slot
    total: group.total,
    accounts: group.accounts
  }))
)
</script>

<template>
  <UCard class="md:w-1/2 shadow-sm" variant="outline">
    <div v-if="accordionItems.length > 0" class="space-y-2">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl uppercase font-bold">Assets</h2>
        <NuxtLink to="/accounts" class="text-sm text-primary hover:underline">View More</NuxtLink>
      </div>
      
      <template v-for="item in accordionItems" :key="item.value">
        <!-- Single item: show directly without accordion -->
        <div
          v-if="item.accounts.length === 1"
          class="flex justify-between items-center py-3 px-4 bg-muted shadow-xs rounded-lg"
        >
          <div class="flex items-center gap-3">
            <OwnerBadge v-if="item.accounts[0]?.owner" :name="item.accounts[0]?.owner ?? ''" :color="item.accounts[0]?.ownerColor" />
            <div class="flex flex-col">
              <span class="font-medium">{{ item.label }}</span>
              <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.accounts[0]?.bank }}</span>
            </div>
          </div>
          <span :class="item.total >= 0 ? 'text-primary' : 'text-error'" class="font-semibold">
            {{ formatCurrency(item.total) }}
          </span>
        </div>
        
        <!-- Multiple items: use accordion -->
        <UAccordion
          v-else
          :items="[item]"
          type="multiple"
          :ui="{ root: 'bg-muted rounded-lg', item: 'px-4' }"
        >
          <template #default="{ item: accordionItem }">
            <UButton
              color="neutral"
              variant="ghost"
              class="w-full cursor-pointer"
            >
              <div class="flex flex-col items-start">
                <span class="font-medium">{{ accordionItem.label }}</span>
                <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ accordionItem.accounts.length }} accounts</span>
              </div>
            </UButton>
          </template>

          <template #trailing="{ item: accordionItem }">
            <div class="flex items-center gap-2 ms-auto">
              <span class="text-primary font-semibold">
                {{ formatCurrency(accordionItem.total) }}
              </span>
              <span class="iconify i-lucide:chevron-down shrink-0 size-5 group-data-[state=open]:rotate-180 transition-transform duration-200" aria-hidden="true" data-slot="trailingIcon"></span>
            </div>
          </template>
          
          <template #body="{ item: accordionItem }">
            <div class="space-y-1 pb-2">
              <div
                v-for="account in accordionItem.accounts"
                :key="account.id"
                class="flex justify-between items-center py-2 px-3 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <OwnerBadge :name="account.owner" :color="account.ownerColor" size="sm" />
                  <div class="flex flex-col">
                    <span class="font-medium text-sm">{{ account.name }}</span>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ account.bank }}</span>
                  </div>
                </div>
                <span :class="account.balance >= 0 ? 'text-primary' : 'text-error'" class="font-medium">
                  {{ formatCurrency(account.balance) }}
                </span>
              </div>
            </div>
          </template>
        </UAccordion>
      </template>
    </div>

    <div v-else class="text-neutral-500 dark:text-neutral-400 text-center py-8">
      No asset accounts found
    </div>
  </UCard>
</template>

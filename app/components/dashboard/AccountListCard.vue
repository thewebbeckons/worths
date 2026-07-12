<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const props = defineProps<{
  type: 'asset' | 'liability'
  title: string
}>()

const { getAccountsGroupedByCategory } = useNetWorth()

// Get grouped accounts by type
const accountGroups = computed(() => getAccountsGroupedByCategory(props.type))

// Transform to accordion items format
const accordionItems = computed(() =>
  accountGroups.value.map(group => ({
    label: group.category,
    value: group.category,
    content: '',
    total: group.total,
    accounts: group.accounts
  }))
)

// Color logic differs for assets vs liabilities
// Assets: positive = primary (good), negative = error (bad)
// Liabilities: negative = primary (paid off/credit), positive = error (debt)
const getValueColor = (value: number) => {
  if (props.type === 'asset') {
    return value >= 0 ? 'text-primary' : 'text-error'
  }
  return value < 0 ? 'text-primary' : 'text-error'
}

// For liabilities, we show absolute value and indicate if paid off
const formatDisplayValue = (value: number) => {
  if (props.type === 'liability' && value < 0) {
    return formatCurrency(Math.abs(value))
  }
  return formatCurrency(value)
}

// Check if liability is paid off (negative balance = credit/overpaid)
const isPaidOff = (value: number) => {
  return props.type === 'liability' && value < 0
}

const emptyMessage = computed(() =>
  props.type === 'asset' ? 'No asset accounts found' : 'No liability accounts found'
)
</script>

<template>
  <UCard
    class="h-full shadow-sm"
    variant="outline"
  >
    <div
      v-if="accordionItems.length > 0"
      class="space-y-2"
    >
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl uppercase font-bold">
          {{ title }}
        </h2>
        <NuxtLink
          to="/accounts"
          class="text-sm text-primary hover:underline"
        >View More</NuxtLink>
      </div>

      <template
        v-for="item in accordionItems"
        :key="item.value"
      >
        <!-- Single item: show directly without accordion -->
        <div
          v-if="item.accounts.length === 1"
          class="flex justify-between items-center py-3 px-4 bg-muted shadow-xs rounded-lg"
        >
          <div class="flex items-center gap-3">
            <OwnerBadge
              v-if="item.accounts[0]?.owner"
              :name="item.accounts[0]?.owner ?? ''"
              :color="item.accounts[0]?.ownerColor"
            />
            <div class="flex flex-col">
              <span class="font-medium">{{ item.label }}</span>
              <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.accounts[0]?.bank }}</span>
            </div>
          </div>
          <span
            :class="getValueColor(item.total)"
            class="font-semibold inline-flex items-center gap-1"
          >
            {{ formatDisplayValue(item.total) }}
            <UIcon
              v-if="isPaidOff(item.total)"
              name="lucide-circle-check"
              class="size-4"
            />
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
              <span
                :class="getValueColor(accordionItem.total)"
                class="font-semibold inline-flex items-center gap-1"
              >
                {{ formatDisplayValue(accordionItem.total) }}
                <UIcon
                  v-if="isPaidOff(accordionItem.total)"
                  name="lucide-circle-check"
                  class="size-4"
                />
              </span>
              <span
                class="iconify i-lucide:chevron-down shrink-0 size-5 group-data-[state=open]:rotate-180 transition-transform duration-200"
                aria-hidden="true"
                data-slot="trailingIcon"
              />
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
                  <OwnerBadge
                    :name="account.owner"
                    :color="account.ownerColor"
                    size="sm"
                  />
                  <div class="flex flex-col">
                    <span class="font-medium text-sm">{{ account.name }}</span>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ account.bank }}</span>
                  </div>
                </div>
                <span
                  :class="getValueColor(account.balance)"
                  class="font-medium inline-flex items-center gap-1"
                >
                  {{ formatDisplayValue(account.balance) }}
                  <UIcon
                    v-if="isPaidOff(account.balance)"
                    name="lucide-circle-check"
                    class="size-4"
                  />
                </span>
              </div>
            </div>
          </template>
        </UAccordion>
      </template>
    </div>

    <div
      v-else
      class="text-neutral-500 dark:text-neutral-400 text-center py-8"
    >
      {{ emptyMessage }}
    </div>
  </UCard>
</template>

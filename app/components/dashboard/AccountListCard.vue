<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const props = defineProps<{
  type: 'asset' | 'liability'
  title: string
}>()

const { getAccountsGroupedByCategory } = useNetWorth()

// Get grouped accounts by type
const accountGroups = computed(() => getAccountsGroupedByCategory(props.type))

// Count total items
const itemCount = computed(() => accountGroups.value.length)

// Get the section header color based on type
const headerColor = computed(() => props.type === 'asset' ? 'text-neutral-500' : 'text-neutral-500')

// Item limit for initial display (show first 5)
const displayLimit = 5
const visibleGroups = computed(() => accountGroups.value.slice(0, displayLimit))
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <h2
          class="text-base font-bold uppercase"
          :class="headerColor"
        >
          {{ title }}
        </h2>
        <span
          class="text-sm"
          :class="headerColor"
        >
          {{ itemCount }} Items
        </span>
      </div>
      <NuxtLink
        to="/accounts"
        class="text-sm text-primary hover:underline"
      >
        View More
      </NuxtLink>
    </div>

    <div
      v-if="visibleGroups.length > 0"
      class="space-y-3"
    >
      <template
        v-for="group in visibleGroups"
        :key="group.category"
      >
        <!-- Single account: show directly without accordion -->
        <div
          v-if="group.accounts.length === 1"
          class="flex justify-between items-center py-4 px-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex items-center justify-center w-11 h-11 rounded-xl"
              :class="`bg-${group.color}-100 dark:bg-${group.color}-900/20`"
            >
              <UIcon
                v-if="group.icon"
                :name="group.icon"
                :class="`text-${group.color}-600 dark:text-${group.color}-400`"
                class="w-6 h-6"
              />
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                {{ group.category }}
              </span>
              <span class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ group.accounts[0]?.bank }}
              </span>
            </div>
          </div>
          <span class="font-semibold text-base text-neutral-900 dark:text-neutral-100">
            {{ formatCurrency(group.total) }}
          </span>
        </div>

        <!-- Multiple accounts: use accordion -->
        <UAccordion
          v-else
          :items="[{ value: group.category, label: group.category }]"
          type="multiple"
          class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800"
        >
          <template #default>
            <div class="flex items-center gap-4 w-full">
              <div
                class="flex items-center justify-center w-11 h-11 rounded-xl"
                :class="`bg-${group.color}-100 dark:bg-${group.color}-900/20`"
              >
                <UIcon
                  v-if="group.icon"
                  :name="group.icon"
                  :class="`text-${group.color}-600 dark:text-${group.color}-400`"
                  class="w-6 h-6"
                />
              </div>
              <div class="flex flex-col">
                <span class="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                  {{ group.category }}
                </span>
                <span class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ group.accounts.length }} accounts
                </span>
              </div>
            </div>
          </template>

          <template #trailing>
            <div class="flex items-center gap-3 ms-auto">
              <span class="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                {{ formatCurrency(group.total) }}
              </span>
              <span
                class="iconify i-lucide:chevron-down shrink-0 size-5 text-neutral-400 group-data-[state=open]:rotate-180 transition-transform duration-200"
                aria-hidden="true"
              />
            </div>
          </template>

          <template #body>
            <div class="space-y-2 px-5 pb-4">
              <div
                v-for="account in group.accounts"
                :key="account.id"
                class="flex justify-between items-center py-3 px-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
              >
                <div class="flex items-center gap-3">
                  <OwnerBadge
                    :name="account.owner"
                    :color="account.ownerColor"
                    size="sm"
                  />
                  <div class="flex flex-col">
                    <span class="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                      {{ account.name }}
                    </span>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400">
                      {{ account.bank }}
                    </span>
                  </div>
                </div>
                <span class="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                  {{ formatCurrency(account.balance) }}
                </span>
              </div>
            </div>
          </template>
        </UAccordion>
      </template>

      <!-- Add button shown after the list -->
      <button
        class="flex items-center justify-center w-full py-4 px-5 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
        @click="() => {}"
      >
        <div class="flex items-center justify-center w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800">
          <UIcon
            name="lucide-plus"
            class="w-5 h-5 text-neutral-500 dark:text-neutral-400"
          />
        </div>
        <span class="ml-3 text-sm text-neutral-500 dark:text-neutral-400">
          Add another {{ type === 'asset' ? 'asset' : 'liability' }}
        </span>
      </button>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800"
    >
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
        <UIcon
          name="lucide-plus"
          class="w-8 h-8 text-neutral-400 dark:text-neutral-500"
        />
      </div>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
        No {{ type === 'asset' ? 'assets' : 'liabilities' }} found
      </p>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        @click="() => {}"
      >
        Add your first {{ type === 'asset' ? 'asset' : 'liability' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { accounts } = useNetWorth();

const isAddAccountOpen = ref(false);

// Filter state (lifted from AccountList)
const searchInput = useTemplateRef("searchInput");
const searchQuery = ref("");
const categoryFilter = ref<string[]>([]);
const ownerFilter = ref<string[]>([]);
const bankFilter = ref<string[]>([]);

// Keyboard shortcut to focus search
defineShortcuts({
  "/": () => {
    searchInput.value?.inputRef?.focus();
  },
});

// Compute items and filter options from accounts
const items = computed(() => {
  return accounts.value.map((acc) => ({
    id: acc.id,
    name: acc.name,
    bank: acc.bank,
    category: acc.category,
    owner: acc.owner,
    ownerColor: acc.ownerColor,
    type: acc.type,
    balance: acc.latestBalance,
  }));
});

const categoryOptions = computed(() => {
  const unique = [...new Set(items.value.map((i) => i.category))].sort();
  return unique.map((c) => ({ label: c, value: c }));
});

const ownerOptions = computed(() => {
  const unique = [...new Set(items.value.map((i) => i.owner))].sort();
  return unique.map((o) => ({ label: o, value: o }));
});

const bankOptions = computed(() => {
  const unique = [...new Set(items.value.map((i) => i.bank))].sort();
  return unique.map((b) => ({ label: b, value: b }));
});
</script>

<template>
  <div class="pb-14">
    <UContainer class="flex flex-col gap-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-14">
      <div>
        <h1 class="page-title">Your accounts</h1>
      </div>
      <div>
        <UButton
          label="Add account"
          icon="i-heroicons-plus"
          size="lg"
          @click="isAddAccountOpen = true"
        />
      </div>
    </UContainer>

    <UContainer class="space-y-6 py-8">
      <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <UInput
          ref="searchInput"
          v-model="searchQuery"
          placeholder="Search by name or bank..."
          icon="i-lucide-search"
          clear
          class="w-full lg:w-72"
        >
          <template #trailing>
            <UKbd value="/" />
          </template>
        </UInput>
        <div class="flex flex-wrap gap-3">
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

      <UCard variant="outline">
        <AccountList
          :search-query="searchQuery"
          :category-filter="categoryFilter"
          :owner-filter="ownerFilter"
          :bank-filter="bankFilter"
        />
      </UCard>
    </UContainer>

    <UModal v-model:open="isAddAccountOpen" title="Add Account">
      <template #body>
        <AccountForm @close="isAddAccountOpen = false" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { accounts } = useNetWorth()

const isAddAccountOpen = ref(false)
</script>

<template>
  <UContainer class="py-6 space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Accounts</h1>
        <p class="text-gray-500">Manage your assets and liabilities</p>
      </div>
      <UButton label="Add Account" @click="isAddAccountOpen = true" icon="i-heroicons-plus" />
    </div>

    <UCard>
      <AccountList />
    </UCard>

    <UModal v-model:open="isAddAccountOpen" title="Add Account">
      <template #body>
        <AccountForm @close="isAddAccountOpen = false" />
      </template>
    </UModal>
  </UContainer>
</template>

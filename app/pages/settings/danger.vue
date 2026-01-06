<script setup lang="ts">
import { useDatabase } from '~/composables/useDatabase'

const { resetDatabase, isReady } = useDatabase()

// Danger Zone
const isResetModalOpen = ref(false)
const resetConfirmText = ref('')

const onResetApp = async () => {
  await resetDatabase()
}
</script>

<template>
  <div v-if="!isReady" class="flex items-center justify-center py-20">
    <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
  </div>

  <ClientOnly v-else>
    <div class="space-y-8">
      <!-- Danger Zone Section -->
      <UPageCard variant="soft" highlight highlightColor="error" :ui="{ root: 'bg-error/5 dark:bg-error/5' }">
        <template #header>
          <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
          <p class="text-sm text-muted-foreground">Irreversible actions that affect your data.</p>
        </template>

        <template #body>
          <div>
            <h3 class="font-medium mb-1">Reset Application</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Permanently delete all accounts, history, and settings from this browser. This cannot be undone.
            </p>
            <UButton
              color="error"
              label="Reset All Data"
              @click="isResetModalOpen = true"
            />
          </div>
        </template>
      </UPageCard>
    </div>

    <!-- Reset Confirmation Modal -->
    <UModal v-model:open="isResetModalOpen" title="Reset Application?">
      <template #body>
        <UAlert
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          title="Warning: Irreversible Action"
          description="All your financial data, accounts, and history will be permanently deleted from this browser. Please ensure you have an export if you wish to keep this data."
          class="mb-4"
        />
        <p>Type <strong>RESET</strong> below to confirm.</p>
        <div class="mt-4">
          <UInput v-model="resetConfirmText" placeholder="RESET" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="isResetModalOpen = false" />
          <UButton
            label="Delete Everything"
            color="error"
            :disabled="resetConfirmText !== 'RESET'"
            @click="onResetApp"
          />
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

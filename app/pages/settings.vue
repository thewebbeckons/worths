<script setup lang="ts">
import { useDatabase } from '~/composables/useDatabase'

definePageMeta({
  title: 'Settings'
})

const { 
  owners, 
  addOwner, 
  deleteOwner, 
  exportDatabase, 
  importDatabase, 
  resetDatabase,
  isReady 
} = useDatabase()

const toast = useToast()

// Owners Management
const newOwnerName = ref('')
const avatarPreview = ref<string | null>(null)
const isAddingOwner = ref(false)

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const onAddOwner = async () => {
  if (!newOwnerName.value) return
  
  try {
    await addOwner(newOwnerName.value, avatarPreview.value || undefined)
    newOwnerName.value = ''
    avatarPreview.value = null
    isAddingOwner.value = false
    toast.add({ title: 'Owner added successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to add owner', color: 'error', description: String(error) })
  }
}

const onDeleteOwner = async (id: number) => {
  if (!confirm('Are you sure you want to delete this owner?')) return
  
  try {
    await deleteOwner(id)
    toast.add({ title: 'Owner deleted successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Cannot delete owner', color: 'error', description: String(error) })
  }
}

// Data Management
const onExport = async () => {
  try {
    const data = await exportDatabase()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `networth-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: 'Database exported successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Export failed', color: 'error', description: String(error) })
  }
}

const importFileInput = ref<HTMLInputElement | null>(null)
const onImportClick = () => importFileInput.value?.click()

const onImportFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!confirm('This will REPLACE ALL existing data. Are you sure you want to proceed?')) {
    target.value = ''
    return
  }

  try {
    const text = await file.text()
    const json = JSON.parse(text)
    await importDatabase(json)
    toast.add({ title: 'Database imported successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Import failed', color: 'error', description: String(error) })
  } finally {
    target.value = ''
  }
}

// Danger Zone
const isResetModalOpen = ref(false)
const resetConfirmText = ref('')
const onResetApp = async () => {
  await resetDatabase()
}
</script>

<template>
  <UContainer class="py-10 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Settings</h1>
      <p class="text-muted-foreground mt-2">Manage your data, owners, and application settings.</p>
    </div>

    <div v-if="!isReady" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
    </div>

    <ClientOnly v-else>
      <div class="space-y-8">
        <!-- Owners Section -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold">Owners</h2>
                <p class="text-sm text-muted-foreground">Manage users who own accounts.</p>
              </div>
              <UButton
                icon="i-lucide-plus"
                label="Add Owner"
                @click="isAddingOwner = true"
              />
            </div>
          </template>

          <div class="divide-y divide-gray-200 dark:divide-gray-800">
            <div v-for="owner in owners" :key="owner.id" class="flex items-center gap-4 py-4 px-4 first:pt-0 last:pb-0">
              <UAvatar
                :src="owner.avatar"
                :alt="owner.name"
                size="md"
              />
              <div class="flex-1">
                <p class="font-medium text-sm">{{ owner.name }}</p>
              </div>
              <div class="flex items-center">
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  @click="onDeleteOwner(owner.id!)"
                />
              </div>
            </div>
            <div v-if="owners.length === 0" class="py-10 text-center">
              <p class="text-sm text-muted-foreground italic">No owners found. Add one to get started.</p>
            </div>
          </div>
        </UCard>

        <!-- Data Management Section -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Data Management</h2>
            <p class="text-sm text-muted-foreground">Export or import your financial data via JSON files.</p>
          </template>

          <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px]">
              <h3 class="font-medium mb-1">Export Data</h3>
              <p class="text-sm text-muted-foreground mb-3">Download a backup of all your accounts, balances, and snapshots.</p>
              <UButton
                icon="i-lucide-download"
                label="Export to JSON"
                block
                @click="onExport"
              />
            </div>

            <div class="flex-1 min-w-[200px]">
              <h3 class="font-medium mb-1">Import Data</h3>
              <p class="text-sm text-muted-foreground mb-3">Restore from a JSON backup. This will replace all current data.</p>
              <input
                ref="importFileInput"
                type="file"
                accept=".json"
                class="hidden"
                @change="onImportFile"
              />
              <UButton
                icon="i-lucide-upload"
                label="Import from JSON"
                variant="outline"
                block
                @click="onImportClick"
              />
            </div>
          </div>
        </UCard>

        <!-- Danger Zone Section -->
        <UCard class="border-red-500/20 bg-red-50/5 dark:bg-red-950/5">
          <template #header>
            <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            <p class="text-sm text-muted-foreground">Irreversible actions that affect your data.</p>
          </template>

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
        </UCard>
      </div>

      <!-- Add Owner Modal -->
      <UModal v-model:open="isAddingOwner" title="Add New Owner">
        <template #body>
          <div class="space-y-4 py-2">
            <UFormField label="Name" required>
              <UInput v-model="newOwnerName" placeholder="Enter owner name" />
            </UFormField>
            
            <UFormField label="Avatar (Optional)">
              <div class="flex items-center gap-4">
                <UAvatar :src="avatarPreview || undefined" size="lg" />
                <input
                  type="file"
                  accept="image/*"
                  class="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  @change="handleAvatarChange"
                />
              </div>
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" @click="isAddingOwner = false" />
            <UButton label="Create Owner" :disabled="!newOwnerName" @click="onAddOwner" />
          </div>
        </template>
      </UModal>

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
  </UContainer>
</template>

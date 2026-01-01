<script setup lang="ts">
import { useDatabase } from '~/composables/useDatabase'

definePageMeta({
  title: 'Settings'
})

const { 
  owners, 
  addOwner, 
  updateOwner,
  deleteOwner, 
  exportDatabase, 
  importDatabase, 
  resetDatabase,
  isReady 
} = useDatabase()

const toast = useToast()

// Color options for owners (Nuxt UI semantic colors)
const colorOptions = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
type OwnerColor = typeof colorOptions[number]

// Owners Management
const newOwnerName = ref('')
const selectedColor = ref<OwnerColor>('primary')

// Edit Owner State
const isEditingOwner = ref(false)
const editingOwner = ref<{ id: number; name: string; color?: string } | null>(null)
const editOwnerName = ref('')
const editSelectedColor = ref<OwnerColor>('primary')
const isAddingOwner = ref(false)

const onAddOwner = async () => {
  if (!newOwnerName.value) return
  
  try {
    await addOwner(newOwnerName.value, selectedColor.value)
    newOwnerName.value = ''
    selectedColor.value = 'primary'
    isAddingOwner.value = false
    toast.add({ title: 'Owner added successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to add owner', color: 'error', description: String(error) })
  }
}

const onEditOwner = (owner: { id: number; name: string; color?: string }) => {
  editingOwner.value = owner
  editOwnerName.value = owner.name
  editSelectedColor.value = (owner.color as OwnerColor) || 'primary'
  isEditingOwner.value = true
}

const onUpdateOwner = async () => {
  if (!editingOwner.value || !editOwnerName.value) return
  
  try {
    await updateOwner(editingOwner.value.id, editOwnerName.value, editSelectedColor.value)
    isEditingOwner.value = false
    editingOwner.value = null
    editOwnerName.value = ''
    editSelectedColor.value = 'primary'
    toast.add({ title: 'Owner updated successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to update owner', color: 'error', description: String(error) })
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

const onImportClick = async () => {
  try {
    // Use Tauri's native file dialog
    const { open } = await import('@tauri-apps/plugin-dialog')
    const filePath = await open({
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    
    if (!filePath) return // User cancelled
    
    if (!confirm('This will REPLACE ALL existing data. Are you sure you want to proceed?')) {
      return
    }

    // Read the file contents using Tauri's fs API
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    const text = await readTextFile(filePath as string)
    const json = JSON.parse(text)
    await importDatabase(json)
    toast.add({ title: 'Database imported successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Import failed', color: 'error', description: String(error) })
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
        <UCard variant="soft">
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
              <OwnerBadge
                :name="owner.name"
                :color="owner.color"
                size="md"
              />
              <div class="flex-1">
                <p class="font-medium text-sm">{{ owner.name }}</p>
              </div>
              <div class="flex items-center gap-1">
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  @click="onEditOwner(owner)"
                />
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
        <UCard variant="soft">
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

      <!-- Add Owner Modal -->
      <UModal v-model:open="isAddingOwner" title="Add New Owner">
        <template #body>
          <div class="space-y-4 py-2">
            <UFormField label="Name" required>
              <UInput v-model="newOwnerName" placeholder="Enter owner name" />
            </UFormField>
            
            <UFormField label="Color">
              <div class="flex items-center gap-4">
                <OwnerBadge :name="newOwnerName || 'Preview'" :color="selectedColor" size="lg" />
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in colorOptions"
                    :key="color"
                    type="button"
                    class="w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background"
                    :class="[
                      `bg-${color}`,
                      selectedColor === color ? 'ring-2 ring-current scale-110' : 'hover:scale-105'
                    ]"
                    @click="selectedColor = color"
                  />
                </div>
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

      <!-- Edit Owner Modal -->
      <UModal v-model:open="isEditingOwner" title="Edit Owner">
        <template #body>
          <div class="space-y-4 py-2">
            <UFormField label="Name" required>
              <UInput v-model="editOwnerName" placeholder="Enter owner name" />
            </UFormField>
            
            <UFormField label="Color">
              <div class="flex items-center gap-4">
                <OwnerBadge :name="editOwnerName || 'Preview'" :color="editSelectedColor" size="lg" />
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in colorOptions"
                    :key="color"
                    type="button"
                    class="w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background"
                    :class="[
                      `bg-${color}`,
                      editSelectedColor === color ? 'ring-2 ring-current scale-110' : 'hover:scale-105'
                    ]"
                    @click="editSelectedColor = color"
                  />
                </div>
              </div>
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" @click="isEditingOwner = false" />
            <UButton label="Save Changes" :disabled="!editOwnerName" @click="onUpdateOwner" />
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

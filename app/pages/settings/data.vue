<script setup lang="ts">
import { useDatabase } from '~/composables/useDatabase'

const { 
  exportDatabase, 
  importDatabase, 
  isReady 
} = useDatabase()

const toast = useToast()

// JSON Export
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

// JSON Import
const onImportClick = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    if (!confirm('This will REPLACE ALL existing data. Are you sure you want to proceed?')) {
      return
    }

    try {
      const text = await file.text()
      const json = JSON.parse(text)
      await importDatabase(json)
      toast.add({ title: 'Database imported successfully', color: 'success' })
    } catch (error) {
      toast.add({ title: 'Import failed', color: 'error', description: String(error) })
    }
  }
  
  input.click()
}
</script>

<template>
  <div v-if="!isReady" class="flex items-center justify-center py-20">
    <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
  </div>

  <ClientOnly v-else>
    <div class="space-y-8">
      <!-- Data Management Section -->
      <UCard variant="outline" class="shadow-sm">
        <template #header>
          <h2 class="text-xl font-semibold">Data Management</h2>
          <p class="text-sm text-muted-foreground">Export or import your complete financial data via JSON files.</p>
        </template>

        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <h3 class="font-medium mb-1">Export Data</h3>
            <p class="text-sm text-muted-foreground mb-3">Download a full backup of all your accounts, balances, and snapshots.</p>
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

      <!-- CSV Export Section -->
      <ExportSection />
    </div>
  </ClientOnly>
</template>

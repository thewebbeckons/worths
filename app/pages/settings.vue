<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
  title: 'Settings'
})

const links = [[
  {
    label: 'General',
    icon: 'i-lucide-user',
    to: '/settings',
    exact: true
  },
  {
    label: 'Data',
    icon: 'i-lucide-database',
    to: '/settings/data'
  },
  {
    label: 'About',
    icon: 'i-lucide-info',
    to: '/settings/about'
  }
]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel
    id="settings"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <div class="bg-white dark:bg-neutral-900 shadow-sm">
        <UContainer class="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-2xl font-bold">
            Settings
          </h3>
          <UNavigationMenu
            :items="links"
            highlight
            class="w-full sm:w-auto"
          />
        </UContainer>
      </div>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

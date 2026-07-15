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
      <div>
        <UContainer class="flex flex-col gap-7 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-14">
          <div>
            <h1 class="page-title">Settings</h1>
          </div>
          <UNavigationMenu
            :items="links"
            highlight
            class="w-full sm:w-auto"
          />
        </UContainer>
      </div>
    </template>

    <template #body>
      <div class="flex w-full flex-col gap-4 pb-14 sm:gap-6 lg:max-w-2xl lg:gap-12 mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

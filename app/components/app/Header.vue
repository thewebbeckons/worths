<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const navItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
    active: route.path === '/'
  },
  {
    label: 'Accounts',
    icon: 'i-lucide-wallet',
    to: '/accounts',
    active: route.path.startsWith('/accounts')
  }
])
</script>

<template>
  <UHeader :toggle="false">
    <template #left>
      <div class="flex items-center gap-2 mr-4">
        <img src="/logo.png" alt="Worthie Logo" class="h-8 w-8 rounded-lg" />
        <span class="font-bold text-xl hidden sm:block">Worthie</span>
      </div>
      <UNavigationMenu :items="navItems" />
    </template>

    <template #right>
      <UButton
        to="/settings"
        icon="i-lucide-user"
        aria-label="Settings"
        color="neutral"
        variant="ghost"
      />
      <UColorModeButton />
    </template>
  </UHeader>
</template>

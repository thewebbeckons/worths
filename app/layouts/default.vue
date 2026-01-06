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
  <UDashboardGroup class="min-h-screen">
    <UDashboardSidebar
      collapsible
      :resizable="true"
      :default-size="14"
      :min-size="12"
      :max-size="18"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center flex-1 py-3" :class="collapsed ? 'justify-center' : 'justify-start'">
          <UTooltip text="Worths">
            <img src="/logo.png" alt="Worthie Logo" class="rounded-lg" :class="collapsed ? 'h-(--reka-dropdown-menu-trigger-width) w-(--reka-dropdown-menu-trigger-width)' : 'h-8 w-8'" />
          </UTooltip>
          <span v-if="!collapsed" class="ml-2 font-bold text-lg">Worths</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex h-full flex-col py-2">
          <UNavigationMenu
            :items="navItems"
            orientation="vertical"
            :collapsed="collapsed"
            tooltip
            popover
          />
        </div>
      </template>
      <template #footer="{ collapsed }">
        <UTooltip text="Settings">
          <UButton
            to="/settings"
            icon="i-lucide-settings"
            :square="collapsed"
            aria-label="Settings"
            color="neutral"
            variant="ghost"
            class="w-full justify-start"
          >
            <span v-if="!collapsed">Settings</span>
          </UButton>
      </UTooltip>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

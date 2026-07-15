<script setup lang="ts">
const navItems = useNavItems();
</script>

<template>
  <div class="app-shell min-h-screen flex flex-col">
    <UHeader toggle-side="left" class="app-header sticky top-0 z-40">
      <template #left>
        <ULink to="/" class="group flex items-center gap-3 font-semibold">
          <span class="brand-mark" aria-hidden="true"><span>W</span></span>
          <span class="text-lg tracking-[-0.035em] text-highlighted">Worths</span>
          <span class="hidden rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-700 sm:inline dark:text-secondary-300">Private</span>
        </ULink>
      </template>

      <UNavigationMenu :items="navItems" class="hidden md:flex" />

      <template #content>
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          class="py-4"
        />
      </template>

      <template #right>
        <div class="flex items-center gap-1 rounded-full border border-default bg-elevated/70 p-1 shadow-xs">
          <UColorModeButton />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-settings"
            to="/settings"
            aria-label="Settings"
          />
        </div>
      </template>
    </UHeader>

    <main class="page-surface">
      <slot />
    </main>
  </div>
</template>

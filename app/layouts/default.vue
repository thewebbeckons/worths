<script setup lang="ts">
const navItems = useNavItems();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-elevated">
    <UHeader toggle-side="left">
      <template #left>
        <ULink to="/" class="flex items-center gap-2 font-semibold">
          <img src="/logo.png" alt="Worths Logo" class="h-8 w-8 rounded-md">
          <span>Worths</span>
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
        <div class="flex items-center gap-2">
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

    <div>
      <slot />
    </div>
  </div>
</template>

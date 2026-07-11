<template>
  <UCard class="h-full min-h-80 shadow-sm" variant="outline">
    <div class="flex h-full flex-col">
      <div>
        <div
          class="text-lg font-bold uppercase tracking-wider text-neutral-900 dark:text-white"
        >
          Quarterly Growth
        </div>
        <div class="text-sm text-muted">
          Net worth performance by quarter
        </div>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div
          class="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <UIcon name="i-lucide-chart-no-axes-combined" class="size-6" />
        </div>
        <p class="font-semibold text-neutral-900 dark:text-white">
          Quarterly insights are coming soon
        </p>
        <p class="mt-1 max-w-sm text-sm text-muted">
          This card will show quarter-over-quarter net worth growth.
        </p>
      </div>
    </div>
  </UCard>
</template>

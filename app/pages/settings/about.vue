<script setup lang="ts">
const githubUrl = 'https://github.com/thewebbeckons/worths'
</script>

<template>
  <div class="space-y-8">
    <!-- About Section -->
    <UCard
      variant="outline"
      class="shadow-sm"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-piggy-bank"
            class="text-3xl text-primary"
          />
          <div>
            <h2 class="text-xl font-semibold">
              Worths
            </h2>
            <p class="text-sm text-muted-foreground">
              Personal Net Worth Tracker
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <div>
          <h3 class="font-medium mb-2">
            What is Worths?
          </h3>
          <p class="text-sm text-muted-foreground">
            Worths is a simple, privacy-focused net worth tracker that helps you monitor your financial health
            over time. Track your assets and liabilities, see your net worth at a glance, and visualize your
            progress with intuitive charts.
          </p>
        </div>

        <UDivider />

        <div>
          <h3 class="font-medium mb-2">
            How it Works
          </h3>
          <ul class="text-sm text-muted-foreground space-y-2">
            <li class="flex items-start gap-2">
              <UIcon
                name="i-lucide-wallet"
                class="mt-0.5 text-primary shrink-0"
              />
              <span><strong>Add Accounts</strong> — Create accounts for your savings, investments, credit cards, loans, and more.</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-lucide-refresh-cw"
                class="mt-0.5 text-primary shrink-0"
              />
              <span><strong>Update Balances</strong> — Periodically update your account balances to track changes over time.</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-lucide-trending-up"
                class="mt-0.5 text-primary shrink-0"
              />
              <span><strong>Track Progress</strong> — View your net worth history and see how your finances evolve.</span>
            </li>
          </ul>
        </div>

        <UDivider />

        <div>
          <h3 class="font-medium mb-2">
            Your Data, Your Privacy
          </h3>
          <UAlert
            icon="i-lucide-shield-check"
            color="success"
            variant="subtle"
            title="100% Local Storage"
            description="All your data is stored locally in your browser using IndexedDB. Nothing is ever sent to any server. Your financial information stays completely private on your device."
          />
        </div>

        <UDivider />

        <div>
          <h3 class="font-medium mb-2">
            Open Source
          </h3>
          <p class="text-sm text-muted-foreground mb-3">
            Worths is open source software. You can view the code, contribute, or report issues on GitHub.
          </p>
          <UButton
            :to="githubUrl"
            target="_blank"
            icon="i-simple-icons-github"
            label="View on GitHub"
            variant="outline"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

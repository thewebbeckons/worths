<script setup lang="ts">
useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en",
  },
});

const title = "Worths";
const description = "Track your net worth and manage your financial accounts.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
});

const { isOpen } = useOnboarding();
</script>

<template>
  <NuxtPwaManifest />
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <OnboardingModal
        :open="isOpen"
        @update:open="isOpen = $event"
        @complete="isOpen = false"
      />
    </ClientOnly>
  </UApp>
</template>

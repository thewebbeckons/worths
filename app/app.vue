<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Worthie'
const description = 'Track your net worth and manage your financial accounts.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <AppHeader />

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>

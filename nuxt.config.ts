// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/hints', '@vueuse/nuxt', 'nuxt-charts', '@vite-pwa/nuxt'],

  ssr: false,

  // Icon configuration for production bundling
  icon: {
    serverBundle: 'local',
    clientBundle: {
      icons: [],
      scan: true
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Worthie',
      short_name: 'Worthie',
      description: 'Track your net worth and manage your financial accounts.',
      theme_color: '#ffffff',
      icons: [
        {
          src: 'icon.png',
          sizes: '1024x1024',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module'
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Disable telemetry
  telemetry: { enabled: false },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
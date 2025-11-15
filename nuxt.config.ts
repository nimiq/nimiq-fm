// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/ui',
    '@vueuse/nuxt',
  ],
  eslint: {
    config: {
      standalone: false,
    },
  },
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  css: ['./app/assets/css/main.css']
})

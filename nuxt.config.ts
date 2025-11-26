import process from 'node:process'
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@tresjs/nuxt',
    '@nuxthub/core',
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
  css: ['./app/assets/css/main.css'],
  runtimeConfig: {
    nimiqRpcUrl: process.env.NIMIQ_RPC_URL || 'http://localhost:8648',
  },
})

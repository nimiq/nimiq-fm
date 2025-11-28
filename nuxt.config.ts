import process from 'node:process'
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Nimiq FM',
      meta: [
        { name: 'description', content: 'Tune into the Nimiq blockchain. A living audiovisual experience where validators create music in real-time.' },
        { property: 'og:title', content: 'Nimiq FM' },
        { property: 'og:description', content: 'Tune into the Nimiq blockchain. A living audiovisual experience where validators create music in real-time.' },
        { property: 'og:image', content: 'https://nimiq.fm/og-image.png' },
        { property: 'og:url', content: 'https://nimiq.fm' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Nimiq FM' },
        { name: 'twitter:description', content: 'Tune into the Nimiq blockchain. A living audiovisual experience where validators create music in real-time.' },
        { name: 'twitter:image', content: 'https://nimiq.fm/og-image.png' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@tresjs/nuxt',
    '@nuxthub/core-nightly',
    '@nuxtjs/device',
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
    rollupConfig: {
      external: ['utf-8-validate', 'bufferutil', '@libsql/isomorphic-ws'],
    },
  },
  css: ['./app/assets/css/main.css'],
  runtimeConfig: {
    nimiqRpcUrl: process.env.NIMIQ_RPC_URL || 'http://localhost:8648',
  },
  hub: {
    cache: true,
  },
})

import process from 'node:process'
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Nimiq Song of the Validators',
      meta: [
        { name: 'description', content: 'Experience the Nimiq blockchain as a living, breathing orb. Watch validators produce blocks in real-time, visualized as waves of energy.' },
        { property: 'og:title', content: 'Nimiq Song of the Validators' },
        { property: 'og:description', content: 'Experience the Nimiq blockchain as a living, breathing orb. Watch validators produce blocks in real-time.' },
        { property: 'og:image', content: 'https://song.nimiq.com/og-image.png' },
        { property: 'og:url', content: 'https://song.nimiq.com' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Nimiq Song of the Validators' },
        { name: 'twitter:description', content: 'Experience the Nimiq blockchain as a living, breathing orb.' },
        { name: 'twitter:image', content: 'https://song.nimiq.com/og-image.png' },
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

import process from 'node:process'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-07-15',
  ssr: false,

  modules: [
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxthub/core-nightly',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxtjs/seo',
  ],

  hub: {
    cache: true,
  },

  site: {
    url: 'https://nimiq-nuxt-template.nuxt.dev/',
    name: 'Nimiq Song',
    description: 'Welcome to Nimiq Song site!',
    defaultLocale: 'en',
  },

  ogImage: { enabled: false },

  devtools: {
    enabled: true,
  },

  colorMode: {
    classSuffix: '',
  },

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  experimental: {
    // when using generate, payload js assets included in sw precache manifest
    // but missing on offline, disabling extraction it until fixed
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  runtimeConfig: {
    nimiqRpcUrl: process.env.NIMIQ_RPC_URL || '',
  },

  vite: {
    plugins: [
      wasm(),
      topLevelAwait(),
    ],
    optimizeDeps: {
      exclude: ['@nimiq/core'],
    },

  },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    experimental: {
      websocket: true,
    },
    rollupConfig: {
      external: ['utf-8-validate', 'bufferutil', '@libsql/isomorphic-ws'],
    },
  },

  app: {
    head: {
      title: 'Nimiq Song',
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500;700&display=swap' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Your Nimiq-Nuxt Template' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: 'white' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#1f2348' },
      ],
    },
  },

  build: {
    transpile: ['postprocessing'],
  },

  eslint: {
    config: {
      standalone: false,
    },
  },
})

import type { Client } from '@nimiq/core/web'
import consola from 'consola'

declare module '#app' {
  interface NuxtApp {
    $nimiqClient: Client | null
    $nimiqRetryInit: (() => Promise<void>) | undefined
  }
}

async function initializeClient(): Promise<Client | null> {
  try {
    const { default: init, Client } = await import('@nimiq/core/web')

    await init()

    const client = await Client.create({
      logLevel: 'info',
    })

    return client
  }
  catch (error) {
    consola.error('[Nimiq WASM] Failed to initialize:', error)
    return null
  }
}

export default defineNuxtPlugin({
  name: 'nimiq-client',
  async setup() {
    // Provide retry function for recovery
    const retryInit = async () => {
      consola.info('[Nimiq WASM] Retrying initialization...')
      const newClient = await initializeClient()
      if (newClient) {
        // Trigger page reload to reinitialize everything
        window.location.reload()
      }
    }

    if (!import.meta.client) {
      return { provide: { nimiqClient: null as Client | null, nimiqRetryInit: retryInit } }
    }

    const client = await initializeClient()

    return {
      provide: {
        nimiqClient: client,
        nimiqRetryInit: retryInit,
      },
    }
  },
})

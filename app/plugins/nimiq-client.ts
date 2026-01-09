import type { Client } from '@nimiq/core/web'
import consola from 'consola'

declare module '#app' {
  interface NuxtApp {
    $nimiqClient: Client | null
    $nimiqRetryInit: (() => Promise<void>) | undefined
  }
}

const SEED_NODES = [
  '/dns4/aurora.seed.nimiq.com/tcp/443/wss',
  '/dns4/catalyst.seed.nimiq.network/tcp/443/wss',
  '/dns4/cipher.seed.nimiq-network.com/tcp/443/wss',
  '/dns4/eclipse.seed.nimiq.cloud/tcp/443/wss',
  '/dns4/lumina.seed.nimiq.systems/tcp/443/wss',
  '/dns4/nebula.seed.nimiq.com/tcp/443/wss',
  '/dns4/nexus.seed.nimiq.network/tcp/443/wss',
  '/dns4/polaris.seed.nimiq-network.com/tcp/443/wss',
  '/dns4/photon.seed.nimiq.cloud/tcp/443/wss',
  '/dns4/pulsar.seed.nimiq.systems/tcp/443/wss',
  '/dns4/quasar.seed.nimiq.com/tcp/443/wss',
  '/dns4/solstice.seed.nimiq.network/tcp/443/wss',
  '/dns4/vortex.seed.nimiq.cloud/tcp/443/wss',
  '/dns4/zenith.seed.nimiq.systems/tcp/443/wss',
]

async function initializeClient(): Promise<Client | null> {
  try {
    const { default: init, Client, ClientConfiguration } = await import('@nimiq/core/web')

    await init()

    const config = new ClientConfiguration()
    config.network('mainalbatross')
    config.seedNodes(SEED_NODES)
    config.syncMode('pico')
    config.logLevel('info')

    const client = await Client.create(config.build())

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

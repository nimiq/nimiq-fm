import type { PlainBlock } from '@nimiq/core/web'
import { electionBlockOf, epochAt } from '@nimiq/utils/albatross-policy'
import consola from 'consola'

export interface BlockEvent {
  blockNumber: number
  epoch: number
  batch: number
  timestamp: number
  validatorAddress?: string
  type: 'micro' | 'macro'
  hash: string
}

interface ValidatorFromApi {
  id: number
  name: string
  address: string
  logo: string
  balance: string
  dominanceRatio: number
}

export type ConnectionState = 'loading-wasm' | 'wasm-failed' | 'connecting' | 'syncing' | 'established' | 'disconnected'

const NETWORK_STALLED_BLOCK_GAP = 60e3 // 60 seconds
const VALIDATORS_CACHE_TTL = 60e3 // 60 seconds

interface ValidatorsCache {
  data: { count: number, validators: any[] } | null
  timestamp: number
}

function _useBlockchain() {
  const { $nimiqClient } = useNuxtApp()
  const latestBlock = shallowRef<BlockEvent | null>(null)
  const listeners = new Set<(event: BlockEvent) => void>()
  const connectionState = ref<ConnectionState>('loading-wasm')
  const peerCount = ref<number>(0)
  const lastBlockTimestamp = ref<number>(0)

  const isOnline = useOnline()
  const visibility = useDocumentVisibility()

  let listenerHandle: number | null = null
  let isListening = false
  let isStopping = false
  let validatorsCache: ValidatorsCache = { data: null, timestamp: 0 }

  // Check for stalled connection (no blocks for 60s)
  const isStalled = computed(() => {
    return connectionState.value === 'established'
      && lastBlockTimestamp.value > 0
      && Date.now() - lastBlockTimestamp.value > NETWORK_STALLED_BLOCK_GAP
  })

  // Update connection state based on stalled detection
  watch(isStalled, (stalled) => {
    if (stalled && connectionState.value === 'established') {
      consola.warn('[Nimiq] Network stalled - no blocks for 60s')
      connectionState.value = 'disconnected'
    }
  })

  const startListening = async () => {
    if (!import.meta.client || !$nimiqClient || isListening)
      return

    // Check if WASM failed to init
    if (connectionState.value === 'wasm-failed') {
      consola.error('[Nimiq] Cannot start listening - WASM initialization failed')
      return
    }

    isListening = true
    isStopping = false
    connectionState.value = isOnline.value ? 'connecting' : 'disconnected'

    try {
      listenerHandle = await retry(
        () => $nimiqClient.addHeadChangedListener(async (hash: string) => {
          if (isStopping)
            return

          try {
            const block = await $nimiqClient.getBlock(hash)

            const blockEvent: BlockEvent = {
              blockNumber: block.height,
              epoch: block.epoch,
              batch: block.batch,
              timestamp: block.timestamp,
              validatorAddress: block.type === 'micro' ? block.producer.validator : undefined,
              type: block.type,
              hash: block.hash,
            }

            latestBlock.value = blockEvent
            lastBlockTimestamp.value = Date.now()

            // Update connection state based on block reception
            if (connectionState.value === 'connecting' || connectionState.value === 'syncing') {
              connectionState.value = 'syncing'
            }
            if (connectionState.value === 'syncing' && latestBlock.value) {
              // First block received = established
              connectionState.value = 'established'
            }

            listeners.forEach(listener => listener(blockEvent))
          }
          catch (error) {
            consola.error('[Nimiq] Failed to process block:', error)
          }
        }),
        { baseDelay: 500, maxRetries: 5 },
      )

      connectionState.value = 'syncing'
    }
    catch (error) {
      consola.error('[Nimiq] Failed to register block listener:', error)
      isListening = false
      connectionState.value = 'disconnected'
    }
  }

  const stopListening = async () => {
    isStopping = true
    if (listenerHandle !== null && $nimiqClient) {
      try {
        await $nimiqClient.removeListener(listenerHandle)
      }
      catch (error) {
        consola.error('[Nimiq] Failed to remove listener:', error)
      }
      listenerHandle = null
      isListening = false
    }
  }

  const onBlockEvent = (callback: (event: BlockEvent) => void) => {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  // Reconnect timeout helper
  const { start: startReconnectTimeout, stop: stopReconnectTimeout } = useTimeoutFn(
    () => startListening(),
    1000,
    { immediate: false },
  )

  async function getValidators() {
    if (!$nimiqClient) {
      return { count: 0, validators: [], error: true }
    }

    // Check cache
    const now = Date.now()
    if (validatorsCache.data && (now - validatorsCache.timestamp) < VALIDATORS_CACHE_TTL) {
      return validatorsCache.data
    }

    try {
      // Wait for consensus before fetching validators
      await $nimiqClient.waitForConsensusEstablished()

      const headHeight = await retry(() => $nimiqClient.getHeadHeight(), { maxRetries: 3 })
      const currentEpoch = epochAt(headHeight)
      // Get previous epoch's election block (current epoch validators are active)
      const electionBlockNumber = electionBlockOf(currentEpoch - 1)!
      // PlainMacroBlock types don't include slots field yet - keep workaround until upstream adds it
      const electionBlock = await retry(
        () => $nimiqClient.getBlockAt(electionBlockNumber),
        { maxRetries: 3 },
      ) as PlainBlock & { slots?: Array<{ validator: string, numSlots: number }> }

      // Runtime validation for type safety
      if (!electionBlock.slots) {
        throw new Error('Election block missing slots field')
      }

      const validatorsFromApi = await $fetch<ValidatorFromApi[]>(
        'https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false',
      ).catch((error) => {
        consola.error('Failed to fetch validator metadata:', error)
        return []
      })

      const apiValidatorsMap = new Map(validatorsFromApi.map(v => [v.address, v]))

      const slots = electionBlock.slots || []
      const validators = slots.map((slot) => {
        const apiValidator = apiValidatorsMap.get(slot.validator)
        return {
          address: slot.validator,
          numSlots: slot.numSlots,
          name: apiValidator?.name !== 'Unknown validator' ? apiValidator?.name : undefined,
          logo: apiValidator?.logo,
        }
      })

      const result = { count: validators.length, validators, error: false }
      // Update cache
      validatorsCache = { data: result, timestamp: now }
      return result
    }
    catch (error) {
      consola.error('[Nimiq] Failed to fetch validators:', error)
      return { count: 0, validators: [], error: true }
    }
  }

  // Browser online/offline detection
  watch(isOnline, async (online) => {
    if (!online) {
      consola.warn('[Nimiq] Browser is OFFLINE')
      stopReconnectTimeout()
      connectionState.value = 'disconnected'
      await stopListening()
    }
    else {
      consola.info('[Nimiq] Browser is ONLINE')
      startReconnectTimeout() // 1 second delay before reconnecting
    }
  })

  // Reconnect when returning to visible tab
  watch(visibility, (visible) => {
    if (visible === 'visible' && connectionState.value === 'disconnected' && isOnline.value) {
      consola.info('[Nimiq] Tab visible - attempting reconnect')
      stopListening().then(startListening)
    }
  })

  return {
    latestBlock: readonly(latestBlock),
    connectionState: readonly(connectionState),
    peerCount: readonly(peerCount),
    lastBlockTimestamp: readonly(lastBlockTimestamp),
    startListening,
    stopListening,
    onBlockEvent,
    getValidators,
  }
}

export const useBlockchain = createSharedComposable(_useBlockchain)

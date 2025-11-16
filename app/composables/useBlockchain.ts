import type { StreamedBlock } from '~~/server/routes/blocks'

export interface BlockEvent {
  blockNumber: number
  epoch: number
  batch: number
  timestamp: number
  validatorAddress?: string
  type: 'micro' | 'macro'
  hash: string
}

export function useBlockchain() {
  const latestBlock = ref<BlockEvent | null>(null)
  const listeners = new Set<(event: BlockEvent) => void>()

  const url = computed(() => {
    if (!import.meta.client)
      return ''
    return `${window.location.protocol}//${window.location.host}/blocks`
  })

  const { data, open } = useEventSource(url, [], {
    autoReconnect: true,
    autoConnect: true,
    serializer: {
      read: rawData => JSON.parse(rawData!),
    },
  })

  const startListening = () => {
    if (!import.meta.client)
      return
    open()
  }

  const onBlockEvent = (callback: (event: BlockEvent) => void) => {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  watch(data, (message) => {
    if (!message)
      return

    try {
      const parsed = message as { type: 'block', data: StreamedBlock } | { type: 'error', message: string }

      if (parsed.type === 'block') {
        const block = parsed.data
        const blockEvent: BlockEvent = {
          blockNumber: block.number,
          epoch: block.epoch,
          batch: block.batch,
          timestamp: Date.now(),
          validatorAddress: block.validator,
          type: block.validator ? 'micro' : 'macro',
          hash: block.number.toString(),
        }

        latestBlock.value = blockEvent
        listeners.forEach(listener => listener(blockEvent))
      }
    }
    catch (err) {
      console.error('Failed to parse WebSocket message:', err)
    }
  })

  return { latestBlock: readonly(latestBlock), startListening, onBlockEvent }
}

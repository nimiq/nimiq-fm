export interface BlockEvent {
  blockNumber: number
  timestamp: number
  validatorAddress?: string
  type: 'micro' | 'macro'
  hash: string
}

export function useBlockchain() {
  const latestBlock = ref<BlockEvent | null>(null)
  const listeners = new Set<(event: BlockEvent) => void>()

  const wsUrl = computed(() => {
    if (!import.meta.client) return ''
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/blocks`
  })

  const { status, data, open } = useWebSocket(wsUrl, {
    autoReconnect: { retries: 3, delay: 1000 },
    heartbeat: { message: 'ping', interval: 30000 },
  })

  const startListening = () => {
    if (!import.meta.client) return
    open()
  }

  const onBlockEvent = (callback: (event: BlockEvent) => void) => {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  watch(data, (message) => {
    if (!message) return

    try {
      const parsed = JSON.parse(message)

      if (parsed.type === 'block') {
        const block = parsed.data
        const blockEvent: BlockEvent = {
          blockNumber: block.number,
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

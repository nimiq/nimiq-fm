import { readonly, ref, watch } from 'vue'

export interface BlockEvent {
  blockNumber: number
  epoch: number
  batch: number
  timestamp: number
  validatorAddress?: string
  type: 'micro' | 'macro'
  hash: string
}

const latestBlock = ref<BlockEvent | null>(null)
const listeners = new Set<(event: BlockEvent) => void>()
let socket: any = null

export function useBlockchain() {
  if (!socket && import.meta.client) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/blocks`

    socket = useWebSocket(wsUrl, {
      autoReconnect: { retries: 3, delay: 1000 },
      heartbeat: { message: 'ping', interval: 30000 },
      immediate: false,
    })

    watch(socket.data, (message: string | null) => {
      if (!message)
        return

      try {
        const parsed = JSON.parse(message)

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
  }

  const startListening = () => {
    if (socket)
      socket.open()
  }

  const onBlockEvent = (callback: (event: BlockEvent) => void) => {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  return { latestBlock: readonly(latestBlock), startListening, onBlockEvent }
}

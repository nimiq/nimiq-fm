// Simple shared composable implementation (avoids @vueuse/core dependency)
function createSharedComposable<T>(composable: () => T): () => T {
  let state: T | null = null
  return () => {
    if (!state)
      state = composable()
    return state
  }
}

export interface BlockEvent {
  blockNumber: number
  epoch: number
  batch: number
  timestamp: number
  validatorAddress?: string
  type: 'micro' | 'macro'
  hash: string
}

function _useBlockchain() {
  const latestBlock = ref<BlockEvent | null>(null)
  const listeners = new Set<(event: BlockEvent) => void>()

  const url = `${useRequestURL().origin}/blocks`
  const { data, open } = useEventSource(url, [], { autoReconnect: true, autoConnect: false })

  const startListening = () => {
    if (!import.meta.client)
      return
    open()
  }

  const onBlockEvent = (callback: (event: BlockEvent) => void) => {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  watch(data, (rawData) => {
    if (!rawData)
      return

    try {
      const parsed = JSON.parse(rawData) as { type: 'block', data: FmBlock } | { type: 'error', message: string }
      if (parsed.type !== 'block')
        return

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
    catch (err) {
      console.error('Failed to parse SSE message:', err)
    }
  })

  async function getValidators() {
    const { data } = await useFetch<{ count: number, validators: { address: string }[] }>('/api/validator-count')
    const validators = data.value?.validators ?? []
    const addresses = validators.map(v => v.address)
    return {
      count: data.value?.count ?? 40,
      addresses,
    }
  }

  return { latestBlock: readonly(latestBlock), startListening, onBlockEvent, getValidators }
}

export const useBlockchain = createSharedComposable(_useBlockchain)

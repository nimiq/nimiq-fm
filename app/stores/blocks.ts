import type { Block } from 'nimiq-rpc-client-ts'
import { createIdenticon } from 'identicons-esm'
import { BlockType } from 'nimiq-rpc-client-ts'

export const useBlocks = defineStore('blocks', () => {
  const url = `/api/blocks`
  console.log('/api/block')
  const { status, data: blocksStr } = useWebSocket(url, {
    autoReconnect: {
      retries: 3,
      delay: 1000,
      onFailed() {
        alert('Failed to connect to WS after 3 retries')
      },
    },
  })
  const block = computed(() => JSON.parse(blocksStr.value) as Block)
  const micro = ref<Block>()
  const svg = ref<string>()
  watch(block, async (b) => {
    if (b.type === BlockType.Macro)
      return
    micro.value = b
    svg.value = await createIdenticon(b.producer.validator)
  })
  return {
    status,
    svg,
    micro,
    block,
  }
})

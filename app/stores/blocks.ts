import type { Block } from 'nimiq-rpc-client-ts'
import { BlockType } from 'nimiq-rpc-client-ts'

export const useBlocks = defineStore('blocks', () => {
  const url = `/api/blocks`
  console.log('21312')
  const { status, data: blocksStr } = useWebSocket(url, {
    autoReconnect: {
      retries: 3,
      delay: 1000,
      onFailed() {
        alert('Failed to connect to Stats WS after 3 retries')
      },
    },
  })
  const block = computed(() => JSON.parse(blocksStr.value) as Block)
const micro = ref<Block>()
watch(block, (b) => {
  if (b.type === BlockType.MicroBlock) return
  micro.value = b
})
  return {
    status,
    micro,
    block,
  }
})

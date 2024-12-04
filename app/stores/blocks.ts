import type { Block } from 'nimiq-rpc-client-ts'
import { createIdenticon } from 'identicons-esm'
import { BlockType } from 'nimiq-rpc-client-ts'

export const useBlocks = defineStore('blocks', () => {
  const url = import.meta.dev ? '/api/blocks' : 'https://nimiq-website.pages.dev/api/blocks'
  console.log(url)
  const { status, open, data: blocksStr } = useWebSocket(url, {
    heartbeat: true,
    immediate: false,
    autoReconnect: {
      retries: 3,
      delay: 1000,
      onFailed() {
        alert('Failed to connect to WS after 3 retries')
      },
    },
  })
  const block = computed(() => JSON.parse(blocksStr.value).at(0) as Block)
  const micro = ref<Block>()
  const svg = ref<string>()
  watch(block, async (b) => {
    console.log('block from ws', b)
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
    open,
  }
})

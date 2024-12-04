import type { Block } from 'nimiq-rpc-client-ts'
import { createIdenticon } from 'identicons-esm'
import { BlockType } from 'nimiq-rpc-client-ts'

export const useBlocks = defineStore('blocks', () => {
  const url = '/api/blocks'
  console.log(url)
  const blocksStr = ref<string>('')
  const eventSource = new EventSource(url)
  eventSource.onmessage = (event) => {
    blocksStr.value = event.data
  }

  const block = computed(() => blocksStr.value ? JSON.parse(blocksStr.value) as Block : undefined)
  const micro = ref<Block>()
  const svg = ref<string>()
  watch(block, async (b) => {
    if (!b)
      return
    if (b.type === BlockType.Macro)
      return
    micro.value = b
    svg.value = await createIdenticon(b.producer.validator)
  })
  return {
    svg,
    micro,
    block,
  }
})

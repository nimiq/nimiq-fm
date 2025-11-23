import type { StreamedBlock } from '~~/server/api/blocks'

export const useBlocks = defineStore('blocks', () => {
  const url = '/api/blocks'
  const blocksStr = ref<string>('')
  let eventSource: EventSource | undefined

  if (import.meta.client) {
    eventSource = new EventSource(url)
    eventSource.onmessage = (event) => {
      blocksStr.value = event.data
    }
  }

  const block = computed(() => blocksStr.value ? JSON.parse(blocksStr.value).data as StreamedBlock : undefined)
  const micro = ref<StreamedBlock>()
  watch(block, async (b) => {
    if (!b)
      return
    if (b.type === 'macro')
      return
    micro.value = b
  })
  return {
    micro,
    block,
  }
})

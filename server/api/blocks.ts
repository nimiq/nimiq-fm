import * as rpc from 'nimiq-rpc-client-ts'

export interface StreamedBlock {
  number: number
  epoch: number
  batch: number
  type: 'macro' | 'micro'
  validator?: string
}

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  const config = useRuntimeConfig()
  rpc.initRpcClient({ url: config.nimiqRpcUrl })

  try {
    const sub = await rpc.subscribeForHeadBlock(true, { autoReconnect: true })

    sub.addEventListener('data', (e) => {
      const block = e.detail.data
      if (!block)
        return

      const streamedBlock: StreamedBlock = {
        number: block.number,
        batch: block.batch,
        epoch: block.epoch,
        validator: block.type === 'micro' ? block.producer.validator : undefined,
        type: block.type,
      }

      eventStream.push(JSON.stringify({ type: 'block', data: streamedBlock }))
    })

    sub.addEventListener('error', (e) => {
      eventStream.push(JSON.stringify({ type: 'error', message: e.detail }))
    })

    sub.addEventListener('close', () => {
      eventStream.close()
    })
  }
  catch (error) {
    console.error('[SSE] Failed to subscribe to blockchain:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe'
    eventStream.push(JSON.stringify({ type: 'error', message: `Subscription failed: ${errorMessage}` }))
  }

  return eventStream.send()
})

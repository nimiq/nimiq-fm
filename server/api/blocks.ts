import type { Block } from 'nimiq-rpc-client-ts/types'
import { initRpcClient } from 'nimiq-rpc-client-ts/client'
import { subscribeForHeadBlock } from 'nimiq-rpc-client-ts/ws'

export interface StreamedBlock {
  number: number
  epoch: number
  batch: number
  type: 'macro' | 'micro'
  validator?: string
}

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  const { nodeRpcUrl } = useRuntimeConfig()

  try {
    initRpcClient({ url: nodeRpcUrl })

    const eventEmitter = await subscribeForHeadBlock(true)

    eventEmitter.addEventListener('data', async (event: CustomEvent) => {
      const { data: block } = event.detail as { data: Block | null }
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

    eventEmitter.addEventListener('error', () => {
      eventStream.push(JSON.stringify({ type: 'error', message: 'Subscription error' }))
    })
  }
  catch {
    eventStream.push(JSON.stringify({ type: 'error', message: 'Failed to subscribe' }))
  }

  eventStream.onClosed(async () => {
    await eventStream.close()
  })

  return eventStream.send()
})

import type { Block } from 'nimiq-rpc-client-ts/types'
import { initRpcClient } from 'nimiq-rpc-client-ts/client'
import { BlockTypeEnum } from 'nimiq-rpc-client-ts/types'
import { subscribeForHeadBlock } from 'nimiq-rpc-client-ts/ws'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  const config = useRuntimeConfig()
  const nodeRpcUrl = config.nimiqRpcUrl

  try {
    initRpcClient({ url: nodeRpcUrl })

    const eventEmitter = await subscribeForHeadBlock(true)

    eventEmitter.addEventListener('data', async (event: CustomEvent) => {
      const { data: block } = event.detail as { data: Block | null }
      if (!block)
        return

      const streamedBlock: FmBlock = {
        number: block.number,
        batch: block.batch,
        epoch: block.epoch,
        validator: block.type === BlockTypeEnum.Micro ? block.producer.validator : undefined,
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

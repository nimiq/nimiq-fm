import { BlockType, NimiqRPCClient, RetrieveType } from '@albermonte/nimiq-rpc-client-ts'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  const config = useRuntimeConfig()
  const nodeRpcUrl = config.nimiqRpcUrl

  try {
    const client = new NimiqRPCClient(new URL(nodeRpcUrl))

    const { next } = await client.blockchainStreams.subscribeForBlocks({ retrieve: RetrieveType.Full })

    next(({ error, data }) => {
      if (error) {
        eventStream.push(JSON.stringify({ type: 'error', message: error.message }))
        return
      }

      const block = data
      if (!block)
        return

      const streamedBlock: FmBlock = {
        number: block.number,
        batch: block.batch,
        epoch: block.epoch,
        validator: block.type === BlockType.Micro ? block.producer.validator : undefined,
      }

      eventStream.push(JSON.stringify({ type: 'block', data: streamedBlock }))
    })
  }
  catch (error) {
    // Log the actual error for server-side debugging
    console.error('[SSE] Failed to subscribe to blockchain:', error)

    // Send descriptive error to client
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe'
    eventStream.push(JSON.stringify({ type: 'error', message: `Subscription failed: ${errorMessage}` }))
  }

  return eventStream.send()
})

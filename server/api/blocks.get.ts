import { NimiqRPCClient } from 'nimiq-rpc-client-ts'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  const nodeRpcUrl = useRuntimeConfig().nodeRpcUrl
  console.log('Connecting to Nimiq node', nodeRpcUrl)

  const client = new NimiqRPCClient(nodeRpcUrl)

  const { next: nextBlock, close } = await client.blockchainStreams.subscribeForBlocks()

  nextBlock(async ({ error, data: block }) => {
    if (error?.code || !block) {
      console.error(`Error subscribing to head block: ${JSON.stringify(error)}`)
      return
    }
    // eslint-disable-next-line no-console
    console.log(`block ${block.number}`)
    await eventStream.push(JSON.stringify(block))
  })

  eventStream.onClosed(() => {
    console.log('Event stream closed')
    close()
  })

  return eventStream.send()
})

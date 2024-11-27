import { NimiqRPCClient } from 'nimiq-rpc-client-ts'

let closeFn: (() => void) | undefined

export default defineWebSocketHandler({
  async open(peer) {
    const nodeRpcUrl = useRuntimeConfig().nodeRpcUrl
    console.log('Connecting to Nimiq node at')

    const client = new NimiqRPCClient(nodeRpcUrl)

    const { next: nextBlock, close } = await client.blockchainStreams.subscribeForBlocks()
    closeFn = close

    nextBlock(async ({ error, data: block }) => {
      if (error?.code || !block) {
        console.error(`Error subscribing to head block: ${JSON.stringify(error)}`)
        return
      }
      // eslint-disable-next-line no-console
      console.log(`block ${block.number}`)
      peer.send(JSON.stringify(block))
    })
  },

  // async message(peer) {
  // },

  close(_peer, _event) {
    if (closeFn)
      closeFn()
  },

  error(_peer, _event) {
    if (closeFn)
      closeFn()
  },
})

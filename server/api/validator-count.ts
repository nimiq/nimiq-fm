import { NimiqRPCClient } from '@albermonte/nimiq-rpc-client-ts'

interface ValidatorFromApi {
  id: number
  name: string
  address: string
  logo: string
  balance: string
  dominanceRatio: number
}

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const nodeRpcUrl = config.nimiqRpcUrl

  const client = new NimiqRPCClient(new URL(nodeRpcUrl))

  const { data: currentBlockNumber, error: getBlockError } = await client.blockchain.getBlockNumber()
  if (!currentBlockNumber) {
    throw new Error(getBlockError?.message || 'Failed to get block number')
  }

  const { data: electionBlockNumber, error: electionError } = await client.policy.getLastElectionBlock(currentBlockNumber)
  if (!electionBlockNumber) {
    throw new Error(electionError?.message || 'Failed to get last election block number')
  }

  const [{ data: electionBlock, error: blockError }, validatorsFromApi] = await Promise.all([
    client.blockchain.getBlockByNumber(electionBlockNumber, { includeBody: true }),
    $fetch<ValidatorFromApi[]>('https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false'),
  ])

  if (!electionBlock || !electionBlock.isElectionBlock) {
    throw new Error(`Failed to retrieve validators from election block. Error: ${blockError?.message}`)
  }

  const validators = electionBlock.slots.map(slot => ({ address: slot.validator, numSlots: slot.numSlots }))

  return {
    count: Array.isArray(validators) ? validators.length : 0,
    validators: validators?.map((validator) => {
      const apiValidator = validatorsFromApi.find(v => v.address === validator.address)
      return {
        ...validator,
        name: apiValidator?.name !== 'Unknown validator' ? apiValidator?.name : undefined,
        logo: apiValidator?.logo,
      }
    }) || [],
  }
}, {
  maxAge: 60, // Cache for 60 seconds
  staleMaxAge: 120, // Serve stale content for up to 120 seconds while revalidating
})

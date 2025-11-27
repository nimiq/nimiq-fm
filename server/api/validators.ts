import type { Slots } from 'nimiq-rpc-client-ts/types'
import * as rpc from 'nimiq-rpc-client-ts'

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
  rpc.initRpcClient({ url: config.nimiqRpcUrl })

  const [okBlock, errBlock, currentBlockNumber] = await rpc.getBlockNumber()
  if (!okBlock)
    throw new Error(errBlock || 'Failed to get block number')

  const [okElection, errElection, electionBlockNumber] = await rpc.getLastElectionBlock({ blockNumber: currentBlockNumber })
  if (!okElection)
    throw new Error(errElection || 'Failed to get last election block number')

  const [[okElectionBlock, errElectionBlock, electionBlock], validatorsFromApi] = await Promise.all([
    rpc.getBlockByNumber<true>({ blockNumber: electionBlockNumber, includeBody: true }),
    $fetch<ValidatorFromApi[]>('https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false')
      .catch((error) => {
        console.error('Failed to fetch validator metadata from external API:', error)
        return []
      }),
  ])

  if (!okElectionBlock || !electionBlock || !('isElectionBlock' in electionBlock))
    throw new Error(`Failed to retrieve validators from election block. Error: ${errElectionBlock}`)

  if (!electionBlock.isElectionBlock)
    throw new Error(`Invalid election block. Error: ${errElectionBlock}`)

  const validators = electionBlock.slots.map((slot: Slots) => ({ address: slot.validator, numSlots: slot.numSlots }))

  return {
    count: validators.length,
    validators: validators.map((validator: { address: string, numSlots: number }) => {
      const apiValidator = validatorsFromApi.find(v => v.address === validator.address)
      return {
        ...validator,
        name: apiValidator?.name !== 'Unknown validator' ? apiValidator?.name : undefined,
        logo: apiValidator?.logo,
      }
    }),
  }
}, { maxAge: 60, staleMaxAge: 120 })

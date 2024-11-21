// import init, { Client, ClientConfiguration, type ConsensusState, type PlainBlock } from '@nimiq/core/web'

// export const useNimiqNetwork = defineStore('network', () => {
//   const client = ref<Client>()
//   const head = ref<PlainBlock>()
//   const height = computed(() => head.value?.height || -1)
//   const consensus = ref<ConsensusState>('connecting')
//   const peerCount = ref<number>(0)

//   onMounted(async () => {
//     await init()
//     const config = new ClientConfiguration()
//     config.network('MainAlbatross')
//     client.value = await Client.create(config.build())

//     client.value.addConsensusChangedListener(newConsensus => consensus.value = newConsensus)
//     client.value.addHeadChangedListener(async newHead => head.value = await client.value?.getBlock(newHead))
//     client.value.addPeerChangedListener((peer_id, reason, count) => peerCount.value = count)
//   })

//   return {
//     client,
//     consensus,
//     head,
//     height,
//     peerCount,
//   }
// })

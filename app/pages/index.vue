<script setup lang="ts">
import { makeHash } from 'identicons-esm/core'

const currentBlock = ref<BlockEvent | null>(null)
const isPlaying = ref(false)

// Initialize composables only on client-side
let strudel: ReturnType<typeof useStrudel> | null = null
let blockchain: ReturnType<typeof useBlockchain> | null = null

async function togglePlay() {
  if (!strudel)
    return

  if (!isPlaying.value) {
    await strudel.start()
    isPlaying.value = true
  }
  else {
    strudel.stop()
    isPlaying.value = false
  }
}

onMounted(() => {
  // Initialize composables (client-side only)
  strudel = useStrudel()
  blockchain = useBlockchain()

  // Initialize Strudel in background (waits for first user interaction)
  // Will complete when user clicks Play button
  strudel.init()

  // Start listening to blockchain events
  blockchain.startListening()

  blockchain.onBlockEvent((blockEvent) => {
    currentBlock.value = blockEvent

    if (!isPlaying.value || !strudel)
      return

    strudel.playBlockSound({ validatorAddress: blockEvent.validatorAddress, epoch: blockEvent.epoch, batch: blockEvent.batch, blockNumber: blockEvent.blockNumber })
  })
})
</script>

<template>
  <UContainer>
    <UPageHero title="Nimiq Song" description="Listen to the blockchain" align="center">
      <template #links>
        <UButton :label="isPlaying ? 'Stop' : 'Play'" size="xl" :color="isPlaying ? 'error' : 'primary'" @click="togglePlay" />
      </template>
    </UPageHero>
    <UPageSection v-if="currentBlock?.validatorAddress" class="text-center">
      <div class="text-sm text-gray-500 mb-2">
        Latest Block Validator
      </div>
      <div class="font-mono text-2xl font-bold break-all">
        {{ currentBlock.validatorAddress }}
      </div>
      <div class="font-mono text-2xl font-bold break-all">
        {{ makeHash(currentBlock.validatorAddress) }}
      </div>
    </UPageSection>
  </UContainer>

  <UFooter>
    <p>
      Made with ❤️ by <a href="https://nimiq.com" target="_blank" rel="noopener" class="underline">Team Nimiq</a> using <a href="https://strudel.cc/" target="_blank" rel="noopener" class="underline">Strudel</a>
    </p>
  </UFooter>
</template>

<script setup lang="ts">
import { makeHash } from 'identicons-esm/core'

const { init, playBlockSound } = useStrudel()
const { startListening, onBlockEvent } = useBlockchain()
const currentBlock = ref<BlockEvent | null>(null)
const isPlaying = ref(false)

async function togglePlay() {
  if (!isPlaying.value) {
    await init()
    isPlaying.value = true
  }
  else {
    isPlaying.value = false
  }
}

onMounted(() => {
  startListening()

  onBlockEvent((blockEvent) => {
    currentBlock.value = blockEvent

    if (!isPlaying.value || !blockEvent.validatorAddress)
      return

    playBlockSound({ validatorAddress: blockEvent.validatorAddress })
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
</template>

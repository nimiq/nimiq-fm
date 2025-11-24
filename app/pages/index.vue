<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import OrbOverlay from '~/components/OrbOverlay.vue'
import OrbScene from '~/components/OrbScene.vue'
import { useBlockchain } from '~/composables/useBlockchain'
import { AudioSimulator } from '~/utils/audio-simulator'
import { BLOCK_INTERVAL_MS } from '~/utils/orb-constants'

const audioSim = new AudioSimulator()
const audioData = ref(0)
const blockHeight = ref(35678581) // Start with a realistic number

const { startListening, latestBlock } = useBlockchain()

let audioFrameId: number
let blockIntervalId: ReturnType<typeof setInterval>

onMounted(() => {
  startListening()

  // Audio Loop
  const loop = () => {
    const data = audioSim.getAudioData()
    audioData.value = data
    audioFrameId = requestAnimationFrame(loop)
  }
  loop()

  // Fallback Block Height Loop (stops if real blocks arrive)
  blockIntervalId = setInterval(() => {
    if (!latestBlock.value) {
      blockHeight.value += 1
    }
  }, BLOCK_INTERVAL_MS)
})

watch(latestBlock, (block) => {
  if (block) {
    blockHeight.value = block.blockNumber
  }
})

onUnmounted(() => {
  cancelAnimationFrame(audioFrameId)
  clearInterval(blockIntervalId)
})
</script>

<template>
  <!-- Background: Very deep, neutral dark grey/black gradient. Minimalistic. -->
  <div class="relative w-full h-full bg-[radial-gradient(circle_at_center,#0f172a_0%,#000000_100%)] overflow-hidden h-screen">
    <div class="absolute inset-0 z-0">
      <OrbScene :audio-data="audioData" />
    </div>

    <div class="absolute inset-0 z-10 pointer-events-none">
      <OrbOverlay :block-height="blockHeight" />
    </div>
  </div>
</template>

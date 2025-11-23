<script setup lang="ts">
const peerCount = ref(2000)
const orbRef = ref()

const { init, playBlockSound, audioData } = useStrudel()
const { startListening, onBlockEvent } = useBlockchain()

// Simulate dynamic peer count changes
function simulatePeerFluctuation() {
  setInterval(() => {
    const change = Math.floor(Math.random() * 40) - 20
    peerCount.value = Math.max(1500, Math.min(3000, peerCount.value + change))
  }, 5000)
}

onMounted(async () => {
  await init()
  startListening()
  
  onBlockEvent((block) => {
    playBlockSound({ validatorAddress: block.validatorAddress || block.hash })

    if (orbRef.value?.triggerBlock) {
      orbRef.value.triggerBlock(block.validatorAddress)
    }
  })

  // simulatePeerFluctuation()
})
</script>

<template>
  <div class="orb-demo-page">
    <div class="orb-container">
      <DataOrb ref="orbRef" :audio-data="audioData" :peer-count="peerCount" />
    </div>

    <div class="controls">
      <div class="peer-info">
        Peers: {{ peerCount }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.orb-demo-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.orb-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.peer-info {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}
</style>

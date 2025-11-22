<script setup lang="ts">
const songTheme = ref('dunesOfDessert')
const peerCount = ref(2000)
const orbRef = ref()

const { init, playBlockSound, audioData } = useStrudel()
const { startListening, onBlockEvent } = useBlockchain()

function toggleTheme() {
  songTheme.value = songTheme.value === 'dunesOfDessert' ? 'qinim' : 'dunesOfDessert'
}

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

    if (Math.random() > 0.5) {
      peerCount.value = Math.min(3000, peerCount.value + Math.floor(Math.random() * 10))
    }
  })

  simulatePeerFluctuation()
})
</script>

<template>
  <div class="orb-demo-page">
    <div class="orb-container">
      <DataOrb ref="orbRef" :audio-data="audioData" :song-theme="songTheme" :peer-count="peerCount" />
    </div>

    <div class="controls">
      <div class="peer-info">
        Peers: {{ peerCount }}
      </div>
      <button @click="toggleTheme" class="theme-toggle">
        Toggle Theme ({{ songTheme }})
      </button>
    </div>
  </div>
</template>

<style scoped>
.orb-demo-page {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #2E3669 0%, #181B38 50%, #0B0C16 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.orb-container {
  width: 600px;
  height: 600px;
  max-width: 90vw;
  max-height: 90vh;
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

.theme-toggle {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
</style>

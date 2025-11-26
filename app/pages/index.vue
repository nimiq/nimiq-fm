<script setup lang="ts">
import { batchAt, batchIndexAt, BLOCKS_PER_BATCH } from '@nimiq/utils/albatross-policy'

const BATCHES_PER_SONG = 3
const BLOCKS_PER_SONG = BLOCKS_PER_BATCH * BATCHES_PER_SONG // 180 blocks

const currentBlock = ref<BlockEvent | null>(null)
const isPlaying = ref(false)
const cycleTitle = 'Macroblock Song Cycle'

// Initialize composables only on client-side (shallowRef for reactivity)
const strudel = shallowRef<ReturnType<typeof useStrudel> | null>(null)
let blockchain: ReturnType<typeof useBlockchain> | null = null

async function togglePlay() {
  if (!strudel.value)
    return

  if (!isPlaying.value) {
    await strudel.value.start()
    isPlaying.value = true
  }
  else {
    strudel.value.stop()
    isPlaying.value = false
  }
}

onMounted(async () => {
  // Initialize composables (client-side only)
  strudel.value = useStrudel()
  blockchain = useBlockchain()

  // Initialize and auto-start playback
  await strudel.value.init()
  await strudel.value.start()
  isPlaying.value = true

  // Start listening to blockchain events
  blockchain.startListening()

  blockchain.onBlockEvent((blockEvent) => {
    currentBlock.value = blockEvent

    if (!isPlaying.value || !strudel.value)
      return

    strudel.value.playBlockSound({ validatorAddress: blockEvent.validatorAddress, epoch: blockEvent.epoch, batch: blockEvent.batch, blockNumber: blockEvent.blockNumber })
  })
})

const nowPlayingTitle = computed(() => strudel.value?.nowPlaying.value || '')
const displayNowPlaying = computed(() => nowPlayingTitle.value || 'Tuning in...')
const nextSongTitle = computed(() => currentBlock.value ? getNextSongName(currentBlock.value.blockNumber) : '')

// Progress within 3-batch song cycle (180 blocks total)
const blocksElapsedInSong = computed(() => {
  if (!currentBlock.value)
    return 0
  const globalBatch = batchAt(currentBlock.value.blockNumber)
  const batchInSong = globalBatch % BATCHES_PER_SONG // 0, 1, or 2
  const blockInBatch = batchIndexAt(currentBlock.value.blockNumber) // 0-59
  return batchInSong * BLOCKS_PER_BATCH + blockInBatch
})
const blocksLeftInSong = computed(() => BLOCKS_PER_SONG - blocksElapsedInSong.value - 1)
const progressLabel = computed(() => `${blocksLeftInSong.value} blocks left`)
const blockMeta = computed(() => {
  if (!currentBlock.value)
    return 'Waiting for blocks...'

  return `Block ${currentBlock.value.blockNumber} · Batch ${currentBlock.value.batch} · Epoch ${currentBlock.value.epoch}`
})
const validatorAddress = computed(() => currentBlock.value ? currentBlock.value.validatorAddress : '')
</script>

<template>
  <div class="relative min-h-screen bg-slate-900 overflow-hidden text-white">
    <!-- Circular Gradient Background for Orb -->
    <div class="absolute inset-0 z-0 orb-gradient-background" />

    <!-- Background Orb Visualization -->
    <ClientOnly>
      <div class="absolute inset-0 z-1">
        <OrbScene :audio-data="0" />
      </div>
    </ClientOnly>

    <!-- Main Content -->
    <div class="relative z-10 flex flex-col min-h-screen pointer-events-none">
      <!-- Play/Stop Button - Top Right -->
      <div class="absolute top-8 right-8 pointer-events-auto">
        <UButton :label="isPlaying ? 'Stop' : 'Tune in'" size="lg" :color="isPlaying ? 'error' : 'primary'" @click="togglePlay" />
      </div>

      <div class="flex-1" />

      <div class="pointer-events-auto px-4 sm:px-8 pb-6">
        <div class="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5 sm:p-6">
            <button
              class="w-12 h-12 rounded-full border border-amber-200/60 bg-black/30 hover:border-white/70 hover:shadow-[0_0_30px_rgba(251,191,36,0.45)] transition-all duration-300 flex items-center justify-center text-amber-200"
              @click="togglePlay"
            >
              <span class="sr-only">Toggle playback</span>
              <UIcon :name="isPlaying ? 'i-heroicons-pause-20-solid' : 'i-heroicons-play-20-solid'" class="w-6 h-6" />
            </button>

            <div class="flex-1 w-full space-y-3">
              <div class="flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.12em] text-white/70 font-semibold">
                <span class="text-white/80">{{ cycleTitle }}</span>
                <span class="ml-auto text-xs text-white/80">{{ progressLabel }}</span>
              </div>

              <UProgress
                :model-value="blocksElapsedInSong"
                :max="BLOCKS_PER_SONG - 1"
                :status="false"
                color="primary"
                class="w-full"
                :ui="{
                  base: 'h-2 rounded-full bg-white/10 overflow-hidden',
                  indicator: 'bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-200 shadow-[0_0_25px_rgba(56,189,248,0.35)] rounded-full',
                }"
              />

              <div class="space-y-1">
                <div class="text-lg sm:text-xl font-semibold text-white">
                  Now Playing: {{ displayNowPlaying }}
                </div>
                <div class="text-sm text-white/60">
                  Up Next: {{ nextSongTitle }}
                </div>
                <div class="text-xs text-white/50">
                  {{ blockMeta }}
                </div>
                <div class="text-xs text-white/50">
                  {{ validatorAddress }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Blockchain Viewer at Bottom -->
      <div class="pointer-events-auto z-20 w-full pt-0 pb-4 relative overflow-hidden">
        <!-- Gradient Background -->
        <div class="absolute inset-0 bg-linear-to-t from-slate-900 to-transparent pointer-events-none" />

        <!-- Blockchain Content -->
        <div class="relative z-10">
          <BlockchainViewer />
        </div>
        <UFooter class="relative pointer-events-auto bg-transparent border-t-0">
          <p class="text-white/50 text-xs">
            Made with ❤️ by <a href="https://nimiq.com" target="_blank" rel="noopener" class="underline hover:text-white transition-colors">Team Nimiq</a> using <a href="https://strudel.cc/" target="_blank" rel="noopener" class="underline hover:text-white transition-colors">Strudel</a>
          </p>
        </UFooter>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orb-gradient-background {
  background: radial-gradient(
    circle at 50% 45%,
    rgba(56, 191, 248, 0.042) 0%,
    rgba(99, 101, 241, 0.029) 20%,
    rgba(2, 6, 23, 0.95) 80%,
    #020617 100%
  );
}
</style>

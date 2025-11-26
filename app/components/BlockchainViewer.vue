<script setup lang="ts">
import { batchAt, batchIndexAt, BLOCKS_PER_BATCH } from '@nimiq/utils/albatross-policy'
import { AnimatePresence, Motion } from 'motion-v'
import { useBlockchain } from '~/composables/useBlockchain'
import { getCurrentSongName, getNextSongName } from '~/utils/song'

const BATCHES_PER_SONG = 3
const VISIBLE_BATCHES = 4

const { latestBlock } = useBlockchain()

// Track if blockchain has loaded (first block received)
const isLoaded = computed(() => latestBlock.value !== null)

// Current block info
const currentBlockNumber = computed(() => latestBlock.value?.blockNumber ?? null)
const currentGlobalBatch = computed(() => currentBlockNumber.value !== null ? batchAt(currentBlockNumber.value) : 0)

// Song cycle index (increments every 3 batches)
const songCycleIndex = computed(() => Math.floor(currentGlobalBatch.value / BATCHES_PER_SONG))

// Position within the song cycle
const batchInSong = computed(() => currentGlobalBatch.value % BATCHES_PER_SONG)
const blockInBatch = computed(() => currentBlockNumber.value !== null ? batchIndexAt(currentBlockNumber.value) : 0)
const blocksElapsedInSong = computed(() => batchInSong.value * BLOCKS_PER_BATCH + blockInBatch.value)

// Generate the 4 visible batches with unique keys based on song cycle
const visibleBatches = computed(() => {
  return Array.from({ length: VISIBLE_BATCHES }, (_, i) => ({
    relativeIndex: i,
    isNextSong: i >= BATCHES_PER_SONG,
    uniqueKey: `${songCycleIndex.value}-${i}`,
  }))
})

const currentSongName = computed(() => latestBlock.value ? getCurrentSongName(latestBlock.value.blockNumber) : 'Loading...')
const nextSongName = computed(() => latestBlock.value ? getNextSongName(latestBlock.value.blockNumber) : '')

// Format block number as array of characters for slot machine effect
const formattedBlockDigits = computed(() => {
  if (currentBlockNumber.value === null)
    return []
  return currentBlockNumber.value.toLocaleString('en-US').replace(/,/g, ' ').split('')
})

// Track if this is the initial load (no animation on first render)
const hasInitialized = ref(false)
watch(currentBlockNumber, () => {
  if (!hasInitialized.value && currentBlockNumber.value !== null) {
    // Small delay to mark as initialized after first render
    nextTick(() => {
      hasInitialized.value = true
    })
  }
})

function getBlockState(batchRelativeIndex: number, blockIndexInBatch: number): 'unplayed' | 'played' | 'current' {
  if (currentBlockNumber.value === null)
    return 'unplayed'
  if (batchRelativeIndex >= BATCHES_PER_SONG)
    return 'unplayed'

  const blockPositionInSong = batchRelativeIndex * BLOCKS_PER_BATCH + blockIndexInBatch

  if (blockPositionInSong === blocksElapsedInSong.value)
    return 'current'
  if (blockPositionInSong < blocksElapsedInSong.value)
    return 'played'
  return 'unplayed'
}

function getBatchBlockIndices() {
  return Array.from({ length: BLOCKS_PER_BATCH }, (_, i) => i)
}
</script>

<template>
  <div class="w-full flex flex-col items-center px-4 sm:px-8">
    <!-- Container fades in when blockchain loads -->
    <AnimatePresence>
      <Motion
        v-if="isLoaded"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.6, ease: 'easeOut' }"
        class="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/5 p-4 sm:p-6 overflow-hidden"
      >
        <!-- Content slides LEFT on song change -->
        <AnimatePresence :initial="false" mode="popLayout">
          <Motion
            :key="songCycleIndex"
            :initial="{ x: '100%', opacity: 0 }"
            :animate="{ x: 0, opacity: 1 }"
            :exit="{ x: '-100%', opacity: 0 }"
            :transition="{ duration: 0.5, ease: 'easeInOut' }"
          >
            <!-- Blockline Row -->
            <div class="flex justify-center">
              <template v-for="batch in visibleBatches" :key="batch.uniqueKey">
                <!-- Macro Block -->
                <div class="batch-item shrink-0 flex items-center">
                  <div class="size-6 sm:size-8 rounded bg-[#0582CA] shadow-[0_0_12px_rgba(5,130,202,0.5)] flex items-center justify-center mx-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-3.5 sm:h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>

                <!-- Batch Grid -->
                <div class="shrink-0 grid grid-rows-4 gap-0.5 p-2" style="grid-template-columns: repeat(15, minmax(0, 1fr));">
                  <div
                    v-for="blockIdx in getBatchBlockIndices()"
                    :key="blockIdx"
                    class="size-1.5 sm:size-2 rounded-sm transition-all duration-300"
                    :class="{
                      'bg-slate-700/40': getBlockState(batch.relativeIndex, blockIdx) === 'unplayed',
                      'bg-slate-400': getBlockState(batch.relativeIndex, blockIdx) === 'played',
                      'bg-orange-500 current-block-glow': getBlockState(batch.relativeIndex, blockIdx) === 'current',
                    }"
                  />
                </div>
              </template>
            </div>

            <!-- Labels Row - slides with blocks -->
            <div class="flex mt-4 text-xs sm:text-sm">
              <div class="flex-3 text-white/80">
                <span class="text-white/50">Playing: </span>{{ currentSongName }}
              </div>
              <div class="flex-1 text-right text-white/50">
                <span>Next: </span>{{ nextSongName }}
              </div>
            </div>
          </Motion>
        </AnimatePresence>

        <!-- Block counter - slot machine style -->
        <div class="mt-3 text-center">
          <div class="text-lg sm:text-xl font-mono font-bold text-white/80 tabular-nums flex justify-center overflow-hidden h-7">
            <template v-for="(char, idx) in formattedBlockDigits" :key="idx">
              <div class="relative w-[0.6em] h-7 overflow-hidden">
                <AnimatePresence :initial="false" mode="popLayout">
                  <Motion
                    :key="`${idx}-${char}`"
                    :initial="hasInitialized ? { y: '100%', opacity: 0 } : false"
                    :animate="{ y: 0, opacity: 1 }"
                    :exit="{ y: '-100%', opacity: 0 }"
                    :transition="{ duration: 0.3, ease: 'easeOut' }"
                    class="absolute inset-0 flex items-center justify-center"
                  >
                    {{ char }}
                  </Motion>
                </AnimatePresence>
              </div>
            </template>
          </div>
        </div>
      </Motion>
    </AnimatePresence>
  </div>
</template>

<style scoped>
@keyframes current-glow {
  0% { box-shadow: 0 0 8px 4px rgba(255, 96, 0, 0.9); }
  100% { box-shadow: 0 0 2px 1px rgba(255, 96, 0, 0.3); }
}

.current-block-glow {
  animation: current-glow 1s ease-out forwards;
}
</style>

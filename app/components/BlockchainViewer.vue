<script setup lang="ts">
import { batchAt, batchIndexAt, BLOCKS_PER_BATCH } from '@nimiq/utils/albatross-policy'
import { AnimatePresence, Motion } from 'motion-v'
import { useBlockchain } from '~/composables/useBlockchain'
import { getSongNameByIndex } from '~/utils/song'

const BATCHES_PER_SONG = 3
const VISIBLE_BATCHES = 6

const { latestBlock } = useBlockchain()

// Track if blockchain has loaded (first block received)
const isLoaded = computed(() => latestBlock.value !== null)

// Current block info
const currentBlockNumber = computed(() => latestBlock.value?.blockNumber ?? null)
const currentGlobalBatch = computed(() => currentBlockNumber.value !== null ? batchAt(currentBlockNumber.value) : 0)
const currentBatch = computed(() => latestBlock.value?.batch ?? 0)

// Song cycle index (increments every 3 batches)
const songCycleIndex = computed(() => Math.floor(currentGlobalBatch.value / BATCHES_PER_SONG))

// Position within the song cycle
const batchInSong = computed(() => currentGlobalBatch.value % BATCHES_PER_SONG)
const blockInBatch = computed(() => currentBlockNumber.value !== null ? batchIndexAt(currentBlockNumber.value) : 0)
const blocksElapsedInSong = computed(() => batchInSong.value * BLOCKS_PER_BATCH + blockInBatch.value)

const visibleBatches = computed(() => {
  return Array.from({ length: VISIBLE_BATCHES }, (_, i) => ({
    relativeIndex: i,
    isNextSong: i >= BATCHES_PER_SONG,
    uniqueKey: `${songCycleIndex.value}-${i}`,
    songName: getSongNameByIndex(songCycleIndex.value + Math.floor(i / BATCHES_PER_SONG)),
    isFirstOfSong: i === 0 || i === BATCHES_PER_SONG,
  }))
})

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
  <div class="w-full overflow-x-auto p-6">
    <div class="flex justify-center items-center flex-nowrap">
      <template v-for="batch in visibleBatches" :key="batch.uniqueKey">
        <!-- Show macro block as special only if it's the first of a song -->
        <template v-if="batch.isFirstOfSong">
          <div class="size-5 sm:size-6 rounded bg-white flex items-center justify-center shrink-0 ml-4 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-3 sm:h-3"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        </template>

        <div class="grid grid-rows-2 gap-x-1 ml-1 gap-y-1" style="grid-template-columns: repeat(30, minmax(0, 1fr)); grid-auto-flow: column;">
          <div
            v-for="blockIdx in getBatchBlockIndices()"
            :key="blockIdx"
            class="size-1 rounded-[1px] transition-all duration-1000"
            :class="{
              'bg-slate-600/50': getBlockState(batch.relativeIndex, blockIdx) === 'unplayed',
              'bg-white': getBlockState(batch.relativeIndex, blockIdx) === 'played',
              'bg-orange-500 current-block-glow': getBlockState(batch.relativeIndex, blockIdx) === 'current',
            }"
          />
        </div>
      </template>
    </div>

    <!-- <AnimatePresence>
      <Motion
        v-if="isLoaded"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.6, ease: 'easeOut' }"
        class="overflow-hidden"
      >

        <AnimatePresence :initial="false" mode="popLayout">
          <Motion
            :key="songCycleIndex"
            :initial="{ x: '100%', opacity: 0 }"
            :animate="{ x: 0, opacity: 1 }"
            :exit="{ x: '-100%', opacity: 0 }"
            :transition="{ duration: 0.5, ease: 'easeInOut' }"
          >

            <div class="flex justify-center items-end gap-0.5 sm:gap-1">
              <template v-for="batch in visibleBatches" :key="batch.uniqueKey">

                <div class="batch-section shrink-0 flex flex-col items-center">

                  <div class="flex items-center">

                    <div class="size-6 sm:size-7 rounded bg-[#0582CA] shadow-[0_0_12px_rgba(5,130,202,0.5)] flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-3 sm:h-3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>

                    <div class="shrink-0 grid grid-rows-2 gap-0.5 ml-1" style="grid-template-columns: repeat(30, minmax(0, 1fr));">
                      <div
                        v-for="blockIdx in getBatchBlockIndices()"
                        :key="blockIdx"
                        class="size-[3px] sm:size-1 rounded-[1px] transition-all duration-1000"
                        :class="{
                          'bg-slate-600/50': getBlockState(batch.relativeIndex, blockIdx) === 'unplayed',
                          'bg-slate-400/70': getBlockState(batch.relativeIndex, blockIdx) === 'played',
                          'bg-orange-500 current-block-glow': getBlockState(batch.relativeIndex, blockIdx) === 'current',
                        }"
                      />
                    </div>
                  </div>

                  <div class="mt-1.5 text-[9px] sm:text-[10px] text-white/50 whitespace-nowrap font-light">
                    {{ batch.songName }}
                  </div>
                </div>
              </template>
            </div>

            <div class="flex justify-center mt-1.5 text-[9px] sm:text-[10px] text-white/50">
              <span>Batch {{ currentBatch.toLocaleString() }}</span>
              <span class="mx-2">·</span>
              <span>Block </span>
              <span class="font-mono tabular-nums flex overflow-hidden">
                <template v-for="(char, idx) in formattedBlockDigits" :key="idx">
                  <span class="relative overflow-hidden">
                    <AnimatePresence :initial="false" mode="popLayout">
                      <Motion
                        :key="`${idx}-${char}`"
                        :initial="hasInitialized ? { y: '100%', opacity: 0 } : false"
                        :animate="{ y: 0, opacity: 1 }"
                        :exit="{ y: '-100%', opacity: 0 }"
                        :transition="{ duration: 0.3, ease: 'easeOut' }"
                        class="inline-block"
                      >
                        {{ char }}
                      </Motion>
                    </AnimatePresence>
                  </span>
                </template>
              </span>
            </div>
          </Motion>
        </AnimatePresence>
      </Motion>
    </AnimatePresence> -->
  </div>
</template>

<style scoped>
@keyframes current-glow {
  0% { box-shadow: 0 0 8px 4px rgba(255, 96, 0, 0.9); }
  100% { box-shadow: 0 0 2px 1px rgba(255, 96, 0, 0.3); }
}

@keyframes fade-to-played {
  0% { background-color: rgb(249 115 22); } /* orange-500 */
  100% { background-color: rgba(255, 255, 255); } /* white */
}

.current-block-glow {
  animation: current-glow 1s ease-out forwards, fade-to-played 1s ease-out forwards;
}
</style>

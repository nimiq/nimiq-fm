<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'
import { batchAt, batchIndexAt, BLOCKS_PER_BATCH } from '@nimiq/utils/albatross-policy'
import { useBlockchain } from '~/composables/useBlockchain'
import { getSongNameByIndex } from '~/utils/song'

const BATCHES_PER_SONG = 3
const BLOCKS_PER_ROW = 30
const BLOCK_SIZE = 4
const BLOCK_GAP = 4
const MACRO_SIZE = 14
const MACRO_GAP = 6

const { latestBlock } = useBlockchain()

const currentBlockNumber = computed(() => latestBlock.value?.blockNumber ?? null)
const currentGlobalBatch = computed(() => currentBlockNumber.value !== null ? batchAt(currentBlockNumber.value) : 0)
const currentBatch = computed(() => latestBlock.value?.batch ?? 0)
const currentSongIndex = computed(() => Math.floor(currentGlobalBatch.value / BATCHES_PER_SONG))
const batchInSong = computed(() => currentGlobalBatch.value % BATCHES_PER_SONG)
const blockInBatch = computed(() => currentBlockNumber.value !== null ? batchIndexAt(currentBlockNumber.value) : 0)
const blocksElapsedInCurrentSong = computed(() => batchInSong.value * BLOCKS_PER_BATCH + blockInBatch.value)

// Calculate sizes
const batchWidth = BLOCKS_PER_ROW * (BLOCK_SIZE + BLOCK_GAP) - BLOCK_GAP // 236px
const songWidth = MACRO_SIZE + MACRO_GAP + 3 * (batchWidth + BLOCK_GAP) // ~740px
const prevSongOffset = songWidth - 80 // Show only last ~80px of previous song

// Show prev, current, next, next-next (4 songs for smooth transition)
const visibleSongs = computed(() => {
  return [-1, 0, 1, 2].map(offset => ({
    offset,
    songIndex: currentSongIndex.value + offset,
    name: getSongNameByIndex(currentSongIndex.value + offset),
  }))
})

const glowingBlock = ref<string | null>(null)

watch(currentBlockNumber, (newBlock, oldBlock) => {
  if (oldBlock !== null && newBlock !== null && newBlock !== oldBlock && blocksElapsedInCurrentSong.value > 0) {
    const prevBlockPos = blocksElapsedInCurrentSong.value - 1
    const prevBatchInSong = Math.floor(prevBlockPos / BLOCKS_PER_BATCH)
    const prevBlockInBatch = prevBlockPos % BLOCKS_PER_BATCH
    glowingBlock.value = `0-${prevBatchInSong}-${prevBlockInBatch}`
    setTimeout(() => { glowingBlock.value = null }, 500)
  }
})

function getBlockState(songOffset: number, batchIdx: number, blockIdx: number): 'unplayed' | 'played' | 'current' | 'glowing' {
  if (songOffset < 0) return 'played' // Previous songs are fully played
  if (songOffset > 0) return 'unplayed' // Future songs are unplayed

  const blockPositionInSong = batchIdx * BLOCKS_PER_BATCH + blockIdx
  if (glowingBlock.value === `${songOffset}-${batchIdx}-${blockIdx}`) return 'glowing'
  if (blockPositionInSong === blocksElapsedInCurrentSong.value) return 'current'
  if (blockPositionInSong < blocksElapsedInCurrentSong.value) return 'played'
  return 'unplayed'
}

// Generate blocks in column-first order: col 0 (0,1), col 1 (2,3), etc.
function getBlocksColumnFirst() {
  const blocks = []
  for (let col = 0; col < BLOCKS_PER_ROW; col++) {
    for (let row = 0; row < 2; row++) {
      blocks.push({ index: col * 2 + row, row, col })
    }
  }
  return blocks
}

const formattedBatch = computed(() => currentBatch.value.toLocaleString('en-US').replace(/,/g, ' '))
const formattedBlock = computed(() => currentBlockNumber.value?.toLocaleString('en-US').replace(/,/g, ' ') ?? '')
const batchDigits = computed(() => formattedBatch.value.split(' '))
const blockDigits = computed(() => formattedBlock.value.split(' '))

// Animation offset for song transitions
const transitionOffset = ref(0)

watch(currentSongIndex, (newIdx, oldIdx) => {
  if (oldIdx !== undefined && newIdx > oldIdx) {
    // Song advanced: start at old position (negative offset = less scroll = shows right side)
    // then animate to 0 (normal position)
    transitionOffset.value = -(songWidth + 16)
    setTimeout(() => { transitionOffset.value = 0 }, 20)
  }
})

// Scroll position: prevSongOffset + transition animation
const scrollX = computed(() => prevSongOffset + transitionOffset.value)
</script>

<template>
  <div class="border overflow-hidden">
    <div class="relative w-full py-4 px-6">
      <div class="overflow-hidden relative">
        <div class="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-[#151e33] to-transparent" />
        <div class="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-[#151e33] to-transparent" />
        <Motion tag="div" class="flex items-center" :animate="{ x: -scrollX }" :transition="{ duration: 0.5, easing: 'ease-out' }">
          <template v-for="song in visibleSongs" :key="song.songIndex">
            <div class="flex items-center shrink-0" :style="{ width: `${songWidth}px`, marginRight: '16px' }">
              <!-- Macro block -->
              <div class="size-3.5 rounded bg-white flex items-center justify-center shrink-0 mr-1.5" :class="{ 'opacity-20': song.offset !== 0 }">
                <div class="size-1 rounded-full bg-[#0f1e3d]" />
              </div>

              <!-- 3 Batches -->
              <div class="flex gap-1">
                <template v-for="batchIdx in 3" :key="batchIdx">
                  <div class="grid grid-cols-[repeat(30,4px)] grid-rows-[repeat(2,4px)] gap-1">
                    <div
                      v-for="block in getBlocksColumnFirst()"
                      :key="block.index"
                      class="size-1 rounded-sm"
                      :class="{
                        'bg-white/20': getBlockState(song.offset, batchIdx - 1, block.index) === 'unplayed',
                        'bg-white': getBlockState(song.offset, batchIdx - 1, block.index) === 'played',
                        'bg-white shadow-[0_0_8px_4px_rgba(255,149,0,0.9)] animate-pulse': getBlockState(song.offset, batchIdx - 1, block.index) === 'current',
                        'bg-white animate-glow-fade': getBlockState(song.offset, batchIdx - 1, block.index) === 'glowing',
                      }"
                      :style="{ gridRow: block.row + 1, gridColumn: block.col + 1 }"
                    />
                  </div>
                </template>
              </div>
            </div>
          </template>
        </Motion>
      </div>

      <!-- Labels row -->
      <div class="mt-2 overflow-hidden relative">
        <div class="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-[#151e33] to-transparent" />
        <div class="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-[#151e33] to-transparent" />
        <Motion tag="div" class="flex" :animate="{ x: -scrollX }" :transition="{ duration: 0.5, easing: 'ease-out' }">
          <template v-for="song in visibleSongs" :key="`label-${song.songIndex}`">
            <div class="shrink-0 flex items-center gap-1" :style="{ width: `${songWidth}px`, marginRight: '16px' }">
              <AnimatePresence mode="wait">
                <Motion
                  :key="song.name"
                  :initial="{ opacity: 0, y: 4 }"
                  :animate="{ opacity: 1, y: 0 }"
                  :exit="{ opacity: 0, y: -4 }"
                  :transition="{ duration: 0.2 }"
                  class="text-[10px] text-white/50"
                >
                  {{ song.name }}
                </Motion>
              </AnimatePresence>
              <template v-if="song.offset === 0">
                <span class="text-[10px] text-white/50">· Batch</span>
                <span class="text-[10px] text-white/50 font-mono tabular-nums flex">
                  <template v-for="(digit, i) in batchDigits" :key="`batch-${i}`">
                    <AnimatePresence mode="wait">
                      <Motion :key="digit" :initial="{ opacity: 0, y: 4 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -4 }" :transition="{ duration: 0.15 }">{{ digit }}</Motion>
                    </AnimatePresence>
                    <span v-if="i < batchDigits.length - 1">&nbsp;</span>
                  </template>
                </span>
                <span class="text-[10px] text-white/50">· Block</span>
                <span class="text-[10px] text-white/50 font-mono tabular-nums flex">
                  <template v-for="(digit, i) in blockDigits" :key="`block-${i}`">
                    <AnimatePresence mode="wait">
                      <Motion :key="digit" :initial="{ opacity: 0, y: 4 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -4 }" :transition="{ duration: 0.15 }">{{ digit }}</Motion>
                    </AnimatePresence>
                    <span v-if="i < blockDigits.length - 1">&nbsp;</span>
                  </template>
                </span>
              </template>
            </div>
          </template>
        </Motion>
      </div>
    </div>
  </div>
</template>

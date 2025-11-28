<script setup lang="ts">
import { batchAt, batchIndexAt, BLOCKS_PER_BATCH } from '@nimiq/utils/albatross-policy'
import { AnimatePresence, Motion } from 'motion-v'
import { useBlockchain } from '~/composables/useBlockchain'
import { getSongNameByIndex } from '~/utils/song'

const BATCHES_PER_SONG = 3
const BLOCKS_PER_ROW = 30
const BLOCK_SIZE = 4
const BLOCK_GAP = 4
const MACRO_SIZE = 14
const MACRO_GAP = 6

const { latestBlock } = useBlockchain()

// Mobile detection
const breakpoints = useBreakpoints({ sm: 640 })
const isMobile = breakpoints.smaller('sm')

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
const prevSongOffset = computed(() => isMobile.value ? songWidth + 16 : songWidth - 80) // Skip past previous song on mobile

// Show prev, current, next, next-next (4 songs for smooth transition)
const visibleSongs = computed(() => {
  return [-1, 0, 1, 2].map(offset => ({
    offset,
    songIndex: currentSongIndex.value + offset,
    name: getSongNameByIndex(currentSongIndex.value + offset),
  }))
})

const glowingBlock = ref<string | null>(null)

// Fill animation state
const fillBatchIdx = ref<number | null>(null)
const fillProgress = ref<number>(-1) // -1 = not filling, 0-30 = column index
const isFlashing = ref<boolean>(false)
const isFading = ref<boolean>(false)
let fillInterval: ReturnType<typeof setInterval> | null = null

watch(currentBlockNumber, (newBlock, oldBlock) => {
  if (oldBlock !== null && newBlock !== null && newBlock !== oldBlock && blocksElapsedInCurrentSong.value > 0) {
    const prevBlockPos = blocksElapsedInCurrentSong.value - 1
    const prevBatchInSong = Math.floor(prevBlockPos / BLOCKS_PER_BATCH)
    const prevBlockInBatch = prevBlockPos % BLOCKS_PER_BATCH
    glowingBlock.value = `0-${prevBatchInSong}-${prevBlockInBatch}`
    setTimeout(() => {
      glowingBlock.value = null
    }, 500)
  }
})

// Fill animation function
function startFillAnimation(batchIdx: number) {
  // Clear any existing animation
  if (fillInterval)
    clearInterval(fillInterval)

  // Reset states
  isFlashing.value = false
  isFading.value = false

  // Phase 1: Progressive fill
  fillBatchIdx.value = batchIdx
  fillProgress.value = 0

  fillInterval = setInterval(() => {
    fillProgress.value++

    if (fillProgress.value > BLOCKS_PER_ROW) { // 30 columns + macro
      if (fillInterval)
        clearInterval(fillInterval)
      fillInterval = null

      // Phase 2: Hold (150ms) then flash (300ms)
      setTimeout(() => {
        isFlashing.value = true

        // Phase 3: Fade (400ms)
        setTimeout(() => {
          isFlashing.value = false
          isFading.value = true

          // Cleanup
          setTimeout(() => {
            fillBatchIdx.value = null
            fillProgress.value = -1
            isFading.value = false
          }, 400)
        }, 300)
      }, 150)
    }
  }, 20) // 20ms per column
}

// Trigger fill animation when global batch changes
watch(currentGlobalBatch, (newGlobalBatch, oldGlobalBatch) => {
  if (oldGlobalBatch !== undefined && newGlobalBatch > oldGlobalBatch) {
    const oldBatchInSong = oldGlobalBatch % BATCHES_PER_SONG
    // Only animate if not the last batch of a song
    if (oldBatchInSong < BATCHES_PER_SONG - 1) {
      startFillAnimation(oldBatchInSong)
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (fillInterval)
    clearInterval(fillInterval)
})

function getBlockState(songOffset: number, batchIdx: number, blockIdx: number, blockCol: number, _blockRow: number): 'unplayed' | 'played' | 'current' | 'glowing' | 'fill-active' | 'flash-active' | 'fade-active' {
  if (songOffset < 0)
    return 'played'
  if (songOffset > 0)
    return 'unplayed'

  const blockPositionInSong = batchIdx * BLOCKS_PER_BATCH + blockIdx
  if (glowingBlock.value === `${songOffset}-${batchIdx}-${blockIdx}`)
    return 'glowing'
  if (blockPositionInSong === blocksElapsedInCurrentSong.value)
    return 'current'

  // Fill animation (check in priority order)
  if (fillBatchIdx.value === batchIdx && songOffset === 0) {
    if (isFading.value && blockCol <= fillProgress.value)
      return 'fade-active'

    if (isFlashing.value && blockCol <= fillProgress.value)
      return 'flash-active'

    if (fillProgress.value >= 0 && blockCol <= fillProgress.value)
      return 'fill-active'
  }

  if (blockPositionInSong < blocksElapsedInCurrentSong.value)
    return 'played'
  return 'unplayed'
}

// Generate blocks in column-first order: col 0 (0,1), col 1 (2,3), etc.
const BLOCKS_COLUMN_FIRST = (() => {
  const blocks = []
  for (let col = 0; col < BLOCKS_PER_ROW; col++) {
    for (let row = 0; row < 2; row++) {
      blocks.push({ index: col * 2 + row, row, col })
    }
  }
  return blocks
})()

const formattedBatch = computed(() => currentBatch.value.toLocaleString('en-US').replace(/,/g, ' '))
const formattedBlock = computed(() => currentBlockNumber.value?.toLocaleString('en-US').replace(/,/g, ' ') ?? '')
// Split into individual chars for odometer effect (spaces become non-animated separators)
const batchChars = computed(() => formattedBatch.value.split(''))
const blockChars = computed(() => formattedBlock.value.split(''))

// Animation offset for song transitions
const transitionOffset = ref(0)

watch(currentSongIndex, (newIdx, oldIdx) => {
  if (oldIdx !== undefined && newIdx > oldIdx) {
    // Song advanced: start at old position (negative offset = less scroll = shows right side)
    // then animate to 0 (normal position)
    transitionOffset.value = -(songWidth + 16)
    setTimeout(() => {
      transitionOffset.value = 0
    }, 20)
  }
})

// Mobile container ref for measuring width
const timelineContainer = ref<HTMLElement | null>(null)
const { width: containerWidth } = useElementSize(timelineContainer)

// Mobile auto-scroll: center current block position
const mobileAutoScroll = computed(() => {
  if (!isMobile.value)
    return 0
  // Calculate how far into the current song we are (in pixels)
  const batchWidthPx = BLOCKS_PER_ROW * (BLOCK_SIZE + BLOCK_GAP) - BLOCK_GAP
  const currentBatchInSong = batchInSong.value
  const blockInCurrentBatch = blockInBatch.value
  // Position = batches completed + current block position within batch
  const colInBatch = Math.floor(blockInCurrentBatch / 2) // 2 rows per column
  // Account for macro blocks between batches
  const macroOffset = currentBatchInSong * (BLOCK_GAP)
  const pixelOffset = MACRO_SIZE + MACRO_GAP + currentBatchInSong * (batchWidthPx + BLOCK_GAP) + colInBatch * (BLOCK_SIZE + BLOCK_GAP) + macroOffset
  // Center current block in viewport
  const viewportHalf = (containerWidth.value || 320) / 2
  return Math.max(0, pixelOffset - viewportHalf)
})

// Scroll position: prevSongOffset + transition animation + mobile auto-scroll
const scrollX = computed(() => prevSongOffset.value + transitionOffset.value + mobileAutoScroll.value)
</script>

<template>
  <div class="border overflow-hidden">
    <div class="relative w-full py-3 sm:py-4 sm:px-6">
      <!-- Block timeline -->
      <div ref="timelineContainer" class="overflow-x-hidden overflow-y-visible relative py-2 -my-2">
        <div class="hidden sm:block absolute inset-y-0 left-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-[#151e33] to-transparent" />
        <div class="hidden sm:block absolute inset-y-0 right-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-[#151e33] to-transparent" />
        <Motion tag="div" class="flex items-center" :animate="{ x: -scrollX }" :transition="{ duration: 0.5, ease: 'easeOut' }">
          <template v-for="song in visibleSongs" :key="song.songIndex">
            <div class="flex items-center shrink-0" :style="{ width: `${songWidth}px`, marginRight: '16px' }">
              <!-- Macro block -->
              <div class="size-3.5 rounded bg-white flex items-center justify-center shrink-0 mr-1.5" :class="{ 'opacity-20': song.offset !== 0 }">
                <div class="size-1 rounded-full bg-[#0f1e3d]" />
              </div>

              <!-- 3 Batches with macro blocks between them -->
              <div class="flex gap-1 items-center">
                <template v-for="batchIdx in 3" :key="batchIdx">
                  <div class="grid grid-cols-[repeat(30,4px)] grid-rows-[repeat(2,4px)] gap-1">
                    <div
                      v-for="block in BLOCKS_COLUMN_FIRST"
                      :key="`${block.index}-${getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row)}`"
                      class="size-1 rounded-sm wave-transition"
                      :class="{
                        'bg-white/20': getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row) === 'unplayed',
                        'bg-white': getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row) === 'played',
                        'bg-white shadow-[0_0_8px_4px_rgba(255,149,0,0.9)] animate-pulse': getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row) === 'current',
                        'bg-white animate-glow-fade': getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row) === 'glowing',
                        'animate-fill-active': getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row) === 'fill-active',
                        'animate-flash-active': getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row) === 'flash-active',
                        'animate-fade-active': getBlockState(song.offset, batchIdx - 1, block.index, block.col, block.row) === 'fade-active',
                      }"
                      :style="{ gridRow: block.row + 1, gridColumn: block.col + 1 }"
                    />
                  </div>
                  <!-- Macro block between batches (after batch 1 and 2, not after batch 3) -->
                  <div v-if="batchIdx < 3" class="relative shrink-0">
                    <div
                      :key="`macro-${song.songIndex}-${batchIdx}-${fillBatchIdx}-${isFlashing}-${isFading}`"
                      class="w-1 h-3 rounded-sm wave-transition"
                      :class="{
                        'bg-white/20': song.offset > 0 || (song.offset === 0 && batchIdx > batchInSong),
                        'bg-white': (song.offset < 0 || (song.offset === 0 && batchIdx <= batchInSong)) && !(song.offset === 0 && fillBatchIdx === batchIdx - 1 && fillProgress >= BLOCKS_PER_ROW),
                        'animate-fill-active': song.offset === 0 && fillBatchIdx === batchIdx - 1 && fillProgress >= BLOCKS_PER_ROW && !isFlashing && !isFading,
                        'animate-flash-active': song.offset === 0 && fillBatchIdx === batchIdx - 1 && isFlashing,
                        'animate-fade-active': song.offset === 0 && fillBatchIdx === batchIdx - 1 && isFading,
                      }"
                    />
                  </div>
                </template>
              </div>
            </div>
          </template>
        </Motion>
      </div>

      <!-- Labels row - fixed on mobile, scrolling on desktop -->
      <div class="mt-2 overflow-hidden relative">
        <!-- Mobile: fixed labels -->
        <div v-if="isMobile" class="flex items-center gap-1 text-[9px] text-white/50 px-4">
          <AnimatePresence mode="wait">
            <Motion :key="visibleSongs[1]?.name" :initial="{ opacity: 0, y: 4 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -4 }" :transition="{ duration: 0.2 }">
              {{ visibleSongs[1]?.name }}
            </Motion>
          </AnimatePresence>
          <span>· Batch</span>
          <span class="font-mono tabular-nums flex">
            <template v-for="(char, i) in batchChars" :key="`batch-${i}`">
              <span v-if="char === ' '" class="w-1" />
              <AnimatePresence v-else mode="wait">
                <Motion :key="char" :initial="{ opacity: 0, y: 6 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -6 }" :transition="{ duration: 0.2 }">{{ char }}</Motion>
              </AnimatePresence>
            </template>
          </span>
          <span>· Block</span>
          <span class="font-mono tabular-nums flex">
            <template v-for="(char, i) in blockChars" :key="`block-${i}`">
              <span v-if="char === ' '" class="w-1" />
              <AnimatePresence v-else mode="wait">
                <Motion :key="char" :initial="{ opacity: 0, y: 6 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -6 }" :transition="{ duration: 0.2 }">{{ char }}</Motion>
              </AnimatePresence>
            </template>
          </span>
        </div>

        <!-- Desktop: scrolling labels -->
        <template v-else>
          <div class="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-[#151e33] to-transparent" />
          <div class="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-[#151e33] to-transparent" />
          <Motion tag="div" class="flex" :animate="{ x: -scrollX }" :transition="{ duration: 0.5, ease: 'easeOut' }">
            <template v-for="song in visibleSongs" :key="`label-${song.songIndex}`">
              <div class="shrink-0 flex items-center gap-1" :style="{ width: `${songWidth}px`, marginRight: '16px' }">
                <AnimatePresence mode="wait">
                  <Motion :key="song.name" :initial="{ opacity: 0, y: 4 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -4 }" :transition="{ duration: 0.2 }" class="text-[10px] text-white/50">
                    {{ song.name }}
                  </Motion>
                </AnimatePresence>
                <template v-if="song.offset === 0">
                  <span class="text-[10px] text-white/50">· Batch</span>
                  <span class="text-[10px] text-white/50 font-mono tabular-nums flex">
                    <template v-for="(char, i) in batchChars" :key="`batch-${i}`">
                      <span v-if="char === ' '" class="w-1" />
                      <AnimatePresence v-else mode="wait">
                        <Motion :key="char" :initial="{ opacity: 0, y: 6 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -6 }" :transition="{ duration: 0.2 }">{{ char }}</Motion>
                      </AnimatePresence>
                    </template>
                  </span>
                  <span class="text-[10px] text-white/50">· Block</span>
                  <span class="text-[10px] text-white/50 font-mono tabular-nums flex">
                    <template v-for="(char, i) in blockChars" :key="`block-${i}`">
                      <span v-if="char === ' '" class="w-1" />
                      <AnimatePresence v-else mode="wait">
                        <Motion :key="char" :initial="{ opacity: 0, y: 6 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -6 }" :transition="{ duration: 0.2 }">{{ char }}</Motion>
                      </AnimatePresence>
                    </template>
                  </span>
                </template>
              </div>
            </template>
          </Motion>
        </template>
      </div>
    </div>
  </div>
</template>

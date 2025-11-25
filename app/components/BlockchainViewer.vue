<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useBlockchain } from '~/composables/useBlockchain'

interface DisplayBlock {
  id: string
  blockNumber: number
  type: 'micro' | 'macro'
  validatorAddress?: string
  epoch: number
  batch: number
}

const BLOCK_WIDTH = 112 // 96px + 16px gap
const TARGET_OFFSET = -BLOCK_WIDTH / 4
const CHAIN_SPEED_FACTOR = 0.55
const MAX_BLOCKS = 30 // Enough to fill wide screens
const FADE_DISTANCE = 50 // Distance from left edge where fade starts

const { latestBlock } = useBlockchain()
const blocks = ref<DisplayBlock[]>([])
const firstBlockReceived = ref(false)
const blockOpacities = ref<number[]>(Array.from({ length: MAX_BLOCKS }, () => 1))
const blockBlurs = ref<number[]>(Array.from({ length: MAX_BLOCKS }, () => 0))
const blockElements = ref<HTMLElement[]>([])

function updateBlockOpacities() {
  if (!blockElements.value.length)
    return

  for (let i = 0; i < blockElements.value.length; i++) {
    const el = blockElements.value[i]
    if (!el)
      continue

    const rect = el.getBoundingClientRect()
    const leftEdge = rect.left

    if (leftEdge < FADE_DISTANCE) {
      // Calculate opacity: 0 at left edge (0), 1 at FADE_DISTANCE
      const ratio = Math.max(0, leftEdge / FADE_DISTANCE)
      blockOpacities.value[i] = ratio
      // Blur increases as opacity decreases (max 8px blur at edge)
      blockBlurs.value[i] = (1 - ratio) * 8
    }
    else {
      blockOpacities.value[i] = 1
      blockBlurs.value[i] = 0
    }
  }
}

// Prefill with placeholder blocks
for (let i = 0; i < MAX_BLOCKS; i++) {
  blocks.value.push({
    id: `placeholder-${i}`,
    blockNumber: 0,
    type: 'micro',
    validatorAddress: undefined,
    epoch: 0,
    batch: 0,
  })
}

let velocity = 0
let offset = blocks.value.length * BLOCK_WIDTH // Start with blocks filling from left
let frame: number | null = null

const chainElement = ref<HTMLElement>()

function startAnimation() {
  if (frame)
    return

  function loop() {
    frame = requestAnimationFrame(loop)
    velocity = -Math.floor((-TARGET_OFFSET + offset) ** CHAIN_SPEED_FACTOR)
    offset += velocity

    if (chainElement.value) {
      chainElement.value.style.transform = `translate3d(${offset}px, 0, 0)`
    }

    updateBlockOpacities()
  }

  loop()
}

function stopAnimation() {
  if (!frame)
    return
  cancelAnimationFrame(frame)
  frame = null
}

onMounted(() => {
  startAnimation()
})

onBeforeUnmount(() => {
  stopAnimation()
})

watch(latestBlock, (newBlock) => {
  if (!newBlock)
    return

  // On first block, replace all placeholders with real blocks counting backwards
  if (!firstBlockReceived.value) {
    firstBlockReceived.value = true
    blocks.value = []
    for (let i = MAX_BLOCKS - 1; i >= 0; i--) {
      blocks.value.unshift({
        id: `block-${newBlock.blockNumber - i}`,
        blockNumber: newBlock.blockNumber - i,
        type: 'micro',
        validatorAddress: undefined,
        epoch: newBlock.epoch,
        batch: newBlock.batch,
      })
    }
    return
  }

  const displayBlock: DisplayBlock = {
    id: `block-${newBlock.blockNumber}`,
    blockNumber: newBlock.blockNumber,
    type: newBlock.type,
    validatorAddress: newBlock.validatorAddress,
    epoch: newBlock.epoch,
    batch: newBlock.batch,
  }

  // Remove old block BEFORE adding new one to avoid length changes
  if (blocks.value.length >= MAX_BLOCKS) {
    blocks.value.shift()
  }

  blocks.value.push(displayBlock)

  // Always increase offset when adding a block
  offset += BLOCK_WIDTH
})
</script>

<template>
  <div class="w-full overflow-hidden py-10">
    <div class="flex items-center justify-end px-10 min-h-32">
      <div ref="chainElement" class="flex items-center justify-end" style="will-change: transform">
        <TransitionGroup
          tag="div"
          class="flex items-center justify-end gap-4"
          enter-from-class="opacity-0"
          enter-active-class="transition-opacity duration-400 ease-in"
        >
          <div
            v-for="(block, index) in blocks"
            :key="block.id"
            :ref="(el) => { if (el) blockElements[index] = el as HTMLElement }"
            class="relative shrink-0 w-24 h-32 block-enter rounded-xl backdrop-blur-xs"
            :style="{ opacity: blockOpacities[index], filter: `blur(${blockBlurs[index]}px)` }"
          >
            <!-- Macro Block -->
            <div
              v-if="block.type === 'macro'"
              class="w-full h-full bg-[#0582CA] rounded-lg p-2 flex flex-col items-center justify-between shadow-[0_0_15px_rgba(5,130,202,0.4)] border border-blue-400/50"
            >
              <div class="text-center w-full">
                <div class="text-[0.5rem] font-bold text-white/90 uppercase tracking-wider mb-0.5">
                  MACRO
                </div>
                <div class="text-[0.55rem] font-bold text-white font-['Orbitron'] leading-none tracking-tighter">
                  #{{ block.blockNumber }}
                </div>
              </div>

              <div class="flex-1 flex items-center justify-center">
                <div class="w-8 h-8 rounded-full border border-white/80 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>

              <div class="text-center w-full">
                <div class="text-[0.55rem] text-white/70">
                  E{{ block.epoch }}
                </div>
              </div>
            </div>

            <!-- Micro Block -->
            <div
              v-else
              class="w-full h-full bg-[#0f172a]/90 backdrop-blur-sm rounded-lg p-2 flex flex-col justify-between border border-slate-700"
            >
              <div class="w-full">
                <div class="text-[0.5rem] font-bold text-white font-['Orbitron'] leading-none tracking-tighter">
                  #{{ block.blockNumber }}
                </div>
              </div>

              <div class="flex-1 flex items-center justify-center">
                <div class="text-slate-500 text-[0.6rem] font-medium text-center">
                  B{{ block.batch }}
                </div>
              </div>

              <div class="w-full">
                <div class="text-[0.5rem] text-slate-500">
                  E{{ block.epoch }}
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes orange-splash {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 96, 0, 0.7);
  }
  50% {
    box-shadow: 0 0 20px 10px rgba(255, 96, 0, 0.4);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 96, 0, 0);
  }
}

.block-enter {
  animation: orange-splash 0.6s ease-out;
}
</style>

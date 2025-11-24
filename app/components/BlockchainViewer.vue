<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBlockchain } from '~/composables/useBlockchain'

const props = defineProps<{
  currentBlockHeight?: number
}>()

interface DisplayBlock {
  id: string
  blockNumber: number
  type: 'micro' | 'macro'
  validatorAddress?: string
  slot: number
  transactions: number
  votes: number
  timestamp: number
}

const { latestBlock } = useBlockchain()
const blocks = ref<DisplayBlock[]>([])
const MAX_BLOCKS = 12

// Initialize with some mock blocks
const startBlock = 35678581
for (let i = 0; i < 6; i++) {
  blocks.value.push({
    id: `init-${i}`,
    blockNumber: startBlock + i,
    type: 'micro',
    slot: 100 + i * 13,
    transactions: 0,
    votes: 0,
    timestamp: Date.now() - (6 - i) * 1000,
  })
}

function addBlock(blockNumber: number, type: 'micro' | 'macro' = 'micro', validatorAddress?: string) {
  const displayBlock: DisplayBlock = {
    id: `block-${blockNumber}-${Math.random().toString(36).slice(2, 7)}`,
    blockNumber,
    type,
    validatorAddress,
    slot: Math.floor(Math.random() * 500),
    transactions: Math.random() > 0.8 ? Math.floor(Math.random() * 50) : 0,
    votes: Math.floor(Math.random() * 512),
    timestamp: Date.now(),
  }

  blocks.value.push(displayBlock)
  if (blocks.value.length > MAX_BLOCKS) {
    blocks.value.shift()
  }
}

watch(latestBlock, (newBlock) => {
  if (!newBlock)
    return
  addBlock(newBlock.blockNumber, newBlock.type, newBlock.validatorAddress)
})

// Watch for simulated block height changes (fallback)
watch(() => props.currentBlockHeight, (newHeight) => {
  if (newHeight && !latestBlock.value) {
    const type = newHeight % 10 === 0 ? 'macro' : 'micro'
    if (blocks.value.length === 0 || blocks.value[blocks.value.length - 1]?.blockNumber !== newHeight) {
      addBlock(newHeight, type)
    }
  }
})
</script>

<template>
  <div class="w-full overflow-hidden py-4">
    <Presence class="flex items-center justify-end gap-2 px-8 min-w-full h-32">
      <Motion
        v-for="(block, index) in blocks"
        :key="block.id"
        :initial="{ opacity: 0, x: 100, scale: 0.8 }"
        :animate="{ opacity: 1, x: 0, scale: 1 }"
        :exit="{ opacity: 0, x: -100, scale: 0.8 }"
        :transition="{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          mass: 1,
        }"
        layout
        class="relative flex items-center shrink-0"
      >
        <!-- Arrow connecting blocks -->
        <div v-if="index > 0" class="text-slate-600 mr-2 opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
        </div>

        <!-- Macro Block Card (Smaller) -->
        <div
          v-if="block.type === 'macro'"
          class="relative w-24 h-32 bg-[#0582CA] rounded-lg p-2 flex flex-col items-center justify-between shadow-[0_0_15px_rgba(5,130,202,0.4)] border border-blue-400/50 z-10"
        >
          <div class="text-center w-full">
            <div class="text-[0.5rem] font-bold text-white/90 uppercase tracking-wider mb-0.5">
              MACRO
            </div>
            <div class="text-[0.55rem] font-bold text-white font-['Orbitron'] leading-none tracking-tighter">
              M{{ block.blockNumber.toString().slice(-4) }}
            </div>
          </div>

          <div class="flex-1 flex items-center justify-center">
            <div class="w-8 h-8 rounded-full border border-white/80 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </div>

          <div class="text-center w-full">
            <div class="text-[0.6rem] font-bold text-white font-['Rajdhani']">
              {{ block.votes }} / 512
            </div>
          </div>
        </div>

        <!-- Micro Block Card (Smaller) -->
        <div
          v-else
          class="relative w-24 h-32 bg-[#0f172a]/90 backdrop-blur-sm rounded-lg p-2 flex flex-col justify-between border border-slate-700 hover:border-slate-500 transition-colors z-10"
        >
          <div class="w-full">
            <div class="text-[0.5rem] font-bold text-white font-['Orbitron'] leading-none tracking-tighter">
              #{{ block.blockNumber }}
            </div>
          </div>

          <div class="flex-1 flex items-center justify-center">
            <div v-if="block.transactions === 0" class="text-slate-500 text-[0.6rem] font-medium text-center">
              Empty
            </div>
            <div v-else class="flex flex-col items-center">
              <span class="text-lg font-bold text-white font-['Rajdhani'] leading-tight">{{ block.transactions }}</span>
              <span class="text-[0.5rem] text-slate-400 uppercase tracking-wide">TXs</span>
            </div>
          </div>

          <div class="w-full">
            <div class="text-[0.55rem] text-slate-500 font-mono">
              Slot {{ block.slot }}
            </div>
            <div class="flex gap-0.5 mt-1 opacity-30">
              <div v-for="n in 3" :key="n" class="w-0.5 h-0.5 rounded-full bg-slate-400" />
            </div>
          </div>
        </div>
      </Motion>
    </Presence>

    <!-- Decorative Dots -->
    <div class="mt-2 px-8 flex items-center justify-end gap-1.5 opacity-10">
      <div v-for="n in 30" :key="n" class="w-1 h-1 rounded-sm" :class="n % 6 === 0 ? 'bg-blue-500 w-2 h-2 -my-0.5' : 'bg-slate-500'" />
    </div>
  </div>
</template>

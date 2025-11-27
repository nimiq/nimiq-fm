<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'
import { onKeyStroke } from '@vueuse/core'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

onKeyStroke('Escape', () => emit('close'))

const callouts = [
  {
    id: 'music',
    title: 'MUSIC GENERATION',
    lines: ['Every new block adds melodies, rhythms, and textures on top of the base track.', "The block producer's signature shapes the sound, so the music shifts live with the chain."],
    position: 'top-[22%] left-[12%]',
    from: { x: -80, y: -40 },
  },
  {
    id: 'orb',
    title: 'NETWORK ORB',
    lines: ['Live map of the Nimiq network.', 'Soft white lights are peers joining and leaving; vivid cores are block producers anchoring the mesh.', 'Lines show their connections as the network rewires.'],
    position: 'top-[42%] left-[12%]',
    from: { x: -80, y: 0 },
  },
  {
    id: 'propagation',
    title: 'BLOCK PROPAGATION',
    lines: ['When a new block is built, its creator flashes and launches an orange wave.', 'The beam travels along connections to show the block spreading through the network in real time.'],
    position: 'top-[30%] right-[12%]',
    from: { x: 80, y: -40 },
  },
  {
    id: 'player',
    title: 'TIMELINE & PLAYER',
    lines: ['Blocks stream into the grid; three batches make up one song before the next begins.', 'Hit play to unmute; "Now playing" and "Up next" mirror the live chain while block creators glow when they land a block.'],
    position: 'bottom-[22%] left-1/2 -translate-x-1/2',
    from: { x: 0, y: 80 },
  },
]
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <Motion
        v-if="show"
        class="fixed inset-0 z-50"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.3 }"
      >
        <!-- Backdrop (clickable to close) -->
        <div class="absolute inset-0" @click="emit('close')" />

        <!-- Close hint -->
        <Motion
          class="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm cursor-pointer hover:bg-white/15 transition-colors z-10"
          :initial="{ opacity: 0, y: -10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: 0.3, duration: 0.4, easing: [0.16, 1, 0.3, 1] }"
          @click="emit('close')"
        >
          Click anywhere to close
        </Motion>

        <!-- Callout boxes -->
        <Motion
          v-for="(callout, index) in callouts"
          :key="callout.id"
          class="absolute max-w-xs p-4 rounded-lg callout-box"
          :class="callout.position"
          :initial="{ opacity: 0, x: callout.from.x, y: callout.from.y, scale: 0.85 }"
          :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
          :exit="{ opacity: 0, x: callout.from.x * 0.5, y: callout.from.y * 0.5, scale: 0.9 }"
          :transition="{ duration: 0.5, delay: 0.05 + index * 0.07, easing: [0.16, 1, 0.3, 1] }"
        >
          <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">{{ callout.title }}</h3>
          <p v-for="(line, i) in callout.lines" :key="i" class="text-sm text-white/80 leading-relaxed" :class="{ 'mt-2': i > 0 }">
            {{ line }}
          </p>
        </Motion>


      </Motion>
    </AnimatePresence>
  </Teleport>
</template>

<style scoped>
.callout-box {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.75) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
</style>

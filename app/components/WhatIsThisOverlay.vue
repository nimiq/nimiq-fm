<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'
import { onKeyStroke } from '@vueuse/core'

const show = defineModel<boolean>({ required: true })

onKeyStroke('Escape', () => show.value = false)

const breakpoints = useBreakpoints({ sm: 640 })
const isMobile = breakpoints.smaller('sm')

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
        <div class="absolute inset-0" @click="show = false" />

        <!-- Close hint -->
        <Motion
          class="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm cursor-pointer hover:bg-white/15 transition-colors z-10"
          :initial="{ opacity: 0, y: -10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: 0.3, duration: 0.4, easing: [0.16, 1, 0.3, 1] }"
          @click="show = false"
        >
          <span class="hidden sm:inline">Click anywhere to close</span>
          <span class="sm:hidden">Tap to close</span>
        </Motion>

        <!-- MOBILE: Horizontal snap carousel -->
        <template v-if="isMobile">
          <Motion
            class="absolute inset-x-0 bottom-0 top-16"
            :initial="{ opacity: 0, y: 40 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, easing: [0.16, 1, 0.3, 1] }"
          >
            <div class="h-full flex flex-col">
              <!-- Swipe hint -->
              <p class="text-center text-white/50 text-xs mb-3">Swipe to explore</p>

              <!-- Carousel container -->
              <div class="flex-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 flex gap-4">
                <!-- Music Generation card -->
                <div class="snap-center shrink-0 w-[85vw] max-w-sm p-4 rounded-lg callout-box self-center">
                  <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">MUSIC GENERATION</h3>
                  <p class="text-sm text-white/80 leading-relaxed">Every new block adds melodies, rhythms, and textures on top of the base track.</p>
                  <p class="text-sm text-white/80 leading-relaxed mt-2">The block producer's signature shapes the sound, so the music shifts live with the chain.</p>
                  <div class="mt-3 pt-3 border-t border-white/10">
                    <ClientOnly>
                      <LatestProducerDemo />
                    </ClientOnly>
                  </div>
                </div>

                <!-- Network Orb card -->
                <div class="snap-center shrink-0 w-[85vw] max-w-sm p-4 rounded-lg callout-box self-center">
                  <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">NETWORK ORB</h3>
                  <p class="text-sm text-white/80 leading-relaxed">Live map of the Nimiq network.</p>
                  <p class="text-sm text-white/80 leading-relaxed mt-2">Soft white lights are peers joining and leaving; vivid cores are block producers anchoring the mesh.</p>
                  <p class="text-sm text-white/80 leading-relaxed mt-2">Lines show their connections as the network rewires.</p>
                </div>

                <!-- Block Propagation card -->
                <div class="snap-center shrink-0 w-[85vw] max-w-sm p-4 rounded-lg callout-box self-center">
                  <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">BLOCK PROPAGATION</h3>
                  <p class="text-sm text-white/80 leading-relaxed">When a new block is built, its creator flashes and launches an orange wave.</p>
                  <p class="text-sm text-white/80 leading-relaxed mt-2">The beam travels along connections to show the block spreading through the network in real time.</p>
                </div>

                <!-- Timeline & Player card -->
                <div class="snap-center shrink-0 w-[85vw] max-w-sm p-4 rounded-lg callout-box self-center">
                  <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">TIMELINE & PLAYER</h3>
                  <p class="text-sm text-white/80 leading-relaxed">Blocks stream into the grid; three batches make up one song before the next begins.</p>
                  <p class="text-sm text-white/80 leading-relaxed mt-2">Hit play to unmute; "Now playing" and "Up next" mirror the live chain while block creators glow when they land a block.</p>
                </div>

                <!-- Spacer for last card centering -->
                <div class="snap-center shrink-0 w-[7.5vw]" />
              </div>

              <!-- Dot indicators -->
              <div class="flex justify-center gap-2 py-4">
                <div v-for="i in 4" :key="i" class="size-2 rounded-full bg-white/30" />
              </div>
            </div>
          </Motion>
        </template>

        <!-- DESKTOP: Positioned callout boxes -->
        <template v-else>
          <!-- Callout boxes (except orb and music which have custom layouts) -->
          <Motion
            v-for="(callout, index) in callouts.filter(c => c.id !== 'orb' && c.id !== 'music')"
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

          <!-- Music Generation callout with live producer demo -->
          <Motion
            class="absolute top-[22%] left-[12%] max-w-xs p-4 rounded-lg callout-box"
            :initial="{ opacity: 0, x: -80, y: -40, scale: 0.85 }"
            :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
            :exit="{ opacity: 0, x: -40, y: -20, scale: 0.9 }"
            :transition="{ duration: 0.5, delay: 0.05, easing: [0.16, 1, 0.3, 1] }"
          >
            <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">MUSIC GENERATION</h3>
            <p class="text-sm text-white/80 leading-relaxed">Every new block adds melodies, rhythms, and textures on top of the base track.</p>
            <p class="text-sm text-white/80 leading-relaxed mt-2">The block producer's signature shapes the sound, so the music shifts live with the chain.</p>
            <div class="mt-3 pt-3 border-t border-white/10">
              <ClientOnly>
                <LatestProducerDemo />
              </ClientOnly>
            </div>
          </Motion>

          <!-- Network Orb callout with visual elements -->
          <Motion
            class="absolute top-[50%] left-[12%] max-w-md p-4 rounded-lg callout-box"
            :initial="{ opacity: 0, x: -80, y: 0, scale: 0.85 }"
            :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
            :exit="{ opacity: 0, x: -40, y: 0, scale: 0.9 }"
            :transition="{ duration: 0.5, delay: 0.12, easing: [0.16, 1, 0.3, 1] }"
          >
            <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">NETWORK ORB</h3>
            <div class="text-sm text-white/80 leading-relaxed">
              <!-- Mini demo floated right with arc shape -->
              <div class="float-right ml-3 mb-2 relative" style="width: 130px; height: 110px; shape-outside: ellipse(70% 55% at 70% 50%);">
                <ClientOnly>
                  <MiniOrbDemo class="absolute inset-0" />
                </ClientOnly>
              </div>
              <p>Live map of the Nimiq network.</p>
              <p class="mt-2">Soft white lights are peers joining and leaving; vivid cores are block producers anchoring the mesh.</p>
              <p class="mt-2">Lines show their connections as the network rewires.</p>
            </div>
          </Motion>
        </template>
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

.floating-slow {
  animation: float-slow 3s ease-in-out infinite;
}

.floating-fast {
  animation: float-fast 2.5s ease-in-out infinite;
  animation-delay: -1s;
}

@keyframes float-slow {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-3px, -4px); }
}

@keyframes float-fast {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(4px, -3px); }
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>

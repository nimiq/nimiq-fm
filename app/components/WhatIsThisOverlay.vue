<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'
import { onKeyStroke } from '@vueuse/core'

const show = defineModel<boolean>({ required: true })

onKeyStroke('Escape', () => show.value = false)

const breakpoints = useBreakpoints({ stories: 1000, md: 1100, lg: 1500 })
const isStories = breakpoints.smaller('stories')
const isMedium = breakpoints.between('md', 'lg')

// Shared content for both stories and callouts
const stories = [
  { id: 'music', title: 'Hear the Blockchain', lines: ['Every new block adds melodies, rhythms, and textures on top of the base track.', "The block producer's signature shapes the sound, so the music shifts live with the chain."], hasDemo: 'producer' },
  { id: 'orb', title: 'The Network Breathes', lines: ['Live map of the Nimiq network.', 'Soft white lights are peers joining and leaving; vivid cores are block producers anchoring the mesh.', 'Lines show their connections as the network rewires.'], hasDemo: 'orb' },
  { id: 'propagation', title: 'The Orange Wave', lines: ['When a new block is built, its creator flashes and launches an orange wave.', 'The beam travels along connections to show the block spreading through the network in real time.'] },
  { id: 'player', title: 'The Rhythm of Blocks', lines: ['Blocks stream into the grid; three batches make up one song before the next begins.', 'Hit play to unmute; "Now playing" and "Up next" mirror the live chain while block creators glow when they land a block.'] },
]

// Stories state
const currentStory = ref(0)
const progress = ref(0)
const isPaused = ref(false)
const direction = ref(1) // 1 = forward, -1 = backward
const exitX = ref(-50) // exit direction set BEFORE transition
const STORY_DURATION = 5000
const activeStory = computed(() => stories[currentStory.value]!)

// Auto-advance timer
let animationFrame: number | null = null
let lastTime = 0

function startTimer() {
  lastTime = performance.now()
  const tick = (now: number) => {
    if (!show.value || !isStories.value) return
    if (!isPaused.value) {
      const delta = now - lastTime
      progress.value += (delta / STORY_DURATION) * 100
      if (progress.value >= 100) {
        if (currentStory.value < stories.length - 1) {
          exitX.value = -50
          direction.value = 1
          currentStory.value++
          progress.value = 0
        } else {
          show.value = false
          return
        }
      }
    }
    lastTime = now
    animationFrame = requestAnimationFrame(tick)
  }
  animationFrame = requestAnimationFrame(tick)
}

function stopTimer() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

// Navigation
async function goNext() {
  if (currentStory.value < stories.length - 1) {
    exitX.value = -50 // old exits left
    direction.value = 1
    await nextTick()
    currentStory.value++
    progress.value = 0
  } else {
    show.value = false
  }
}

async function goPrev() {
  if (currentStory.value === 0) {
    progress.value = 0
  } else {
    exitX.value = 50 // old exits right
    direction.value = -1
    await nextTick()
    currentStory.value--
    progress.value = 0
  }
}

function handleTap(e: MouseEvent | TouchEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const clientX = 'changedTouches' in e ? e.changedTouches[0]?.clientX ?? 0 : e.clientX
  const x = clientX - rect.left
  if (x < rect.width / 3) goPrev()
  else goNext()
}

// Long press to pause
let pressTimer: ReturnType<typeof setTimeout> | null = null

function handlePointerDown() {
  pressTimer = setTimeout(() => { isPaused.value = true }, 150)
}

function handlePointerUp() {
  if (pressTimer) clearTimeout(pressTimer)
  isPaused.value = false
}

// Drag down to close
const dragY = ref(0)
const isDragging = ref(false)
let startY = 0

function handleTouchStart(e: TouchEvent) {
  startY = e.touches[0]?.clientY ?? 0
  isDragging.value = true
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  const deltaY = (e.touches[0]?.clientY ?? 0) - startY
  dragY.value = Math.max(0, deltaY)
  if (dragY.value > 50) isPaused.value = true
}

function handleTouchEnd() {
  if (dragY.value > 120) {
    show.value = false
  }
  dragY.value = 0
  isDragging.value = false
  isPaused.value = false
}

// Lifecycle
watch(show, (val) => {
  if (val && isStories.value) {
    currentStory.value = 0
    progress.value = 0
    startTimer()
  } else {
    stopTimer()
  }
})

watch(isStories, (val) => {
  if (val && show.value) startTimer()
  else stopTimer()
})

onUnmounted(() => stopTimer())
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
        <!-- STORIES MODE (< 1000px) - Fullscreen -->
        <template v-if="isStories">
          <div
            class="absolute inset-0 story-glass"
            :style="{ transform: `translateY(${dragY}px)`, opacity: 1 - dragY / 300 }"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @pointerdown="handlePointerDown"
            @pointerup="handlePointerUp"
            @pointerleave="handlePointerUp"
            @click="handleTap"
          >
            <!-- Progress bars -->
            <div class="absolute top-0 inset-x-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex gap-1.5 z-20">
              <div v-for="(_, i) in stories" :key="i" class="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  class="h-full bg-white rounded-full transition-all"
                  :style="{ width: i < currentStory ? '100%' : i === currentStory ? `${progress}%` : '0%' }"
                  :class="{ 'duration-0': i === currentStory, 'duration-200': i !== currentStory }"
                />
              </div>
            </div>

            <!-- Close button -->
            <button
              class="absolute top-[max(2rem,calc(env(safe-area-inset-top)+0.5rem))] right-3 z-20 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              @click.stop="show = false"
            >
              <UIcon name="i-heroicons-x-mark" class="size-5 text-white" />
            </button>

            <!-- Content -->
            <div class="absolute inset-0 flex flex-col justify-center p-6">
              <AnimatePresence mode="wait">
                <Motion
                  :key="currentStory"
                  :initial="{ opacity: 0, x: 50 * direction }"
                  :animate="{ opacity: 1, x: 0 }"
                  :exit="{ opacity: 0, x: exitX }"
                  :transition="{ duration: 0.25 }"
                  class="space-y-4"
                >
                  <h3 class="font-bold text-xl text-sky-400">{{ activeStory.title }}</h3>
                  <div class="space-y-3">
                    <p v-for="(line, i) in activeStory.lines" :key="i" class="text-white/90 leading-relaxed">
                      {{ line }}
                    </p>
                  </div>

                  <!-- Demo components -->
                  <div v-if="activeStory.hasDemo === 'producer'" class="pt-4 border-t border-white/10">
                    <ClientOnly>
                      <LatestProducerDemo />
                    </ClientOnly>
                  </div>
                  <div v-if="activeStory.hasDemo === 'orb'" class="pt-4 flex justify-center">
                    <ClientOnly>
                      <MiniOrbDemo class="w-40 h-32" />
                    </ClientOnly>
                  </div>
                </Motion>
              </AnimatePresence>
            </div>

          </div>
        </template>

        <!-- DESKTOP: Floating callouts (>= 1000px) -->
        <template v-else>
          <!-- Backdrop -->
          <div class="absolute inset-0" @click="show = false" />

          <!-- Close hint -->
          <Motion
            class="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm cursor-pointer hover:bg-white/15 transition-colors z-10"
            :initial="{ opacity: 0, y: -10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }"
            @click="show = false"
          >
            Click anywhere to close
          </Motion>

          <!-- The Orange Wave callout -->
          <Motion
            class="absolute top-[28%] right-[6%] max-w-xs p-4 rounded-lg callout-box"
            :initial="{ opacity: 0, x: 80, y: -40, scale: 0.85 }"
            :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
            :exit="{ opacity: 0, x: 40, y: -20, scale: 0.9 }"
            :transition="{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }"
          >
            <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">The Orange Wave</h3>
            <p class="text-sm text-white/80 leading-relaxed">When a new block is built, its creator flashes and launches an orange wave.</p>
            <p class="text-sm text-white/80 leading-relaxed mt-2">The beam travels along connections to show the block spreading through the network in real time.</p>
          </Motion>

          <!-- Hear the Blockchain callout with live producer demo -->
          <Motion
            class="absolute top-[20%] left-[6%] max-w-xs p-4 rounded-lg callout-box"
            :initial="{ opacity: 0, x: -80, y: -40, scale: 0.85 }"
            :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
            :exit="{ opacity: 0, x: -40, y: -20, scale: 0.9 }"
            :transition="{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }"
          >
            <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">Hear the Blockchain</h3>
            <p class="text-sm text-white/80 leading-relaxed">Every new block adds melodies, rhythms, and textures on top of the base track.</p>
            <p class="text-sm text-white/80 leading-relaxed mt-2">The block producer's signature shapes the sound, so the music shifts live with the chain.</p>
            <div class="mt-3 pt-3 border-t border-white/10">
              <ClientOnly>
                <LatestProducerDemo />
              </ClientOnly>
            </div>
          </Motion>

          <!-- The Network Breathes callout with visual elements -->
          <Motion
            class="absolute top-[46%] left-[6%] max-w-md p-4 rounded-lg callout-box"
            :initial="{ opacity: 0, x: -80, y: 0, scale: 0.85 }"
            :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
            :exit="{ opacity: 0, x: -40, y: 0, scale: 0.9 }"
            :transition="{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }"
          >
            <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">The Network Breathes</h3>
            <div class="text-sm text-white/80 leading-relaxed">
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

          <!-- The Rhythm of Blocks callout -->
          <Motion
            class="absolute max-w-xs p-4 rounded-lg callout-box"
            :class="isMedium ? 'bottom-[28%] right-[6%]' : 'bottom-[calc(18%+100px)] left-[calc(50%+128px)] -translate-x-1/2'"
            :initial="{ opacity: 0, x: 80, y: isMedium ? 0 : -40, scale: 0.85 }"
            :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
            :exit="{ opacity: 0, x: 40, y: isMedium ? 0 : -20, scale: 0.9 }"
            :transition="{ duration: 0.5, delay: 0.19, ease: [0.16, 1, 0.3, 1] }"
          >
            <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">The Rhythm of Blocks</h3>
            <p class="text-sm text-white/80 leading-relaxed">Blocks stream into the grid; three batches make up one song before the next begins.</p>
            <p class="text-sm text-white/80 leading-relaxed mt-2">Hit play to unmute; "Now playing" and "Up next" mirror the live chain while block creators glow when they land a block.</p>
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

.story-glass {
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 15, 30, 0.75) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
</style>

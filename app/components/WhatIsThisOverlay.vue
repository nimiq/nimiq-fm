<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { AnimatePresence, Motion } from 'motion-v'

const show = defineModel<boolean>({ required: true })

onKeyStroke('Escape', () => show.value = false)

const breakpoints = useBreakpoints({ stories: 1000 })
const isStoriesWidth = breakpoints.smaller('stories')

// Also use stories mode for wide but short screens (like Nest Hub 1024x600)
const windowSize = useWindowSize()
const isShortScreen = computed(() => windowSize.height.value < 700 && windowSize.width.value / windowSize.height.value > 1.5)
const isStories = computed(() => isStoriesWidth.value || isShortScreen.value)

// Shared content for both stories and callouts
const stories = [
  { id: 'music', title: 'The blockchain conducts the music', lines: ['Melodies and rhythms are generated live by block data.', 'When a validator mines a block, their unique signature shapes the sound, creating an endless, evolving soundtrack.'], hasDemo: 'producer' },
  { id: 'player', title: 'You control the stream', lines: ['Blocks arrive in batches to form songs.', 'Switch channels to change the vibe, or sit back and let the blockchain DJ the playlist for you.']},
  { id: 'propagation', title: 'Lightning-fast consensus', lines: ['See that orange flash? That\'s a new block born.', 'It ripples across the globe instantly, turning the whole network into a synchronized wave of consensus.'], hasDemo: 'propagation' },
  { id: 'orb', title: 'A living map of the network', lines: ['Soft lights represent real people connected to Nimiq. Brighter cores are validators securing the chain.', 'Watch as the mesh rewires itself in real time.'], hasDemo: 'orb' },
  { id: 'tech', title: 'Built with open source magic', lines: ['Powered by Strudel for generative audio and TresJS for 3D visuals.', 'A tribute to the creative coding community and the browser-first spirit.'], hasTech: true },
  { id: 'community', title: 'Crypto that just works', lines: ['Nimiq is the only blockchain that runs entirely in your browser.', 'No downloads, no sync times—just instant, secure, and censorship-resistant money.'], hasSocials: true },
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
    if (!show.value || !isStories.value)
      return
    if (!isPaused.value) {
      const delta = now - lastTime
      progress.value += (delta / STORY_DURATION) * 100
      if (progress.value >= 100) {
        if (currentStory.value < stories.length - 1) {
          exitX.value = -50
          direction.value = 1
          currentStory.value++
          progress.value = 0
        }
        else {
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
  }
  else {
    show.value = false
  }
}

async function goPrev() {
  if (currentStory.value === 0) {
    progress.value = 0
  }
  else {
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
  if (x < rect.width / 3)
    goPrev()
  else goNext()
}

// Long press to pause
let pressTimer: ReturnType<typeof setTimeout> | null = null

function handlePointerDown() {
  pressTimer = setTimeout(() => isPaused.value = true, 150)
}

function handlePointerUp() {
  if (pressTimer)
    clearTimeout(pressTimer)
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
  if (!isDragging.value)
    return
  const deltaY = (e.touches[0]?.clientY ?? 0) - startY
  dragY.value = Math.max(0, deltaY)
  if (dragY.value > 50)
    isPaused.value = true
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
  }
  else {
    stopTimer()
  }
})

watch(isStories, (val) => {
  if (val && show.value)
    startTimer()
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
                  class="space-y-4 relative"
                >
                  <!-- Orb demo on top -->
                  <div v-if="activeStory.hasDemo === 'orb'" class="flex justify-center">
                    <ClientOnly>
                      <MiniOrbDemo class="w-40 h-32" />
                    </ClientOnly>
                  </div>

                  <!-- Propagation demo on top -->
                  <div v-if="activeStory.hasDemo === 'propagation'" class="flex justify-center h-40 -my-4">
                    <ClientOnly>
                      <PropagationDemo />
                    </ClientOnly>
                  </div>

                  <h3 class="font-bold text-xl text-sky-400">
                    {{ activeStory.title }}
                  </h3>
                  <div class="space-y-3">
                    <p v-for="(line, i) in activeStory.lines" :key="i" class="text-white/90 leading-relaxed">
                      {{ line }}
                    </p>
                  </div>

                  <!-- Producer demo -->
                  <div v-if="activeStory.hasDemo === 'producer'" class="pt-4 border-t border-white/10">
                    <ClientOnly>
                      <LatestProducerDemo />
                    </ClientOnly>
                  </div>

                  <!-- Tech Credits section -->
                  <div v-if="activeStory.hasTech" class="pt-4 border-t border-white/10 space-y-4">
                    <div class="flex flex-wrap gap-2">
                      <a href="https://strudel.cc" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                        <svg class="size-3.5 fill-white/60 group-hover:fill-[#9333ea] transition-colors" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                        <span class="text-white/70 text-sm group-hover:text-white transition-colors">Strudel</span>
                      </a>
                      <a href="https://tresjs.org" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                        <svg class="size-3.5 fill-white/60 group-hover:fill-[#82DBC5] transition-colors" viewBox="0 0 24 24"><path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.18l8.25 4.72v9.2L12 20.82l-8.25-4.72v-9.2L12 2.18z" /><path d="M12 5.5L6 9v6l6 3.5 6-3.5V9l-6-3.5z" /></svg>
                        <span class="text-white/70 text-sm group-hover:text-white transition-colors">TresJS</span>
                      </a>
                      <a href="https://nuxt.com" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                        <svg class="size-3.5" viewBox="0 0 512 512"><path class="fill-white/60 group-hover:fill-[#00DC82] transition-colors" d="M281.44 397.667h156.88c5.006 0 9.798-1.759 14.133-4.24 4.336-2.481 8.805-5.596 11.307-9.894 2.502-4.297 4.242-9.173 4.24-14.134s-1.734-9.836-4.24-14.131l-106-182.321c-2.502-4.297-5.559-7.413-9.893-9.894s-10.542-4.24-15.547-4.24-9.799 1.76-14.133 4.24c-4.335 2.481-7.392 5.597-9.894 9.894l-26.853 46.64-53.707-90.457c-2.504-4.296-5.557-8.823-9.893-11.303S208.713 115 203.707 115s-9.798.346-14.134 2.827c-4.335 2.48-8.802 7.007-11.306 11.303L46.827 355.268c-2.506 4.295-2.825 9.169-2.827 14.131s.325 9.836 2.827 14.134c2.502 4.297 6.97 7.413 11.306 9.894s9.127 4.24 14.134 4.24H171.2c39.201 0 67.734-17.585 87.627-50.88L306.88 263.4l25.44-43.813 77.733 132.853H306.88zM169.787 352.44h-69.254l103.174-178.08L256 263.4l-34.639 60.384c-13.21 21.603-28.272 28.656-51.574 28.656" /></svg>
                        <span class="text-white/70 text-sm group-hover:text-white transition-colors">Nuxt</span>
                      </a>
                      <a href="https://www.youtube.com/@SwitchAngel" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                        <svg class="size-3.5 fill-white/60 group-hover:fill-[#FF0000] transition-colors" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        <span class="text-white/70 text-sm group-hover:text-white transition-colors">Switch Angel</span>
                      </a>
                    </div>
                  </div>

                  <!-- Community/Socials section -->
                  <div v-if="activeStory.hasSocials" class="pt-4 border-t border-white/10 space-y-4">
                    <div class="flex flex-wrap gap-2 justify-center">
                      <a href="https://nimiq.com" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 18"><path class="fill-white/60 group-hover:fill-[#F6AE2D] transition-colors" d="M19.734 8.156 15.576.844A1.66 1.66 0 0014.135 0H5.819C5.226 0 4.677.32 4.38.844L.222 8.156a1.71 1.71 0 000 1.688l4.158 7.312c.297.523.846.844 1.439.844h8.316c.593 0 1.142-.32 1.438-.844l4.158-7.312c.3-.523.3-1.165.003-1.688" /></svg>
                        <span class="text-white/70 text-sm group-hover:text-white transition-colors">Nimiq</span>
                      </a>
                      <a href="https://github.com/nimiq/nimiq-fm" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="GitHub">
                        <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                      </a>
                      <a href="https://x.com/nimiq" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="X">
                        <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </a>
                      <a href="https://discord.gg/nimiq" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="Discord">
                        <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" /></svg>
                      </a>
                      <a href="https://t.me/nimiq" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="Telegram">
                        <svg class="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                      </a>
                    </div>
                  </div>
                </Motion>
              </AnimatePresence>
            </div>
          </div>
        </template>

        <!-- DESKTOP: Grid-based callouts (>= 1000px) -->
        <template v-else>
          <!-- Backdrop -->
          <div class="absolute inset-0" @click="show = false" />

          <!-- Grid container - 40x40 for fine-grained placement -->
          <div class="absolute inset-0 callout-grid pointer-events-none">
            <!-- Close hint - spans top center -->
            <Motion
              class="callout-close pointer-events-auto px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm cursor-pointer hover:bg-white/15 transition-colors"
              :initial="{ opacity: 0, y: -10 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }"
              @click="show = false"
            >
              Click anywhere to close
            </Motion>

            <!-- Hear the Blockchain - top left area -->
            <Motion
              class="callout-music pointer-events-auto p-4 rounded-lg callout-box"
              :initial="{ opacity: 0, x: -40, scale: 0.9 }"
              :animate="{ opacity: 1, x: 0, scale: 1 }"
              :exit="{ opacity: 0, x: -20, scale: 0.95 }"
              :transition="{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }"
            >
              <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">
                {{ stories[0].title }}
              </h3>
              <p class="text-sm text-white/80 leading-relaxed">
                {{ stories[0].lines[0] }}
              </p>
              <p class="text-sm text-white/80 leading-relaxed mt-2">
                {{ stories[0].lines[1] }}
              </p>
              <div class="mt-3 pt-3 border-t border-white/10">
                <ClientOnly>
                  <LatestProducerDemo />
                </ClientOnly>
              </div>
            </Motion>

            <!-- The Orange Wave - top right area -->
            <Motion
              class="callout-wave pointer-events-auto p-4 rounded-lg callout-box relative overflow-visible"
              :initial="{ opacity: 0, x: 40, scale: 0.9 }"
              :animate="{ opacity: 1, x: 0, scale: 1 }"
              :exit="{ opacity: 0, x: 20, scale: 0.95 }"
              :transition="{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }"
            >
              <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">
                {{ stories[2].title }}
              </h3>
              <p class="text-sm text-white/80 leading-relaxed">
                {{ stories[2].lines[0] }}
              </p>
              <p class="text-sm text-white/80 leading-relaxed mt-2">
                {{ stories[2].lines[1] }}
              </p>
              <div class="mt-3 pt-3 border-t border-white/10 h-24">
                <ClientOnly>
                  <PropagationDemo />
                </ClientOnly>
              </div>
            </Motion>

            <!-- The Network Breathes - left side -->
            <Motion
              class="callout-orb pointer-events-auto p-4 rounded-lg callout-box"
              :initial="{ opacity: 0, x: -40, scale: 0.9 }"
              :animate="{ opacity: 1, x: 0, scale: 1 }"
              :exit="{ opacity: 0, x: -20, scale: 0.95 }"
              :transition="{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }"
            >
              <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">
                {{ stories[1].title }}
              </h3>
              <div class="text-sm text-white/80 leading-relaxed">
                <div class="float-right ml-3 mb-2 relative" style="width: 130px; height: 110px; shape-outside: ellipse(70% 55% at 70% 50%);">
                  <ClientOnly>
                    <MiniOrbDemo class="absolute inset-0" />
                  </ClientOnly>
                </div>
                <p>
                  {{ stories[1].lines[0] }}
                </p>
                <p class="mt-2">
                  {{ stories[1].lines[1] }}
                </p>
              </div>
            </Motion>

            <!-- The Rhythm of Blocks - center bottom -->
            <Motion
              class="callout-rhythm pointer-events-auto p-4 rounded-lg callout-box"
              :initial="{ opacity: 0, y: 40, scale: 0.9 }"
              :animate="{ opacity: 1, y: 0, scale: 1 }"
              :exit="{ opacity: 0, y: 20, scale: 0.95 }"
              :transition="{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }"
            >
              <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">
                {{ stories[3].title }}
              </h3>
              <p class="text-sm text-white/80 leading-relaxed">
                {{ stories[3].lines[0] }}
              </p>
              <p class="text-sm text-white/80 leading-relaxed mt-2">
                {{ stories[3].lines[1] }}
              </p>
            </Motion>

            <!-- Credits & Links - bottom right -->
            <Motion
              class="callout-credits pointer-events-auto p-4 rounded-lg callout-box"
              :initial="{ opacity: 0, x: 40, y: 20, scale: 0.9 }"
              :animate="{ opacity: 1, x: 0, y: 0, scale: 1 }"
              :exit="{ opacity: 0, x: 20, y: 10, scale: 0.95 }"
              :transition="{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }"
            >
              <h3 class="font-bold text-sm text-sky-400 mb-2 tracking-wide">
                Credits & Links
              </h3>
              <p class="text-sm text-white/80 leading-relaxed">
                Built with open source tech like Strudel, TresJS & Nuxt. Nimiq is the browser-first blockchain designed for everyone.
              </p>
              <div class="mt-3 pt-3 border-t border-white/10">
                <div class="flex flex-wrap gap-2">
                  <a href="https://nimiq.com" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                    <svg class="size-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 18"><path class="fill-white/60 group-hover:fill-[#F6AE2D] transition-colors" d="M19.734 8.156 15.576.844A1.66 1.66 0 0014.135 0H5.819C5.226 0 4.677.32 4.38.844L.222 8.156a1.71 1.71 0 000 1.688l4.158 7.312c.297.523.846.844 1.439.844h8.316c.593 0 1.142-.32 1.438-.844l4.158-7.312c.3-.523.3-1.165.003-1.688" /></svg>
                    <span class="text-white/70 text-xs group-hover:text-white transition-colors">Nimiq</span>
                  </a>
                  <a href="https://strudel.cc" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                    <svg class="size-3 fill-white/60 group-hover:fill-[#9333ea] transition-colors" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    <span class="text-white/70 text-xs group-hover:text-white transition-colors">Strudel</span>
                  </a>
                  <a href="https://tresjs.org" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                    <svg class="size-3 fill-white/60 group-hover:fill-[#82DBC5] transition-colors" viewBox="0 0 24 24"><path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.18l8.25 4.72v9.2L12 20.82l-8.25-4.72v-9.2L12 2.18z" /><path d="M12 5.5L6 9v6l6 3.5 6-3.5V9l-6-3.5z" /></svg>
                    <span class="text-white/70 text-xs group-hover:text-white transition-colors">TresJS</span>
                  </a>
                  <a href="https://nuxt.com" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                    <svg class="size-3" viewBox="0 0 512 512"><path class="fill-white/60 group-hover:fill-[#00DC82] transition-colors" d="M281.44 397.667h156.88c5.006 0 9.798-1.759 14.133-4.24 4.336-2.481 8.805-5.596 11.307-9.894 2.502-4.297 4.242-9.173 4.24-14.134s-1.734-9.836-4.24-14.131l-106-182.321c-2.502-4.297-5.559-7.413-9.893-9.894s-10.542-4.24-15.547-4.24-9.799 1.76-14.133 4.24c-4.335 2.481-7.392 5.597-9.894 9.894l-26.853 46.64-53.707-90.457c-2.504-4.296-5.557-8.823-9.893-11.303S208.713 115 203.707 115s-9.798.346-14.134 2.827c-4.335 2.48-8.802 7.007-11.306 11.303L46.827 355.268c-2.506 4.295-2.825 9.169-2.827 14.131s.325 9.836 2.827 14.134c2.502 4.297 6.97 7.413 11.306 9.894s9.127 4.24 14.134 4.24H171.2c39.201 0 67.734-17.585 87.627-50.88L306.88 263.4l25.44-43.813 77.733 132.853H306.88zM169.787 352.44h-69.254l103.174-178.08L256 263.4l-34.639 60.384c-13.21 21.603-28.272 28.656-51.574 28.656" /></svg>
                    <span class="text-white/70 text-xs group-hover:text-white transition-colors">Nuxt</span>
                  </a>
                  <a href="https://www.youtube.com/@SwitchAngel" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded py-1 px-2 transition-colors group">
                    <svg class="size-3 fill-white/60 group-hover:fill-[#FF0000] transition-colors" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    <span class="text-white/70 text-xs group-hover:text-white transition-colors">Switch Angel</span>
                  </a>
                </div>
                <div class="flex gap-3 mt-3 justify-center">
                  <a href="https://github.com/nimiq/nimiq-fm" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="GitHub">
                    <svg class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                  </a>
                  <a href="https://x.com/nimiq" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="X">
                    <svg class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a href="https://discord.gg/nimiq" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="Discord">
                    <svg class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" /></svg>
                  </a>
                  <a href="https://t.me/nimiq" target="_blank" rel="noopener" class="text-white/50 hover:text-white transition-colors" aria-label="Telegram">
                    <svg class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                  </a>
                </div>
              </div>
            </Motion>
          </div>
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

/* 40x40 grid for collision-free card placement */
.callout-grid {
  display: grid;
  grid-template-columns: repeat(40, 1fr);
  grid-template-rows: repeat(40, 1fr);
  padding: 1rem;
  height: calc(100vh - 250px);
  height: calc(100dvh - 250px);
}

/* Close button - top center */
.callout-close { grid-area: 2 / 16 / 4 / 26; justify-self: center; align-self: start; z-index: 10; }

/* Hear the Blockchain - top left, closer to center */
.callout-music { grid-area: 3 / 6 / 15 / 18; align-self: start; justify-self: start; max-width: 280px; margin-top: 0.5rem; }

/* Orange Wave - top right, pulled in from edge */
.callout-wave { grid-area: 5 / 26 / 17 / 40; align-self: start; justify-self: end; max-width: 280px; margin-right: 1rem; }

/* Network Breathes - bottom left, pushed right */
.callout-orb { grid-area: 22 / 3 / 40 / 16; align-self: end; justify-self: start; max-width: 340px; margin-left: 1rem; }

/* Rhythm of Blocks - center, slight offset */
.callout-rhythm { grid-area: 10 / 14 / 24 / 28; align-self: center; justify-self: center; max-width: 300px; margin-top: 1.5rem; }

/* Credits - bottom right, wider */
.callout-credits { grid-area: 16 / 25 / 38 / 40; align-self: end; justify-self: end; max-width: 320px; margin-right: 0.5rem; margin-bottom: 0.5rem; }
</style>

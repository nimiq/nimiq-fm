<script setup lang="ts">
import { epochAt } from '@nimiq/utils/albatross-policy'
import { AnimatePresence, Motion } from 'motion-v'
import { setValidatorAddresses } from '~/utils/orb-constants'

const isPlaying = ref(false)
const showWhatIsThis = ref(false)

// Initialize composables only on client-side (shallowRef for reactivity)
const strudel = shallowRef<ReturnType<typeof useStrudel> | null>(null)
let blockchain: ReturnType<typeof useBlockchain> | null = null
let _cleanupBlockListener: (() => void) | null = null

// Use the shared blockchain state
const { latestBlock } = useBlockchain()
const isValidatorsPanelExpanded = ref(false)

async function togglePlay() {
  if (!strudel.value)
    return

  if (!isPlaying.value) {
    await strudel.value.start()
    isPlaying.value = true
  }
  else {
    strudel.value.stop()
    isPlaying.value = false
  }
}

onMounted(async () => {
  // Initialize composables (client-side only)
  strudel.value = useStrudel()
  blockchain = useBlockchain()

  // Initialize Strudel with error handling
  try {
    await strudel.value.init()
  }
  catch (error) {
    console.error('Failed to initialize audio system:', error)
    // User can still see visuals, audio just won't work
  }

  // Start listening to blockchain events
  blockchain.startListening()

  // Store cleanup function for event listener
  _cleanupBlockListener = blockchain.onBlockEvent((blockEvent: BlockEvent) => {
    if (!isPlaying.value || !strudel.value)
      return

    strudel.value.playBlockSound({ validatorAddress: blockEvent.validatorAddress, epoch: blockEvent.epoch, batch: blockEvent.batch, blockNumber: blockEvent.blockNumber })
  })

  // Load validators with error handling
  try {
    const { addresses } = await blockchain.getValidators()
    setValidatorAddresses(addresses)
  }
  catch (error) {
    console.error('Failed to load validators:', error)
    // Application still works, just won't have validator visuals on the orbs
  }
})

onUnmounted(() => {
  // Clean up the block event listener
  if (_cleanupBlockListener) {
    _cleanupBlockListener()
    _cleanupBlockListener = null
  }
})

const nowPlayingTitle = computed(() => strudel.value?.nowPlaying.value || '')
const isAudioReady = computed(() => strudel.value?.isReady.value ?? false)
const displayNowPlaying = computed(() => {
  if (nowPlayingTitle.value)
    return nowPlayingTitle.value
  if (latestBlock.value)
    return getCurrentSongName(latestBlock.value.blockNumber)
  return 'Tuning in...'
})
const nextSongTitle = computed(() => latestBlock.value ? getNextSongName(latestBlock.value.blockNumber) : '')
const currentAuthor = computed(() => latestBlock.value ? getCurrentSongAuthor(latestBlock.value.blockNumber) : '')
const nextAuthor = computed(() => latestBlock.value ? getNextSongAuthor(latestBlock.value.blockNumber) : '')
const currentEpoch = computed(() => latestBlock.value ? epochAt(latestBlock.value.blockNumber) : 0)
const hasBlockchainData = computed(() => !!latestBlock.value)

// Staged animation sequence
const animationStage = ref(0) // 0: welcome, 1: orb, 2: bottom, 3: header

watch(hasBlockchainData, (ready) => {
  if (ready) {
    // Stage 1: Orb fades in (after welcome fades out ~400ms)
    setTimeout(() => animationStage.value = 1, 400)
    // Stage 2: Bottom appears
    setTimeout(() => animationStage.value = 2, 1200)
    // Stage 3: Header appears
    setTimeout(() => animationStage.value = 3, 1800)
  }
})
</script>

<template>
  <div class="relative min-h-screen bg-slate-900 text-white" :class="{ 'loading-stage': animationStage <= 3 }">
    <!-- Fixed Orb Background (stays in place when page scrolls) -->
    <div class="fixed inset-0 z-0">
      <div class="absolute inset-0 orb-gradient-background" />
      <ClientOnly>
        <Motion
          class="absolute inset-0"
          :initial="{ opacity: 0 }"
          :animate="animationStage >= 1 ? { opacity: 1 } : { opacity: 0 }"
          :transition="{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }"
        >
          <LazyOrbScene :audio-data="0" />
        </Motion>
      </ClientOnly>
    </div>

    <!-- Debug Panel (Dev Only) -->
    <DevOnly>
      <LazyOrbDebugPanel class="fixed bottom-4 right-4 z-50 pointer-events-auto" />
    </DevOnly>

    <!-- Header -->
    <Motion
      tag="header"
      class="fixed top-0 left-0 right-0 z-20 pointer-events-auto"
      :initial="{ opacity: 0 }"
      :animate="animationStage >= 3 ? { opacity: 1 } : { opacity: 0 }"
      :transition="{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }"
    >
      <div class="flex items-center justify-between p-4 sm:p-6">
        <!-- Logo -->
        <img src="/logo-dark.svg" alt="Nimiq FM" class="h-4 sm:h-5" fetchpriority="high">

        <!-- Right side links -->
        <div class="flex items-center gap-1 sm:gap-6 text-sm text-white/70">
          <button class="flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer p-2 sm:p-0 disabled:opacity-50 disabled:cursor-wait" :disabled="!isAudioReady" @click="togglePlay">
            <AudioBars :is-playing="isPlaying" class="size-5 sm:size-4" />
            <span class="hidden sm:inline-flex whitespace-nowrap gap-1">Audio<span class="relative inline-block w-8 text-left">
              <Motion tag="span" class="absolute inset-0" :animate="{ opacity: !isAudioReady ? 1 : 0, filter: !isAudioReady ? 'blur(0px)' : 'blur(4px)' }" :transition="{ duration: 0.2 }">loading</Motion>
              <Motion tag="span" class="absolute inset-0" :animate="{ opacity: isAudioReady && isPlaying ? 1 : 0, filter: isAudioReady && isPlaying ? 'blur(0px)' : 'blur(4px)' }" :transition="{ duration: 0.2 }">on</Motion>
              <Motion tag="span" class="absolute inset-0" :animate="{ opacity: isAudioReady && !isPlaying ? 1 : 0, filter: isAudioReady && !isPlaying ? 'blur(0px)' : 'blur(4px)' }" :transition="{ duration: 0.2 }">off</Motion>
            </span></span>
          </button>
          <button class="hover:text-white transition-colors cursor-pointer text-base sm:text-sm p-2 sm:p-0" @click="showWhatIsThis = true">
            <span class="hidden sm:inline">What is this?</span>
            <span class="sm:hidden">?</span>
          </button>
          <!-- <NuxtLink to="https://nimiq.com/home" target="_blank" external class="nimiq-pill-blue nq-arrow text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4">
            <span class="hidden sm:inline">Visit nimiq.com</span>
            <span class="sm:hidden">nimiq.com</span>
          </NuxtLink> -->
        </div>
      </div>
    </Motion>

    <!-- Welcome Screen -->
    <AnimatePresence>
      <Motion
        v-if="!hasBlockchainData"
        key="welcome"
        class="fixed inset-0 flex items-center justify-center z-20 pointer-events-none"
        :initial="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.95, filter: 'blur(16px)' }"
        :transition="{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }"
      >
        <div class="absolute inset-0 backdrop-blur-md bg-slate-900/30" />
        <div class="relative flex flex-col items-center gap-2">
          <span class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white/80">Welcome to</span>
          <img src="/logo-dark.svg" alt="Nimiq FM" class="h-12 sm:h-16 lg:h-20">
        </div>
      </Motion>
    </AnimatePresence>

    <!-- Main Content -->
    <div class="relative z-10 flex flex-col min-h-screen pointer-events-none">
      <div class="flex-1" />

      <!-- Bottom Section -->
      <Motion
        v-if="animationStage >= 1"
        tag="div"
        class="z-20 w-full relative"
        :class="animationStage >= 2 ? 'pointer-events-auto' : 'pointer-events-none'"
        :initial="{ opacity: 0, y: 40 }"
        :animate="animationStage >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }"
        :transition="{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }"
      >
        <!-- Gradient Background -->
        <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />

        <!-- Content Container -->
        <div class="relative z-10 px-4 sm:px-6 mx-auto max-w-[1680px] max-h-[calc(100vh-80px)]">
          <div class="w-full bg-slate-800/60 backdrop-blur-sm rounded-lg mb-4 border border-white/10">
            <Motion
              :initial="{ opacity: 0, y: 20, filter: 'blur(8px)' }"
              :animate="animationStage >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 20, filter: 'blur(8px)' }"
              :transition="{ type: 'spring', stiffness: 400, damping: 30, delay: 0.1 }"
            >
              <BlockchainViewer class="border-b border-white/10" />
            </Motion>

            <Motion
              :initial="{ opacity: 0, y: 20, filter: 'blur(8px)' }"
              :animate="animationStage >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 20, filter: 'blur(8px)' }"
              :transition="{ type: 'spring', stiffness: 400, damping: 30, delay: 0.2 }"
              class="flex flex-col sm:flex-row"
            >
              <div class="flex items-center gap-3 sm:gap-6 p-4 sm:p-6 sm:border-r border-white/10 sm:flex-1">
                <AudioButton :is-playing="isPlaying" @toggle="togglePlay" />
                <NowPlaying :current-song="displayNowPlaying" :next-song="nextSongTitle" :current-author="currentAuthor" :next-author="nextAuthor" :epoch="currentEpoch" />
              </div>

              <SmallValidatorsPanel @is-expanded="(value) => isValidatorsPanelExpanded = value" />
            </Motion>
            <LazyValidatorsPanel :is-expanded="isValidatorsPanelExpanded" />
          </div>
        </div>

        <Motion
          tag="footer"
          class="w-full p-1 pb-4 relative"
          :initial="{ opacity: 0, y: 10 }"
          :animate="animationStage >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }"
          :transition="{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.3 }"
        >
          <p class="text-white/50 text-xs text-center inline-flex items-center justify-center gap-1 w-full">
            Made with ❤️ by Team <a href="https://nimiq.com" target="_blank" rel="noopener" class="group inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 rounded py-0.5 px-1.5 transition-colors"><svg class="size-3 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 18"><path class="fill-current group-hover:fill-[url(#nimiq-gradient)]" d="M19.734 8.156 15.576.844A1.66 1.66 0 0014.135 0H5.819C5.226 0 4.677.32 4.38.844L.222 8.156a1.71 1.71 0 000 1.688l4.158 7.312c.297.523.846.844 1.439.844h8.316c.593 0 1.142-.32 1.438-.844l4.158-7.312c.3-.523.3-1.165.003-1.688" /><defs><radialGradient id="nimiq-gradient" cx="0" cy="0" r="1" gradientTransform="matrix(-19.9562 0 0 -18 19.956 18)" gradientUnits="userSpaceOnUse"><stop stop-color="#EC991C" /><stop offset="1" stop-color="#E9B213" /></radialGradient></defs></svg><span class="group-hover:text-white transition-colors">Nimiq</span></a>
          </p>
        </Motion>
      </Motion>
    </div>

    <!-- What is this overlay -->
    <LazyWhatIsThisOverlay v-model="showWhatIsThis" />
  </div>
</template>

<style scoped>
.nimiq-btn {
  background: var(--radial-gradient-light-blue);
  padding: 16px 24px;
  border-radius: 120px;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nimiq-pill-blue {
  background: var(--radial-gradient-light-blue);
  padding: 8px 16px;
  border-radius: 9999px;
  font-weight: 600;
  color: white;
  transition: filter 0.2s ease;
}

.nimiq-pill-blue:hover {
  filter: brightness(1.1);
}

.nq-arrow::after {
  content: '';
  display: inline-block;
  -webkit-mask: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMTIgMTIiPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTQuNjY2IDEwIDEgNmwzLjY2Ny00TTIuNjE5IDZIMTEiLz48L3N2Zz4=') no-repeat;
  mask: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMTIgMTIiPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTQuNjY2IDEwIDEgNmwzLjY2Ny00TTIuNjE5IDZIMTEiLz48L3N2Zz4=') no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  background-color: currentColor;
  width: 0.7em;
  height: 0.7em;
  margin-left: 0.4em;
  margin-bottom: 1px;
  transform: rotate(135deg);
  transition: transform 100ms ease-out;
}

.nq-arrow:hover::after {
  transform: rotate(135deg) translate(-0.15em, 0);
}

.orb-gradient-background {
  background: radial-gradient(
    circle at 50% 45%,
    rgba(56, 191, 248, 0.042) 0%,
    rgba(99, 101, 241, 0.029) 20%,
    rgba(2, 6, 23, 0.95) 80%,
    #020617 100%
  );
}
</style>

<style>
body:has(.loading-stage) {
  overflow: clip;
}
</style>

<script setup lang="ts">
import { epochAt } from '@nimiq/utils/albatross-policy'
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
const displayNowPlaying = computed(() => {
  if (nowPlayingTitle.value)
    return nowPlayingTitle.value
  if (latestBlock.value)
    return getCurrentSongName(latestBlock.value.blockNumber)
  return 'Tuning in...'
})
const nextSongTitle = computed(() => latestBlock.value ? getNextSongName(latestBlock.value.blockNumber) : '')
const currentEpoch = computed(() => latestBlock.value ? epochAt(latestBlock.value.blockNumber) : 0)
</script>

<template>
  <div class="relative min-h-screen bg-slate-900 text-white">
    <!-- Fixed Orb Background (stays in place when page scrolls) -->
    <div class="fixed inset-0 z-0">
      <div class="absolute inset-0 orb-gradient-background" />
      <ClientOnly>
        <div class="absolute inset-0">
          <OrbScene :audio-data="0" />
        </div>
      </ClientOnly>
    </div>

    <!-- Debug Panel (Dev Only) -->
    <DevOnly>
      <OrbDebugPanel class="fixed bottom-4 right-4 z-50 pointer-events-auto" />
    </DevOnly>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-20 pointer-events-auto">
      <div class="flex items-center justify-between p-4 sm:p-6">
        <!-- Logo -->
        <img src="/logo-dark.svg" alt="Nimiq FM" class="h-4 sm:h-5">

        <!-- Right side links -->
        <div class="flex items-center gap-1 sm:gap-6 text-sm text-white/70">
          <button class="flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer p-2 sm:p-0" @click="togglePlay">
            <UIcon :name="isPlaying ? 'i-heroicons-speaker-wave' : 'i-heroicons-speaker-x-mark'" class="size-5 sm:size-4" />
            <span class="hidden sm:inline">{{ isPlaying ? 'Audio on' : 'Audio off' }}</span>
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
    </header>

    <!-- Main Content -->
    <div class="relative z-10 flex flex-col min-h-screen pointer-events-none">
      <div class="flex-1" />

      <!-- Bottom Section -->
      <div class="pointer-events-auto z-20 w-full relative">
        <!-- Gradient Background -->
        <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />

        <!-- Content Container -->
        <div class="relative z-10 px-4 sm:px-6 mx-auto max-w-[1680px] max-h-[calc(100vh-80px)]">
          <div class="w-full bg-slate-800/60 backdrop-blur-sm rounded-lg mb-4 border border-white/10">
            <BlockchainViewer class="border-b border-white/10" />

            <div class="flex flex-col sm:flex-row">
              <div class="flex items-center gap-3 sm:gap-6 p-4 sm:p-6 sm:border-r border-white/10 sm:flex-1">
                <AudioButton :is-playing="isPlaying" @toggle="togglePlay" />
                <NowPlaying :current-song="displayNowPlaying" :next-song="nextSongTitle" :epoch="currentEpoch" />
              </div>

              <SmallValidatorsPanel class="border-t sm:border-t-0 border-white/10 rounded-b-lg sm:rounded-none" @is-expanded="(value) => isValidatorsPanelExpanded = value" />
            </div>
            <ValidatorsPanel :is-expanded="isValidatorsPanelExpanded" />
          </div>
        </div>

        <footer class="w-full p-1 pb-4 relative">
          <p class="text-white/50 text-xs text-center">
            Made with ❤️ by <a href="https://nimiq.com" target="_blank" rel="noopener" class="underline hover:text-white transition-colors">Team Nimiq</a>
          </p>
        </footer>
      </div>
    </div>

    <!-- What is this overlay -->
    <WhatIsThisOverlay v-model="showWhatIsThis" />
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

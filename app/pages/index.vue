<script setup lang="ts">
import { setValidatorAddresses } from '~/utils/orb-constants'

const isPlaying = ref(false)

// Initialize composables only on client-side (shallowRef for reactivity)
const strudel = shallowRef<ReturnType<typeof useStrudel> | null>(null)
let blockchain: ReturnType<typeof useBlockchain> | null = null

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

  // Initialize but don't auto-start
  await strudel.value.init()

  // Start listening to blockchain events
  blockchain.startListening()

  blockchain.onBlockEvent((blockEvent: BlockEvent) => {
    if (!isPlaying.value || !strudel.value)
      return

    strudel.value.playBlockSound({ validatorAddress: blockEvent.validatorAddress, epoch: blockEvent.epoch, batch: blockEvent.batch, blockNumber: blockEvent.blockNumber })
  })

  const { addresses } = await blockchain.getValidators()
  setValidatorAddresses(addresses)
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
const currentEpoch = computed(() => latestBlock.value?.epoch ?? 0)
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
      <OrbDebugPanel class="fixed top-4 right-4 z-50 pointer-events-auto" />
    </DevOnly>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-20 pointer-events-auto">
      <div class="flex items-center justify-between p-4 sm:p-6">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="size-6 sm:size-8 rounded-full bg-amber-500" />
          <span class="text-lg sm:text-xl font-bold tracking-wide">NIMIQ <span class="text-xs sm:text-sm font-normal px-1.5 py-0.5 bg-white/10 rounded">FM</span></span>
        </div>

        <!-- Right side links -->
        <div class="flex items-center gap-4 sm:gap-6 text-sm text-white/70">
          <button class="flex items-center gap-1.5 hover:text-white transition-colors" @click="togglePlay">
            <UIcon :name="isPlaying ? 'i-heroicons-speaker-wave' : 'i-heroicons-speaker-x-mark'" class="size-4" />
            <span class="hidden sm:inline">{{ isPlaying ? 'Audio on' : 'Audio off' }}</span>
          </button>
          <a href="#" class="hover:text-white transition-colors">What is this?</a>
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
        <div class="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6 max-h-[calc(100vh-80px)]">
          <div class="w-full bg-slate-800/60 backdrop-blur-sm rounded-lg mb-4">
            <BlockchainViewer class="rounded-t-lg" />

            <div class="flex border border-t-0 border-white/10 rounded-b-lg">
              <div class="grid grid-cols-[auto_1fr] gap-x-6 items-center p-6 border-r border-white/10 flex-1">
                <button class="nimiq-btn">
                  <UIcon :name="isPlaying ? 'i-heroicons-speaker-x-mark' : 'i-heroicons-speaker-wave'" class="size-5" />
                  <span>{{ isPlaying ? '' : 'Turn on audio' }}</span>
                </button>
                <div>
                  <p class="font-bold text-xl text-white/50">
                    Now playing
                    <span class="text-white ml-1">{{ displayNowPlaying }}</span>
                  </p>
                  <p class="text-sm text-white/50 mt-1">
                    Epoch {{ currentEpoch }} · Up next: {{ nextSongTitle }}
                  </p>
                </div>
              </div>

              <SmallValidatorsPanel @is-expanded="(value) => isValidatorsPanelExpanded = value" />
            </div>
            <ValidatorsPanel :is-expanded="isValidatorsPanelExpanded" />
          </div>

          <!-- Bottom Row: Now Playing (left) + Validators (right) -->
          <!-- <div class="flex items-end justify-between gap-4">
            <div class="flex items-center gap-4">
              <button
                class="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-[#0582CA] hover:bg-[#0582CA]/90 transition-all duration-300 flex items-center gap-2 text-white font-medium shadow-lg shadow-[#0582CA]/30"
                @click="togglePlay"
              >
                <UIcon :name="isPlaying ? 'i-heroicons-speaker-wave' : 'i-heroicons-speaker-x-mark'" class="size-5" />
                <span class="text-sm sm:text-base">{{ isPlaying ? 'Audio on' : 'Turn on audio' }}</span>
              </button>

              <div class="flex flex-col">
                <div class="text-base sm:text-lg font-medium text-white">
                  Now playing <span class="font-bold">{{ displayNowPlaying }}</span>
                </div>
                <div class="text-xs sm:text-sm text-white/60">
                  Epoch {{ currentEpoch }} · Up next: {{ nextSongTitle }}
                </div>
              </div>
            </div>

            <ValidatorsPanel />
          </div>
        </div> -->
        </div>
      </div>
    </div>
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

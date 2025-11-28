<script setup lang="ts">
import { Motion } from 'motion-v'

const props = defineProps<{ currentSong: string, nextSong: string, currentAuthor: string, nextAuthor: string, epoch: number }>()

const isTransitioning = ref(false)
const currentSongDisplay = ref('')
const nextSongDisplay = ref('')
const currentAuthorDisplay = ref('')
const nextAuthorDisplay = ref('')

// Track if we've had a real song (not "Tuning in...")
const hasRealSong = ref(false)

// Song change
watch(() => props.currentSong, async (newSong, oldSong) => {
  if (!newSong || newSong === oldSong)
    return

  const isRealSong = newSong !== 'Tuning in...'

  // First real song or placeholder - just set without animation
  if (!hasRealSong.value) {
    currentSongDisplay.value = newSong
    currentAuthorDisplay.value = props.currentAuthor
    if (isRealSong)
      hasRealSong.value = true
    return
  }

  // Animate transition between real songs
  isTransitioning.value = true
  await sleep(600)

  isTransitioning.value = false
  await nextTick()
  currentSongDisplay.value = newSong
  currentAuthorDisplay.value = props.currentAuthor
  nextSongDisplay.value = props.nextSong
  nextAuthorDisplay.value = props.nextAuthor
}, { immediate: true })

watch(() => props.nextSong, (v) => {
  if (!nextSongDisplay.value || !isTransitioning.value) {
    nextSongDisplay.value = v
    nextAuthorDisplay.value = props.nextAuthor
  }
}, { immediate: true })

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
</script>

<template>
  <ClientOnly>
    <div>
      <!-- Line 1: Now playing [SONG] by [AUTHOR] -->
      <p class="font-bold text-sm sm:text-xl text-white/50">
        Now playing
        <span class="relative inline-block sm:ml-1">
          <!-- Current song - exits up + fade + blur -->
          <Motion
            tag="span"
            class="text-shimmer"
            :animate="{
              opacity: isTransitioning ? 0 : 1,
              y: isTransitioning ? -8 : 0,
              filter: isTransitioning ? 'blur(3px)' : 'blur(0px)',
            }"
            :transition="{ duration: isTransitioning ? 0.5 : 0, ease: 'easeOut' }"
          >{{ currentSongDisplay }} <span class="text-white/50 font-normal text-xs sm:text-sm">by {{ currentAuthorDisplay }}</span></Motion>

          <!-- Next song morphs in from below -->
          <Motion
            tag="span"
            class="absolute left-0 top-0 whitespace-nowrap text-shimmer"
            :animate="{
              opacity: isTransitioning ? 1 : 0,
              y: isTransitioning ? 0 : 24,
            }"
            :transition="{ duration: isTransitioning ? 0.5 : 0, ease: [0.4, 0, 0.2, 1], delay: isTransitioning ? 0.1 : 0 }"
          >{{ nextSongDisplay }} <span class="text-white/50 font-normal text-xs sm:text-sm">by {{ nextAuthorDisplay }}</span></Motion>
        </span>
      </p>

      <!-- Line 2: Epoch X · Up next: [SONG] -->
      <p class="text-[11px] sm:text-sm text-white/50 mt-0.5 sm:mt-1">
        Epoch {{ props.epoch }} · Up next:
        <span class="relative inline-block sm:ml-1">
          <!-- Current next - exits up + fade -->
          <Motion
            tag="span"
            class="text-white/50"
            :animate="{
              opacity: isTransitioning ? 0 : 1,
              y: isTransitioning ? -8 : 0,
            }"
            :transition="{ duration: isTransitioning ? 0.3 : 0, ease: 'easeOut' }"
          >{{ nextSongDisplay }}</Motion>

          <!-- New next slides in from below -->
          <Motion
            tag="span"
            class="absolute left-0 top-0 text-white/50 whitespace-nowrap"
            :animate="{
              opacity: isTransitioning ? 1 : 0,
              y: isTransitioning ? 0 : 12,
            }"
            :transition="{ duration: isTransitioning ? 0.5 : 0, ease: [0.4, 0, 0.2, 1], delay: isTransitioning ? 0.15 : 0 }"
          >{{ props.nextSong }}</Motion>
        </span>
      </p>
    </div>
    <template #fallback>
      <div>
        <p class="font-bold text-sm sm:text-xl text-white/50">
          Now playing <span class="relative inline-block ml-1 text-shimmer">{{ props.currentSong }} <span class="text-white/50 font-normal text-xs sm:text-sm">by {{ props.currentAuthor }}</span></span>
        </p>
        <p class="text-[11px] sm:text-sm text-white/50 mt-0.5 sm:mt-1">
          Epoch {{ props.epoch }} · Up next: <span class="relative inline-block sm:ml-1">{{ props.nextSong }}</span>
        </p>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.text-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,1) 100%);
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: text-shimmer 3s linear infinite;
}

@keyframes text-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>

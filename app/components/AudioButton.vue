<script setup lang="ts">
import { Motion } from 'motion-v'

const volumeSvg = `<svg class="size-5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.36 5.64a3.333 3.333 0 0 1 0 4.713m2.353-7.066a6.667 6.667 0 0 1 0 9.426m-5.38-9.38L4 6H1.333v4H4l3.333 2.667z" /></svg>`
const muteSvg = `<svg class="size-5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.333 3.333L4 6H1.333v4H4l3.333 2.667zM14 6l-4 4m0-4 4 4" /></svg>`

const props = defineProps<{ isPlaying: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const isHovered = ref(false)
const hasLeftAfterPlay = ref(false)

// Reset hasLeftAfterPlay when stopping
watch(() => props.isPlaying, (playing) => {
  if (!playing)
    hasLeftAfterPlay.value = false
})

// Only show orange if user has left and re-entered after clicking play
const isOrange = computed(() => props.isPlaying && isHovered.value && hasLeftAfterPlay.value)
const showRing = computed(() => props.isPlaying && isHovered.value && hasLeftAfterPlay.value)

// Determine background based on state
const background = computed(() => {
  if (isOrange.value)
    return 'radial-gradient(100% 100% at 100% 100%, #FD6216 0%, #FC8701 100%)'
  if (props.isPlaying)
    return 'radial-gradient(78.95% 73.1% at 12.5% 14.72%, #FFFFFF 0%, rgba(255, 255, 255, 0.62) 100%)'
  return 'var(--radial-gradient-light-blue)'
})
</script>

<template>
  <button
    class="relative h-12"
    @click="emit('toggle')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false; if (isPlaying) hasLeftAfterPlay = true"
  >
    <!-- Rotating shimmer ring (circle state) - larger with gap -->
    <Motion
      tag="span"
      class="absolute size-16 -left-2 -top-2 rounded-full pointer-events-none"
      :animate="{ opacity: isPlaying ? 1 : 0, scale: isPlaying ? 1 : 0.8 }"
      :transition="{ opacity: { duration: 0.3, delay: isPlaying ? 0.2 : 0 }, scale: { duration: 0.3 } }"
    >
      <!-- Rotating gradient ring with stroke effect -->
      <svg class="absolute inset-0 size-full shimmer-ring" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" fill="none" stroke="url(#ring-gradient)" stroke-width="2.5" />
        <defs>
          <linearGradient id="ring-gradient">
            <stop offset="0%" :stop-color="isOrange ? 'rgba(253, 98, 22, 0.7)' : 'rgba(255, 255, 255, 0.5)'" />
            <stop offset="30%" :stop-color="isOrange ? 'rgba(253, 98, 22, 0.08)' : 'rgba(255, 255, 255, 0.08)'" />
            <stop offset="100%" :stop-color="isOrange ? 'rgba(253, 98, 22, 0.08)' : 'rgba(255, 255, 255, 0.08)'" />
          </linearGradient>
        </defs>
      </svg>
    </Motion>

    <!-- Single morphing container -->
    <Motion
      tag="span"
      class="h-12 flex items-center justify-center rounded-full relative overflow-hidden"
      :animate="{
        width: isPlaying ? '48px' : '140px',
        background,
      }"
      :transition="{
        width: { type: 'spring', stiffness: 500, damping: 35, delay: isPlaying ? 0.08 : 0.15 },
        background: { duration: 0.2 },
      }"
    >
      <!-- Pill content: icon + text -->
      <Motion
        tag="span"
        class="flex items-center gap-2 font-bold text-white whitespace-nowrap absolute"
        :animate="{
          opacity: isPlaying ? 0 : 1,
          scale: isPlaying ? 0.85 : 1,
          x: isPlaying ? -20 : 0,
        }"
        :transition="{
          opacity: { duration: 0.1, delay: isPlaying ? 0 : 0.2 },
          scale: { duration: 0.15 },
          x: { duration: 0.15 },
        }"
      >
        <span class="shrink-0" v-html="volumeSvg" />
        <span>Tune in</span>
      </Motion>

      <!-- Circle icon -->
      <Motion
        tag="span"
        class="absolute"
        :style="{ color: isOrange ? '#fff' : '#334155' }"
        :animate="{
          opacity: isPlaying ? 1 : 0,
          scale: isPlaying ? 1 : 0.5,
        }"
        :transition="{
          opacity: { duration: 0.15, delay: isPlaying ? 0.2 : 0 },
          scale: { type: 'spring', stiffness: 600, damping: 25, delay: isPlaying ? 0.18 : 0 },
        }"
      >
        <Transition name="icon-swap" mode="out-in">
          <span v-if="!isOrange" key="vol" v-html="volumeSvg" />
          <span v-else key="mute" v-html="muteSvg" />
        </Transition>
      </Motion>
    </Motion>
  </button>
</template>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.icon-swap-enter-from,
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Rotating shimmer ring */
.shimmer-ring {
  animation: shimmer-rotate 3s linear infinite;
}

@keyframes shimmer-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

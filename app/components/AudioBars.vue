<script setup lang="ts">
import { Motion } from 'motion-v'

defineProps<{ isPlaying: boolean, class?: string }>()
</script>

<template>
  <div class="flex items-center justify-center" :class="[$props.class]">
    <Motion tag="span" class="w-[2px] h-1/2 bg-current origin-center will-change-transform" :animate="{ x: -1.5, scaleY: isPlaying ? [0.5, 1, 0.5] : 0.5 }" :transition="isPlaying ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }" />
    <Motion tag="span" class="w-[2px] h-1/2 bg-current origin-center will-change-transform" :animate="{ scaleY: isPlaying ? [0.5, 1, 0.5] : 0.5 }" :transition="isPlaying ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } : { duration: 0.3 }" />
    <Motion tag="span" class="w-[2px] h-1/2 bg-current origin-center will-change-transform" :animate="{ x: 1.5, scaleY: isPlaying ? [0.5, 1, 0.5] : 0.5 }" :transition="isPlaying ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } : { duration: 0.3 }" />
  </div>
</template>

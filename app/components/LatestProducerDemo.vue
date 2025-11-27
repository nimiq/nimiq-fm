<script setup lang="ts">
import { Motion } from 'motion-v'

const { sortedBySlots } = useValidators()
const { latestBlock } = useBlockchain()

const isTransitioning = ref(false)
const currentValidator = ref<{ name: string, logo: string } | null>(null)
const nextValidator = ref<{ name: string, logo: string } | null>(null)

// Get validator info by address
function getValidatorInfo(address: string) {
  const validator = sortedBySlots.value.find(v => v.address === address)
  return validator ? { name: validator.name || 'Unknown', logo: validator.logo } : null
}

// Watch for new blocks
watch(latestBlock, async (block) => {
  if (!block?.validatorAddress) return

  const newValidator = getValidatorInfo(block.validatorAddress)
  if (!newValidator) return

  // First validator - just set without animation
  if (!currentValidator.value) {
    currentValidator.value = newValidator
    return
  }

  // Same validator - skip
  if (currentValidator.value.name === newValidator.name) return

  // Animate transition
  nextValidator.value = newValidator
  isTransitioning.value = true

  await new Promise(r => setTimeout(r, 500))

  // End transition first (with duration:0, instant snap), then update values
  isTransitioning.value = false
  await nextTick()
  currentValidator.value = newValidator
  nextValidator.value = null
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-xs text-white/50">Latest producer</span>
    <div class="relative h-7">
      <!-- Current validator - in normal flow, exits up with blur + fade -->
      <Motion
        class="flex items-center gap-2"
        :animate="{
          opacity: isTransitioning ? 0 : 1,
          y: isTransitioning ? -12 : 0,
          filter: isTransitioning ? 'blur(3px)' : 'blur(0px)',
        }"
        :transition="{ duration: isTransitioning ? 0.4 : 0, easing: 'ease-out' }"
      >
        <template v-if="currentValidator">
          <img :src="currentValidator.logo" :alt="currentValidator.name" class="size-5 rounded-full">
          <span class="text-sm text-white/90 font-medium">{{ currentValidator.name }}</span>
        </template>
        <span v-else class="text-sm text-white/50">Waiting...</span>
      </Motion>

      <!-- Next validator - absolute overlay, enters from below -->
      <Motion
        v-if="nextValidator"
        class="flex items-center gap-2 absolute left-0 top-0"
        :animate="{
          opacity: isTransitioning ? 1 : 0,
          y: isTransitioning ? 0 : 16,
        }"
        :transition="{ duration: isTransitioning ? 0.4 : 0, easing: [0.16, 1, 0.3, 1], delay: isTransitioning ? 0.1 : 0 }"
      >
        <img :src="nextValidator.logo" :alt="nextValidator.name" class="size-5 rounded-full">
        <span class="text-sm text-white/90 font-medium">{{ nextValidator.name }}</span>
      </Motion>
    </div>
  </div>
</template>

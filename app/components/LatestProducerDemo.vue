<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const { sortedBySlots } = useValidators()
const { latestBlock } = useBlockchain()

const currentValidator = ref<{ name: string | undefined, logo: string | undefined, address: string } | null>(null)

// Get validator info by address
function getValidatorInfo(address: string) {
  const validator = sortedBySlots.value.find(v => v.address === address)
  return validator ? { name: validator.name, logo: validator.logo, address } : null
}

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-4)}`
}

// Watch for new blocks
watch(latestBlock, (block) => {
  if (!block?.validatorAddress)
    return
  const newValidator = getValidatorInfo(block.validatorAddress)
  if (newValidator)
    currentValidator.value = newValidator
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-xs text-white/50">Latest producer</span>
    <div class="h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <Motion
          v-if="currentValidator"
          :key="currentValidator.address"
          class="flex items-center gap-2"
          :initial="{ opacity: 0, y: 12, filter: 'blur(2px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, y: -12, filter: 'blur(2px)' }"
          :transition="{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }"
        >
          <img :src="currentValidator.logo" :alt="currentValidator.name" class="size-5 rounded-full">
          <span class="text-sm text-white/90 font-medium">{{ currentValidator.name || truncateAddress(currentValidator.address) }}</span>
        </Motion>
        <Motion
          v-else
          key="waiting"
          class="flex items-center"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
        >
          <span class="text-sm text-white/50">Waiting...</span>
        </Motion>
      </AnimatePresence>
    </div>
  </div>
</template>

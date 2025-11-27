<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

defineProps<{
  isExpanded: boolean
}>()

const { sortedBySlots } = useValidators()
const { latestBlock } = useBlockchain()

// Track active validators - use Map for proper reactivity
const activeValidators = ref(new Map<string, 'glow' | 'fading'>())

// Watch for new blocks and trigger glow effect
watch(latestBlock, (block) => {
  if (block?.validatorAddress) {
    const address = block.validatorAddress

    // Set to glow state immediately
    activeValidators.value.set(address, 'glow')
    activeValidators.value = new Map(activeValidators.value) // trigger reactivity

    // After 300ms, start fading
    setTimeout(() => {
      if (activeValidators.value.get(address) === 'glow') {
        activeValidators.value.set(address, 'fading')
        activeValidators.value = new Map(activeValidators.value)
      }
    }, 800)

    // After fade completes, remove
    setTimeout(() => {
      activeValidators.value.delete(address)
      activeValidators.value = new Map(activeValidators.value)
    }, 1800)
  }
})

function getValidatorState(address: string) {
  return activeValidators.value.get(address)
}

// Get validator name by address
function getValidatorName(address: string): string {
  const validator = sortedBySlots.value.find(v => v.address === address)
  return validator?.name || address
}

// Get active validator name for display
const activeValidatorName = ref('Waiting for blocks...')
watch(latestBlock, () => {
  if (latestBlock.value?.validatorAddress)
    activeValidatorName.value = getValidatorName(latestBlock.value.validatorAddress) || activeValidatorName.value
})
</script>

<template>
  <div>
    <AnimatePresence>
      <Motion
        v-if="isExpanded"
        :initial="{ height: 0, opacity: 0 }"
        :animate="{ height: 'auto', opacity: 1 }"
        :exit="{ height: 0, opacity: 0 }"
        :transition="{ duration: 0.4, ease: 'easeInOut' }"
        class="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-300px)]"
      >
        <div class="border-t border-white/10 p-4 sm:p-6 xl:p-8">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 xl:gap-8 justify-items-center">
            <Motion
              v-for="(v, index) in sortedBySlots"
              :key="v.address"
              :initial="{ opacity: 0, y: 20, scale: 0.9 }"
              :animate="{ opacity: 1, y: 0, scale: 1 }"
              :transition="{ duration: 0.3, delay: index * 0.02, ease: 'easeOut' }"
              class="flex items-center gap-4 w-full"
            >
              <img :src="v.logo" :alt="v.name" class="size-10 sm:size-12 validator-img" :class="{ 'validator-glow': getValidatorState(v.address) === 'glow', 'validator-fading': getValidatorState(v.address) === 'fading' }">
              <div class="text-sm text-white/80 font-medium truncate validator-text" :class="{ 'validator-text-glow': getValidatorState(v.address) === 'glow', 'validator-text-fading': getValidatorState(v.address) === 'fading' }">
                <div v-if="v.name" class="truncate">
                  {{ v.name }}
                </div>
                <ShortAddress v-else :address="v.address" />
              </div>
            </Motion>
          </div>
        </div>
      </Motion>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.validator-img {
  filter: grayscale(80%);
  opacity: 0.6;
}

.validator-img.validator-glow {
  filter: grayscale(0%) drop-shadow(0 0 10px rgba(255, 96, 0, 0.5)) drop-shadow(0 0 16px rgba(255, 96, 0, 0.2));
  opacity: 1;
}

.validator-img.validator-fading {
  filter: grayscale(80%);
  opacity: 0.6;
  transition: filter 1s ease-out, opacity 1s ease-out;
}

.validator-text {
  color: rgba(255, 255, 255, 0.7);
}

.validator-text.validator-text-glow {
  color: rgb(251, 146, 60);
}

.validator-text.validator-text-fading {
  color: rgba(255, 255, 255, 0.7);
  transition: color 1s ease-out;
}
</style>

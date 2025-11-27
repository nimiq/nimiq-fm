<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const emit = defineEmits<{
  (e: 'isExpanded', value: boolean): void
}>()

const isExpanded = ref(false)
const { sortedBySlots, topValidators } = useValidators()
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
    }, 300)

    // After fade completes, remove
    setTimeout(() => {
      activeValidators.value.delete(address)
      activeValidators.value = new Map(activeValidators.value)
    }, 1300)
  }
})

function getValidatorState(address: string) {
  return activeValidators.value.get(address)
}

// Get validator name by address
function getValidatorName(address: string): string | undefined {
  const validator = sortedBySlots.value.find(v => v.address === address)
  return validator?.name || undefined
}

// Get active validator name for display
const activeValidatorName = ref<string | undefined>('Waiting for blocks...')
watch(latestBlock, () => {
  if (latestBlock.value?.validatorAddress)
    activeValidatorName.value = getValidatorName(latestBlock.value.validatorAddress)
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  emit('isExpanded', isExpanded.value)
}
</script>

<template>
  <div
    class="w-max m-3 hover:bg-white/5 transition-colors rounded-md py-5 px-6 cursor-zoom-in select-none"
    :class="{ 'cursor-zoom-out': isExpanded }"
    @click="toggleExpand"
  >
    <div class="flex items-center justify-between gap-4 mb-2">
      <div v-for="v in topValidators" :key="v.address" class="flex items-center gap-0.5">
        <div
          class="validator-hex"
          :class="{
            'validator-glow': getValidatorState(v.address) === 'glow',
            'validator-fading': getValidatorState(v.address) === 'fading',
          }"
        >
          <img :src="v.logo" :alt="v.name" class="size-8 validator-img" :class="{ 'validator-glow': getValidatorState(v.address) === 'glow', 'validator-fading': getValidatorState(v.address) === 'fading' }">
        </div>
      </div>
    </div>
    <AnimatePresence mode="wait">
      <Motion
        :key="activeValidatorName"
        :initial="{ opacity: 0, y: 4 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -4 }"
        :transition="{ duration: 0.2 }"
        class="text-sm text-white/80 font-medium"
      >
        <span v-if="activeValidatorName">
          {{ activeValidatorName }}
        </span>
        <span v-else>
          <ShortAddress :address="latestBlock?.validatorAddress || ''" />
        </span>
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

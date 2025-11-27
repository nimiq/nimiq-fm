<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const emit = defineEmits<{
  (e: 'isExpanded', value: boolean): void
}>()

const isExpanded = ref(false)
const { sortedBySlots, displayValidators, hiddenValidators, remainingCount } = useValidators()
const { latestBlock } = useBlockchain()

// Track active validators - use Map for proper reactivity
const activeValidators = ref(new Map<string, 'glow' | 'fading'>())
const overflowGlowState = ref<'glow' | 'fading' | null>(null)

// Watch for new blocks and trigger glow effect
watch(latestBlock, (block) => {
  if (block?.validatorAddress) {
    const address = block.validatorAddress
    const isHidden = hiddenValidators.value.some(v => v.address === address)

    if (isHidden) {
      overflowGlowState.value = 'glow'
      setTimeout(() => { if (overflowGlowState.value === 'glow') overflowGlowState.value = 'fading' }, 300)
      setTimeout(() => { overflowGlowState.value = null }, 1300)
    }
    else {
      activeValidators.value.set(address, 'glow')
      activeValidators.value = new Map(activeValidators.value)
      setTimeout(() => {
        if (activeValidators.value.get(address) === 'glow') {
          activeValidators.value.set(address, 'fading')
          activeValidators.value = new Map(activeValidators.value)
        }
      }, 300)
      setTimeout(() => {
        activeValidators.value.delete(address)
        activeValidators.value = new Map(activeValidators.value)
      }, 1300)
    }
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
  <ClientOnly>
    <div
      class="w-full sm:w-max m-0 sm:m-3 hover:bg-white/5 transition-colors rounded-md py-3 sm:py-5 px-4 sm:px-6 cursor-zoom-in select-none"
      :class="{ 'cursor-zoom-out': isExpanded }"
      @click="toggleExpand"
    >
      <div class="grid grid-cols-4 sm:flex sm:items-center gap-2 sm:gap-4 mb-2">
        <div v-for="v in displayValidators" :key="v.address" class="flex items-center justify-center gap-0.5">
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
        <!-- Overflow indicator -->
        <div v-if="remainingCount > 0" class="flex items-center justify-center gap-0.5">
          <div class="relative validator-hex">
            <svg class="size-8 overflow-icon" :class="{ 'overflow-glow': overflowGlowState === 'glow', 'overflow-fading': overflowGlowState === 'fading' }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 18" fill="currentColor">
              <path d="M19.734 8.156 15.576.844A1.66 1.66 0 0014.135 0H5.819C5.226 0 4.677.32 4.38.844L.222 8.156a1.71 1.71 0 000 1.688l4.158 7.312c.297.523.846.844 1.439.844h8.316c.593 0 1.142-.32 1.438-.844l4.158-7.312c.3-.523.3-1.165.003-1.688" />
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-900">+{{ remainingCount }}</span>
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
    <template #fallback>
      <div class="w-full sm:w-max m-0 sm:m-3 rounded-md py-3 sm:py-5 px-4 sm:px-6">
        <div class="text-sm text-white/80 font-medium">
          Loading validators...
        </div>
      </div>
    </template>
  </ClientOnly>
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

.overflow-icon {
  color: rgba(255, 255, 255, 0.5);
}

.overflow-icon.overflow-glow {
  filter: drop-shadow(0 0 10px rgba(255, 96, 0, 0.5)) drop-shadow(0 0 16px rgba(255, 96, 0, 0.2));
}

.overflow-icon.overflow-fading {
  filter: none;
  transition: filter 1s ease-out;
}
</style>

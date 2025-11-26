<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const { sortedBySlots, topValidators, status } = useValidators()
const { latestBlock } = useBlockchain()

const isLoaded = computed(() => status.value === 'success' && sortedBySlots.value.length > 0)

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
  <div class="w-max m-3 hover:bg-white/5 transition-colors rounded-md py-5 px-6 cursor-zoom-in">
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
        {{ activeValidatorName }}
      </Motion>
    </AnimatePresence>
  </div>
  <!-- <div class="flex flex-col items-end gap-2">
    <AnimatePresence>
      <Motion
        v-if="isLoaded"
        :initial="{ opacity: 0, x: 20 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.6, ease: 'easeOut' }"
        class="flex flex-col items-end gap-2"
      >

        <div class="flex items-center gap-0.5">
          <UTooltip v-for="v in topValidators" :key="v.address" :text="`${v.name} · ${v.numSlots} slots`">
            <div
              class="validator-hex"
              :class="{
                'validator-glow': getValidatorState(v.address) === 'glow',
                'validator-fading': getValidatorState(v.address) === 'fading',
              }"
            >
              <img v-if="v.logo" :src="v.logo" :alt="v.name" class="size-5 sm:size-6 object-contain">
              <div v-else class="size-5 sm:size-6 flex items-center justify-center text-[10px] text-white/60">
                {{ v.name?.charAt(0) || '?' }}
              </div>
            </div>
          </UTooltip>
        </div>

        <AnimatePresence mode="wait">
          <Motion
            v-if="activeValidatorName"
            :key="activeValidatorName"
            :initial="{ opacity: 0, y: 5 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -5 }"
            :transition="{ duration: 0.2 }"
            class="text-xs text-white/70"
          >
            {{ activeValidatorName }}
          </Motion>
        </AnimatePresence>
      </Motion>
    </AnimatePresence>
  </div> -->
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

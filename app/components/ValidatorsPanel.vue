<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const { sortedBySlots, topValidators, status } = useValidators()
const { latestBlock } = useBlockchain()

const isExpanded = ref(false)
const isLoaded = computed(() => status.value === 'success' && sortedBySlots.value.length > 0)
const gridRef = ref<HTMLElement | null>(null)

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

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    setTimeout(() => {
      gridRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
}
</script>

<template>
  <div class="w-full flex flex-col items-center px-4 sm:px-8">
    <AnimatePresence>
      <Motion
        v-if="isLoaded"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.6, ease: 'easeOut' }"
        class="w-full max-w-4xl bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/5 overflow-hidden"
      >
        <!-- Collapsed: clickable row of top 8 logos -->
        <button class="w-full p-4 flex items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors" @click="toggleExpand">
          <div class="flex items-center gap-2">
            <UTooltip v-for="v in topValidators" :key="v.address" :text="`${v.name} · ${v.numSlots} slots`">
              <img :src="v.logo" :alt="v.name" class="size-8 validator-img" :class="{ 'validator-glow': getValidatorState(v.address) === 'glow', 'validator-fading': getValidatorState(v.address) === 'fading' }">
            </UTooltip>
          </div>
          <UIcon name="i-heroicons-chevron-down-20-solid" class="size-5 text-white/50 transition-transform duration-300" :class="{ 'rotate-180': isExpanded }" />
        </button>

        <!-- Expanded: grid of all validators -->
        <AnimatePresence>
          <Motion
            v-if="isExpanded"
            :initial="{ height: 0, opacity: 0 }"
            :animate="{ height: 'auto', opacity: 1 }"
            :exit="{ height: 0, opacity: 0 }"
            :transition="{ duration: 0.4, ease: 'easeInOut' }"
            class="overflow-hidden"
          >
            <div ref="gridRef" class="border-t border-white/10 p-4 sm:p-6">
              <div class="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 xs:gap-6 sm:gap-8 md:gap-10 justify-items-center">
                <Motion
                  v-for="(v, index) in sortedBySlots"
                  :key="v.address"
                  :initial="{ opacity: 0, y: 20, scale: 0.9 }"
                  :animate="{ opacity: 1, y: 0, scale: 1 }"
                  :transition="{ duration: 0.3, delay: index * 0.02, ease: 'easeOut' }"
                  class="flex flex-col items-center gap-2"
                >
                  <img :src="v.logo" :alt="v.name" class="size-10 sm:size-12 validator-img" :class="{ 'validator-glow': getValidatorState(v.address) === 'glow', 'validator-fading': getValidatorState(v.address) === 'fading' }">
                  <div class="text-center text-xs max-w-20 sm:max-w-26 validator-text" :class="{ 'validator-text-glow': getValidatorState(v.address) === 'glow', 'validator-text-fading': getValidatorState(v.address) === 'fading' }">
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
      </Motion>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.validator-img {
  filter: grayscale(60%);
  opacity: 0.6;
}

.validator-img.validator-glow {
  filter: grayscale(0%) drop-shadow(0 0 12px rgba(255, 96, 0, 1)) drop-shadow(0 0 24px rgba(255, 96, 0, 0.6));
  opacity: 1;
}

.validator-img.validator-fading {
  filter: grayscale(60%);
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

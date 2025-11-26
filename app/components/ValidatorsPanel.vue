<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const { sortedBySlots, topValidators, status } = useValidators()
const { latestBlock } = useBlockchain()

const isExpanded = ref(false)
const isLoaded = computed(() => status.value === 'success' && sortedBySlots.value.length > 0)
const gridRef = ref<HTMLElement | null>(null)

// Track active validators with unique keys for animation restart
const activeValidators = ref<Map<string, number>>(new Map())

// Watch for new blocks and trigger glow effect
watch(latestBlock, (block) => {
  if (block?.validatorAddress) {
    const address = block.validatorAddress
    const key = Date.now()
    activeValidators.value.set(address, key)
    setTimeout(() => {
      if (activeValidators.value.get(address) === key) {
        activeValidators.value.delete(address)
      }
    }, 2000)
  }
})

function getAnimationKey(address: string) {
  return activeValidators.value.get(address) || 0
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
              <img :key="getAnimationKey(v.address)" :src="v.logo" :alt="v.name" class="size-8" :class="{ 'validator-glow': activeValidators.has(v.address) }">
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
              <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-10">
                <Motion
                  v-for="(v, index) in sortedBySlots"
                  :key="v.address"
                  :initial="{ opacity: 0, y: 20, scale: 0.9 }"
                  :animate="{ opacity: 1, y: 0, scale: 1 }"
                  :transition="{ duration: 0.3, delay: index * 0.02, ease: 'easeOut' }"
                  class="flex flex-col items-center gap-2"
                >
                  <img :key="getAnimationKey(v.address)" :src="v.logo" :alt="v.name" class="size-10 sm:size-12" :class="{ 'validator-glow': activeValidators.has(v.address) }">
                  <div class="text-center text-xs max-w-20 sm:max-w-26" :class="activeValidators.has(v.address) ? 'text-orange-400' : 'text-white/70'">
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
@keyframes validator-glow {
  0% { filter: drop-shadow(0 0 12px rgba(255, 96, 0, 1)) drop-shadow(0 0 24px rgba(255, 96, 0, 0.8)); }
  100% { filter: drop-shadow(0 0 2px rgba(255, 96, 0, 0.2)); }
}

.validator-glow {
  animation: validator-glow 2s ease-out forwards;
}
</style>

<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const emit = defineEmits<{ (e: 'isExpanded', value: boolean): void }>()

const isExpanded = ref(false)
const { sortedBySlots } = useValidators()
const { latestBlock } = useBlockchain()

// Sliding validators queue
interface SlidingValidator { address: string, name?: string, logo?: string, id: string, isPlaceholder?: boolean }
const VISIBLE_COUNT = 12
const MAX_QUEUE_SIZE = 30
// Initialize with placeholders
const slidingValidatorQueue = ref<SlidingValidator[]>(
  Array.from({ length: VISIBLE_COUNT }, (_, i) => ({ address: '', name: '', logo: '', id: `placeholder-${i}`, isPlaceholder: true }))
)

// Watch for new blocks - defer to onMounted so placeholders show on initial render
onMounted(() => {
  watch(latestBlock, (block) => {
    if (!block?.validatorAddress)
      return
    const validator = sortedBySlots.value.find(v => v.address === block.validatorAddress)
    const newEntry: SlidingValidator = { address: block.validatorAddress, name: validator?.name, logo: validator?.logo, id: `${block.blockNumber}-${block.validatorAddress}` }
    slidingValidatorQueue.value = [newEntry, ...slidingValidatorQueue.value.slice(0, MAX_QUEUE_SIZE - 1)]
  })
})

// Get validator name by address
function getValidatorName(address: string): string | undefined {
  return sortedBySlots.value.find(v => v.address === address)?.name
}

// Active validator name for display
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
      class="w-full sm:w-max m-0 sm:m-3 hover:bg-white/5 transition-colors rounded-b-xl lg:rounded-t-xl py-3 sm:py-5 px-4 sm:px-6 cursor-zoom-in select-none border-t border-white/10 sm:border-t-0"
      :class="{ 'cursor-zoom-out': isExpanded }"
      @click="toggleExpand"
    >
      <!-- Sliding animation (always shown) -->
      <div class="relative">
        <!-- Sliding container with mask -->
        <div class="flex gap-3 overflow-hidden sliding-mask py-1 w-full sm:w-[512px]">
          <Motion
            v-for="v in slidingValidatorQueue"
            :key="v.id"
            layout
            :initial="{ opacity: 0, scale: 0.6 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 260, damping: 26 }"
            class="shrink-0"
          >
            <!-- Placeholder -->
            <svg v-if="v.isPlaceholder" class="size-8" viewBox="0 0 20 18">
              <path fill="white" fill-opacity="0.1" d="M19.734 8.156 15.576.844A1.66 1.66 0 0014.135 0H5.819C5.226 0 4.677.32 4.38.844L.222 8.156a1.71 1.71 0 000 1.688l4.158 7.312c.297.523.846.844 1.439.844h8.316c.593 0 1.142-.32 1.438-.844l4.158-7.312c.3-.523.3-1.165.003-1.688" />
            </svg>
            <!-- Validator logo -->
            <img v-else :src="v.logo" :alt="v.name" class="size-8 object-contain">
          </Motion>
        </div>

        <!-- Validator name + CTA row -->
        <div class="flex justify-between items-center mt-1">
          <div class="flex items-end gap-0 ml-2">
            <!-- L-shaped connector with arrow -->
            <svg class="w-4 h-5 text-white/10 mb-0.5" viewBox="0 0 16 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 0 L8 14 L14 14" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12 11 L15 14 L12 17" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            <!-- Validator name -->
            <AnimatePresence mode="wait">
              <Motion
                :key="activeValidatorName"
                tag="span"
                :initial="{ opacity: 0 }"
                :animate="{ opacity: 1 }"
                :exit="{ opacity: 0 }"
                :transition="{ duration: 0.15 }"
                class="text-xs text-white/80 font-medium font-mono whitespace-nowrap ml-1"
              >
                <template v-if="activeValidatorName">
                  {{ activeValidatorName }}
                </template>
                <ShortAddress v-else :address="latestBlock?.validatorAddress || ''" />
              </Motion>
            </AnimatePresence>
          </div>

          <!-- CTA -->
          <span class="text-[10px] text-white/40 flex items-center gap-1 hover:text-white/60 transition-colors">
            {{ isExpanded ? 'Close' : 'See all' }}
            <svg class="size-2.5 transition-transform" :class="{ 'rotate-90': isExpanded }" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 2l4 4-4 4" />
            </svg>
          </span>
        </div>
      </div>
    </div>
    <template #fallback>
      <div class="w-full sm:w-max m-0 sm:m-3 rounded-b-xl py-3 sm:py-5 px-4 sm:px-6">
        <div class="text-sm text-white/80 font-medium">
          Loading validators...
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.sliding-mask {
  mask-image: linear-gradient(to right, black 0%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 0%, black 85%, transparent 100%);
}
</style>

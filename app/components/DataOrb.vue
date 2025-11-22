<script setup lang="ts">
import type { Beam, ValidatorNode, ValidatorAPIResponse } from '~/types/orb'
import { generateGraph } from '~/utils/generate-graph'
import { ORB_CONFIG } from '~/utils/orb-constants'

const props = defineProps<{
  audioData: Float32Array
  songTheme: 'dunesOfDessert' | 'qinim'
  peerCount: number
}>()

const { data: validators } = await useFetch<ValidatorAPIResponse[]>('https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false')
const graphData = shallowRef<ReturnType<typeof generateGraph>>()
const beams = ref<Beam[]>([])

// Generate graph when validators loaded
watchEffect(() => {
  if (validators.value && validators.value.length > 0) {
    graphData.value = generateGraph(validators.value, props.peerCount, props.songTheme)
  }
})

// Watch peer count changes
watch(() => props.peerCount, (newCount) => {
  if (!graphData.value || !validators.value || validators.value.length === 0) return
  graphData.value = generateGraph(validators.value, newCount, props.songTheme)
})

// Watch theme changes
watch(() => props.songTheme, (newTheme) => {
  if (!graphData.value || !validators.value || validators.value.length === 0) return
  graphData.value = generateGraph(validators.value, props.peerCount, newTheme)
})

// Trigger block (called from parent)
const triggerBlock = (validatorAddress?: string) => {
  if (!graphData.value || !validators.value) return

  let address = validatorAddress
  if (!address) {
    // Random validator
    const randomValidator = validators.value[Math.floor(Math.random() * validators.value.length)]
    address = randomValidator?.address
  }

  if (!address) return

  const validatorIdx = graphData.value.validatorMap.get(address)
  if (validatorIdx !== undefined && graphData.value.nodes[validatorIdx]) {
    const validator = graphData.value.nodes[validatorIdx] as ValidatorNode
    validator.lastBlockTime = Date.now() / 1000

    beams.value.push({
      id: crypto.randomUUID(),
      originAddress: address,
      startTime: Date.now() / 1000,
      maxDistance: ORB_CONFIG.ORB_RADIUS * 2.5,
    })
  }
}

// Cleanup beams
useIntervalFn(() => {
  const now = Date.now() / 1000
  beams.value = beams.value.filter(b => (now - b.startTime) * ORB_CONFIG.BEAM_SPEED < b.maxDistance + 5)
}, 1000)

defineExpose({ triggerBlock })
</script>

<template>
  <div v-if="graphData" class="size-full">
    <OrbScene
      :nodes="graphData.nodes"
      :links="graphData.links"
      :validator-map="graphData.validatorMap"
      :beams="beams"
      :theme="songTheme"
      :validator-count="validators?.length || 0"
    />
  </div>
  <div v-else class="size-full flex items-center justify-center text-white">
    Loading validators...
  </div>
</template>

export function useValidators() {
  const { isDesktop } = useDevice()
  const blockchain = useBlockchain()

  const { data, status } = useAsyncData('validators', () => blockchain.getValidators(), { server: false })

  const validators = computed(() => data.value?.validators || [])
  const sortedBySlots = computed(() => [...validators.value].sort((a, b) => b.numSlots - a.numSlots))

  const isWiderMobile = useMediaQuery('(min-width: 370px)')
  const maxDisplay = computed(() => isDesktop ? 9 : isWiderMobile.value ? 9 : 7)
  const displayValidators = computed(() => sortedBySlots.value.slice(0, maxDisplay.value))
  const hiddenValidators = computed(() => sortedBySlots.value.slice(maxDisplay.value))
  const remainingCount = computed(() => hiddenValidators.value.length)

  return { validators, sortedBySlots, displayValidators, hiddenValidators, remainingCount, status }
}

interface Validator { address: string, numSlots: number, name?: string, logo?: string }

export function useValidators() {
  const { isDesktop } = useDevice()
  const { data, status } = useFetch<{ count: number, validators: Validator[] }>('/api/validators')

  const validators = computed(() => data.value?.validators || [])
  const sortedBySlots = computed(() => [...validators.value].sort((a, b) => b.numSlots - a.numSlots))

  const isWiderMobile = useMediaQuery('(min-width: 370px)')
  const maxDisplay = computed(() => isDesktop ? 9 : isWiderMobile.value ? 9 : 7)
  const displayValidators = computed(() => sortedBySlots.value.slice(0, maxDisplay.value))
  const hiddenValidators = computed(() => sortedBySlots.value.slice(maxDisplay.value))
  const remainingCount = computed(() => hiddenValidators.value.length)

  // Keep topValidators for backward compatibility with ValidatorsPanel
  const topValidators = computed(() => sortedBySlots.value.slice(0, isDesktop ? 10 : 8))

  return { validators, sortedBySlots, topValidators, displayValidators, hiddenValidators, remainingCount, status }
}

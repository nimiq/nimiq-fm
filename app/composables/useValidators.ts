interface Validator { address: string, numSlots: number, name?: string, logo?: string }

export function useValidators() {
  const { isDesktop } = useDevice()
  const { data, status } = useFetch<{ count: number, validators: Validator[] }>('/api/validators')

  const validators = computed(() => data.value?.validators || [])

  const sortedBySlots = computed(() => [...validators.value].sort((a, b) => b.numSlots - a.numSlots))
  const topValidators = computed(() => sortedBySlots.value.slice(0, isDesktop ? 10 : 8))

  return { validators, sortedBySlots, topValidators, status }
}

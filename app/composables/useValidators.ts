export function useValidators() {
  const { data, status } = useFetch('/api/validator-count')

  const validators = computed(() => data.value?.validators || [])

  const sortedBySlots = computed(() => [...validators.value].sort((a, b) => Number(b.numSlots) - Number(a.numSlots)))
  const topValidators = computed(() => sortedBySlots.value.slice(0, 8))

  return { validators, sortedBySlots, topValidators, status }
}

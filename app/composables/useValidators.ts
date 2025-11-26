interface Validator {
  id: number
  name: string
  address: string
  logo: string
  balance: string
  dominanceRatio: number
}

export function useValidators() {
  const { data: validators, status } = useFetch<Validator[]>('https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false')

  // Filter only active validators (balance > 0) and sort by stake
  const activeValidators = computed(() => (validators.value || []).filter(v => Number(v.balance) > 0))
  const sortedByStake = computed(() => [...activeValidators.value].sort((a, b) => Number(b.balance) - Number(a.balance)))
  const topValidators = computed(() => sortedByStake.value.slice(0, 8))
  const totalStake = computed(() => activeValidators.value.reduce((sum, v) => sum + Number(v.balance), 0))

  return { validators, activeValidators, sortedByStake, topValidators, totalStake, status }
}

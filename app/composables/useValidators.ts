import type { ValidatorAPIResponse } from '~/types/orb'

export function useValidators() {
  const validators = ref<ValidatorAPIResponse[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchValidators = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ValidatorAPIResponse[]>(
        'https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false',
      )
      validators.value = response
    }
    catch (e) {
      error.value = e as Error
      console.error('Failed to fetch validators:', e)
    }
    finally {
      loading.value = false
    }
  }

  const getValidatorByAddress = (address: string) => {
    return validators.value.find(v => v.address === address)
  }

  return { validators: readonly(validators), loading: readonly(loading), error: readonly(error), fetchValidators, getValidatorByAddress }
}

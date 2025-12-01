import { ref } from 'vue'

export const VALIDATOR_COUNT = ref(40)
export const VALIDATOR_ADDRESSES = ref<string[]>([])

export function setValidatorAddresses(addresses: string[]) {
  VALIDATOR_ADDRESSES.value = addresses
  VALIDATOR_COUNT.value = addresses.length
}

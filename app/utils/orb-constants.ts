import { ref } from 'vue'

// Validator state (managed by blockchain, not debug panel)
export const VALIDATOR_COUNT = ref(40)
export const VALIDATOR_ADDRESSES = ref<string[]>([])

export function setValidatorCount(count: number) {
  VALIDATOR_COUNT.value = count
}

export function setValidatorAddresses(addresses: string[]) {
  VALIDATOR_ADDRESSES.value = addresses
  VALIDATOR_COUNT.value = addresses.length
}

// Re-export config values - these are getters that read from useState
// Use these in components that need reactive values
export function getOrbConfig() {
  const { config, beamSpeed } = useOrbConfig()
  return {
    get ORB_RADIUS() { return config.value.orbRadius },
    get NODE_COUNT() { return config.value.nodeCount },

    get BEAM_PROPAGATION_TIME_MS() { return config.value.beamPropagationTimeMs },
    get BEAM_SPEED() { return beamSpeed.value },
    get PEER_LIFETIME_MS() { return config.value.peerLifetimeMs },
    get PEER_TRANSITION_MS() { return config.value.peerTransitionMs },
    get VALIDATOR_ROTATION_SPEED() { return config.value.validatorRotationSpeed },
    get COLOR_BG() { return config.value.colorBg },
    get COLOR_LINK() { return config.value.colorLink },
    get NODE_PALETTE() { return config.value.nodePalette },
    get BEAM_COLOR() { return config.value.beamColor },
    get VALIDATOR_COLOR() { return config.value.validatorColor },
    get EDGE_COLOR() { return config.value.edgeColor },
  }
}

// Legacy exports for backward compatibility (static defaults, not reactive)
export const ORB_RADIUS = 14
export const NODE_COUNT = 800
export const BLOCK_INTERVAL_MS = 1200
export const BEAM_PROPAGATION_TIME_MS = 1000
export const BEAM_SPEED = (ORB_RADIUS * 2.5) / (BEAM_PROPAGATION_TIME_MS / 1000)
export const PEER_LIFETIME_MS = 30000
export const PEER_TRANSITION_MS = 2000
export const VALIDATOR_ROTATION_SPEED = 0.1
export const COLOR_BG = '#0f1e3d'
export const COLOR_LINK = '#64748b'
export const NODE_PALETTE = ['#FFFFFF', '#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8']
export const BEAM_COLOR = '#FF9500'
export const VALIDATOR_COLOR = '#a070e0'
export const EDGE_COLOR = '#d400ff'
export const MOCK_AUDIO_DATA_SIZE = 32

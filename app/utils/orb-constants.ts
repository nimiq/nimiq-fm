import type { OrbConstants } from '~/types/orb'

export const ORB_CONFIG: OrbConstants = {
  VALIDATOR_COUNT: 72,
  ORB_RADIUS: 10,
  VALIDATOR_ROTATION_SPEED: 0.05,
  BEAM_SPEED: 8,
  PEER_LIFETIME_MS: 30000,
  PEER_TRANSITION_MS: 2000,
}

export const THEME_PALETTES = {
  dunesOfDessert: {
    peer: ['#FF6B35', '#F7931E', '#FDC830', '#E63946'],
    beam: '#FF9500',
    ambient: '#4A2C2A',
    pointLight1: '#FF6B35',
    pointLight2: '#F7931E',
  },
  qinim: {
    peer: ['#00E5FF', '#7C4DFF', '#D500F9', '#3D5AFE'],
    beam: '#00E5FF',
    ambient: '#101025',
    pointLight1: '#00E5FF',
    pointLight2: '#7C4DFF',
  },
}

export const DEFAULT_VALIDATOR_COLOR = '#4FC3F7'

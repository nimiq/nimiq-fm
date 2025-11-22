import type * as THREE from 'three'

export type LifeCycleState = 'hidden' | 'spawning' | 'active' | 'dying'

export interface ValidatorNode {
  address: string
  name: string
  balance: number
  accentColor: string
  position: THREE.Vector3
  phi: number
  theta: number
  radius: number
  lastBlockTime: number
}

export interface PeerNode {
  id: number
  targetPosition: THREE.Vector3
  startPosition: THREE.Vector3
  currentPosition: THREE.Vector3
  state: LifeCycleState
  timer: number
  opacity: number
  phi: number
  theta: number
  radius: number
  baseColor: THREE.Color
}

export interface LinkData {
  sourceIndex: number
  targetIndex: number
  isValidatorLink: boolean
  phaseOffset: number
}

export interface Beam {
  id: string
  originAddress: string
  startTime: number
  maxDistance: number
}

export interface OrbConstants {
  VALIDATOR_COUNT: number
  ORB_RADIUS: number
  VALIDATOR_ROTATION_SPEED: number
  BEAM_SPEED: number
  PEER_LIFETIME_MS: number
  PEER_TRANSITION_MS: number
}

export interface ValidatorAPIResponse {
  id: number
  name: string
  address: string
  accentColor: string
  balance: number
  stakers: number
}

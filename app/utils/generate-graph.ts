import type { LinkData, NodeData } from '~/types/orb'
import * as THREE from 'three'
import { NodeType } from '~/types/orb'
import { VALIDATOR_ADDRESSES, VALIDATOR_COUNT } from './orb-constants'

// Helper to get current validator count value
const getValidatorCount = () => VALIDATOR_COUNT.value
const getValidatorAddresses = () => VALIDATOR_ADDRESSES.value

// Extend NodeData to store a specific base color for that node
interface ExtendedNodeData extends NodeData {
  baseColor: THREE.Color
}

export function generateGraph() {
  const { config } = useOrbConfig()
  const nodes: ExtendedNodeData[] = []
  const links: LinkData[] = []

  // Helper to get random palette color
  const getRandomColor = () => new THREE.Color(config.value.nodePalette[Math.floor(Math.random() * config.value.nodePalette.length)])

  const validatorCount = getValidatorCount()
  const validatorAddresses = getValidatorAddresses()
  const orbRadius = config.value.orbRadius
  const nodeCount = config.value.nodeCount
  const peerLifetimeMs = config.value.peerLifetimeMs
  const validatorColor = config.value.validatorColor
  const linkRewireDistance = config.value.linkRewireDistance

  // --- 1. Generate Validators ---
  for (let i = 0; i < validatorCount; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)

    const r = orbRadius * (0.85 + Math.random() * 0.10)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const pos = new THREE.Vector3(x, y, z)

    nodes.push({
      id: i,
      targetPosition: pos,
      startPosition: pos,
      currentPosition: pos.clone(),
      type: NodeType.VALIDATOR,
      connections: [],
      stake: 1.0,
      state: 'ACTIVE',
      timer: 0,
      opacity: 1,
      validatorPhase: Math.random() * Math.PI * 2,
      phi,
      theta,
      radius: r,
      lastBlockTime: -999,
      baseColor: new THREE.Color(validatorColor),
      validatorAddress: validatorAddresses[i],
    })
  }

  // --- 2. Generate Peers ---
  for (let i = validatorCount; i < nodeCount; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = orbRadius * (0.9 + Math.random() * 0.2)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const targetPos = new THREE.Vector3(x, y, z)
    const startPos = targetPos.clone().normalize().multiplyScalar(orbRadius * 1.8)

    const initialLife = Math.random()
    let initialState: 'HIDDEN' | 'SPAWNING' | 'ACTIVE' | 'DYING' = 'HIDDEN'
    let initialTimer = 0
    let initialOpacity = 0
    let currentPos = startPos.clone()

    if (initialLife > 0.1) {
      initialState = 'ACTIVE'
      initialTimer = Math.random() * peerLifetimeMs
      initialOpacity = 1
      currentPos = targetPos.clone()
    }
    else {
      initialTimer = Math.random() * 5000
    }

    nodes.push({
      id: i,
      targetPosition: targetPos,
      startPosition: startPos,
      currentPosition: currentPos,
      type: NodeType.PEER,
      connections: [],
      stake: 1.0,
      state: initialState,
      timer: initialTimer,
      opacity: initialOpacity,
      phi,
      theta,
      radius: r,
      lastBlockTime: 0,
      baseColor: getRandomColor(),
    })
  }

  // --- 3. Generate Links ---
  // Validators Mesh - Full mesh: connect all validators to all other validators
  for (let i = 0; i < validatorCount; i++) {
    for (let j = i + 1; j < validatorCount; j++) {
      nodes[i]!.connections.push(j)
      nodes[j]!.connections.push(i)
      links.push({
        sourceIndex: i,
        targetIndex: j,
        isValidatorLink: true,
        phaseOffset: Math.random() * Math.PI * 2,
        connectionState: 'CONNECTED',
        reconnectProgress: 1.0,
        disconnectTimer: 0,
      })
    }
  }

  // Peers
  for (let i = validatorCount; i < nodeCount; i++) {
    // Connect to nearby validators
    const valCandidates = []
    for (let vIdx = 0; vIdx < validatorCount; vIdx++) {
      const d = nodes[i]!.targetPosition.distanceTo(nodes[vIdx]!.targetPosition)
      valCandidates.push({ id: vIdx, dist: d })
    }
    valCandidates.sort((a, b) => a.dist - b.dist)

    let valConnections = 0
    for (let k = 0; k < valCandidates.length; k++) {
      if (valConnections >= 1)
        break
      const v = valCandidates[k]!
      if (v.dist < orbRadius * 2.5) {
        if (!nodes[i]!.connections.includes(v.id)) {
          nodes[i]!.connections.push(v.id)
          nodes[v.id]!.connections.push(i)
          links.push({
            sourceIndex: v.id,
            targetIndex: i,
            isValidatorLink: false,
            phaseOffset: 0,
            connectionState: 'CONNECTED',
            reconnectProgress: 1.0,
            disconnectTimer: 0,
          })
          valConnections++
        }
      }
    }

    // Connect to nearby peers
    const peerDistances = []
    const scanRange = 60
    const startScan = Math.max(validatorCount, i - scanRange)
    const endScan = Math.min(nodeCount, i + scanRange)

    for (let j = startScan; j < endScan; j++) {
      if (i === j)
        continue
      peerDistances.push({ id: j, dist: nodes[i]!.targetPosition.distanceTo(nodes[j]!.targetPosition) })
    }
    peerDistances.sort((a, b) => a.dist - b.dist)

    let peerConnections = 0
    for (let k = 0; k < 8; k++) {
      if (peerConnections >= 2)
        break
      if (k >= peerDistances.length)
        break
      const targetId = peerDistances[k]!.id
      if (peerDistances[k]!.dist > linkRewireDistance)
        continue
      if (!nodes[i]!.connections.includes(targetId)) {
        nodes[i]!.connections.push(targetId)
        nodes[targetId]!.connections.push(i)
        links.push({
          sourceIndex: i,
          targetIndex: targetId,
          isValidatorLink: false,
          phaseOffset: 0,
          connectionState: 'CONNECTED',
          reconnectProgress: 1.0,
          disconnectTimer: 0,
        })
        peerConnections++
      }
    }
  }

  return { nodes, links }
}

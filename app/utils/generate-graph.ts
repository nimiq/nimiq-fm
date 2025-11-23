import * as THREE from 'three'
import type { ValidatorNode, PeerNode, LinkData, ValidatorAPIResponse } from '~/types/orb'
import { ORB_CONFIG, DEFAULT_VALIDATOR_COLOR } from './orb-constants'

export function generateGraph(validators: ValidatorAPIResponse[], peerCount: number) {
  const nodes: Array<ValidatorNode | PeerNode> = []
  const links: LinkData[] = []
  const validatorMap = new Map<string, number>()

  const palette = ['#F5F5F5', '#CFD8DC', '#B0BEC5', '#90CAF9', '#B39DDB']

  // Generate validators
  for (let i = 0; i < validators.length; i++) {
    const v = validators[i]
    const u = Math.random()
    const vSphere = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * vSphere - 1)
    const r = ORB_CONFIG.ORB_RADIUS * (0.85 + Math.random() * 0.10)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const pos = new THREE.Vector3(x, y, z)

    const node: ValidatorNode = {
      address: v.address,
      name: v.name,
      balance: v.balance,
      accentColor: v.accentColor || DEFAULT_VALIDATOR_COLOR,
      position: pos,
      phi,
      theta,
      radius: r,
      lastBlockTime: -999,
    }

    nodes.push(node)
    validatorMap.set(v.address, i)
  }

  // Generate peers
  for (let i = validators.length; i < validators.length + peerCount; i++) {
    const u = Math.random()
    const vSphere = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * vSphere - 1)
    const r = ORB_CONFIG.ORB_RADIUS * (0.85 + Math.random() * 0.15)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const targetPos = new THREE.Vector3(x, y, z)
    const startPos = targetPos.clone().normalize().multiplyScalar(ORB_CONFIG.ORB_RADIUS * 1.5)

    const initialLife = Math.random()
    let initialState: 'hidden' | 'spawning' | 'active' | 'dying' = 'hidden'
    let initialTimer = 0
    let initialOpacity = 0
    let currentPos = startPos.clone()

    if (initialLife > 0.1) {
      initialState = 'active'
      initialTimer = Math.random() * ORB_CONFIG.PEER_LIFETIME_MS
      initialOpacity = 1
      currentPos = targetPos.clone()
    }
    else {
      initialTimer = Math.random() * 5000
    }

    const node: PeerNode = {
      id: i,
      targetPosition: targetPos,
      startPosition: startPos,
      currentPosition: currentPos,
      state: initialState,
      timer: initialTimer,
      opacity: initialOpacity,
      linkOpacity: initialOpacity,
      phi,
      theta,
      radius: r,
      baseColor: new THREE.Color(palette[Math.floor(Math.random() * palette.length)]),
    }

    nodes.push(node)
  }

  // Generate validator mesh links
  for (let i = 0; i < validators.length; i++) {
    const distances = []
    for (let j = 0; j < validators.length; j++) {
      if (i === j) continue
      const n1 = nodes[i] as ValidatorNode
      const n2 = nodes[j] as ValidatorNode
      distances.push({ id: j, dist: n1.position.distanceTo(n2.position) })
    }
    distances.sort((a, b) => a.dist - b.dist)

    const connectionCount = 2
    for (let k = 0; k < connectionCount && k < distances.length; k++) {
      const targetId = distances[k].id
      if (!links.find(l => (l.sourceIndex === i && l.targetIndex === targetId) || (l.sourceIndex === targetId && l.targetIndex === i))) {
        links.push({
          sourceIndex: Math.min(i, targetId),
          targetIndex: Math.max(i, targetId),
          isValidatorLink: true,
          phaseOffset: Math.random() * Math.PI * 2,
        })
      }
    }
  }

  // Generate peer connections
  for (let i = validators.length; i < nodes.length; i++) {
    const node = nodes[i] as PeerNode

    // Connect to nearby validators
    const valCandidates = []
    for (let vIdx = 0; vIdx < validators.length; vIdx++) {
      const vNode = nodes[vIdx] as ValidatorNode
      const d = node.targetPosition.distanceTo(vNode.position)
      valCandidates.push({ id: vIdx, dist: d })
    }
    valCandidates.sort((a, b) => a.dist - b.dist)

    let valConnections = 0
    for (let k = 0; k < valCandidates.length && valConnections < 1; k++) {
      const v = valCandidates[k]
      if (v.dist < ORB_CONFIG.ORB_RADIUS * 2.0) {
        links.push({ sourceIndex: v.id, targetIndex: i, isValidatorLink: false, phaseOffset: 0 })
        valConnections++
      }
    }

    // Connect to nearby peers
    const peerDistances = []
    const scanRange = 60
    const startScan = Math.max(validators.length, i - scanRange)
    const endScan = Math.min(nodes.length, i + scanRange)

    for (let j = startScan; j < endScan; j++) {
      if (i === j) continue
      const pNode = nodes[j] as PeerNode
      peerDistances.push({ id: j, dist: node.targetPosition.distanceTo(pNode.targetPosition) })
    }
    peerDistances.sort((a, b) => a.dist - b.dist)

    let peerConnections = 0
    for (let k = 0; k < 8 && peerConnections < 2 && k < peerDistances.length; k++) {
      const targetId = peerDistances[k].id
      if (peerDistances[k].dist > 5.0) continue
      links.push({ sourceIndex: i, targetIndex: targetId, isValidatorLink: false, phaseOffset: 0 })
      peerConnections++
    }
  }

  return { nodes, links, validatorMap }
}

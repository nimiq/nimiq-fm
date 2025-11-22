<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import * as THREE from 'three'
import type { ValidatorNode, PeerNode, LinkData, Beam } from '~/types/orb'
import { ORB_CONFIG, THEME_PALETTES } from '~/utils/orb-constants'

const props = defineProps<{
  nodes: Array<ValidatorNode | PeerNode>
  links: LinkData[]
  validatorMap: Map<string, number>
  beams: Beam[]
  theme: 'dunesOfDessert' | 'qinim'
  validatorCount: number
}>()

const nodesMeshRef = shallowRef<THREE.InstancedMesh>()
const linesRef = shallowRef<THREE.LineSegments>()
const groupRef = shallowRef<THREE.Group>()

const tempColor = new THREE.Color()
const tempMatrix = new THREE.Matrix4()
const beamColor = new THREE.Color(THEME_PALETTES[props.theme].beam)

// Initialize line buffers
watchEffect(() => {
  if (!linesRef.value || !props.links.length) return
  const positions = new Float32Array(props.links.length * 6)
  const colors = new Float32Array(props.links.length * 6)
  linesRef.value.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  linesRef.value.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
})

const { onLoop } = useRenderLoop()

onLoop(({ delta, elapsed }) => {
  if (!nodesMeshRef.value || !linesRef.value || !props.nodes.length) return

  const linePositions = linesRef.value.geometry.getAttribute('position') as THREE.BufferAttribute
  const lineColors = linesRef.value.geometry.getAttribute('color') as THREE.BufferAttribute
  if (!linePositions || !lineColors) return

  const time = elapsed
  const dt = delta * 1000

  if (groupRef.value) groupRef.value.rotation.y += delta * 0.04

  // Update nodes
  for (let i = 0; i < props.nodes.length; i++) {
    const n = props.nodes[i]

    // Motion
    const noiseX = Math.sin(time * 0.5 + i) * 0.08
    const noiseY = Math.cos(time * 0.3 + i) * 0.08
    const noiseZ = Math.sin(time * 0.4 + i) * 0.08

    if ('address' in n) {
      // Validator
      n.theta += ORB_CONFIG.VALIDATOR_ROTATION_SPEED * delta
      const x = n.radius * Math.sin(n.phi) * Math.cos(n.theta)
      const y = n.radius * Math.sin(n.phi) * Math.sin(n.theta)
      const z = n.radius * Math.cos(n.phi)
      n.position.set(x + noiseX, y + noiseY, z + noiseZ)
    }
    else {
      // Peer
      n.timer -= dt
      if (n.state === 'active') {
        n.currentPosition.copy(n.targetPosition)
        n.currentPosition.x += noiseX
        n.currentPosition.y += noiseY
        n.currentPosition.z += noiseZ
        n.opacity = 1
        if (n.timer <= 0) { n.state = 'dying'; n.timer = ORB_CONFIG.PEER_TRANSITION_MS }
      }
      else if (n.state === 'hidden') {
        if (n.timer <= 0) {
          n.state = 'spawning'
          n.timer = ORB_CONFIG.PEER_TRANSITION_MS
          n.startPosition.copy(n.targetPosition).normalize().multiplyScalar(ORB_CONFIG.ORB_RADIUS * 1.4)
          n.currentPosition.copy(n.startPosition)
        }
      }
      else if (n.state === 'spawning') {
        const p = 1 - (n.timer / ORB_CONFIG.PEER_TRANSITION_MS)
        n.currentPosition.lerpVectors(n.startPosition, n.targetPosition, 1 - Math.pow(1 - p, 3))
        n.opacity = p
        if (n.timer <= 0) { n.state = 'active'; n.timer = ORB_CONFIG.PEER_LIFETIME_MS + Math.random() * 5000 }
      }
      else if (n.state === 'dying') {
        const p = n.timer / ORB_CONFIG.PEER_TRANSITION_MS
        n.opacity = p
        if (n.timer <= 0) { n.state = 'hidden'; n.timer = Math.random() * 5000 }
      }
    }

    // Beam intensity
    let beamIntensity = 0
    const opacity = 'opacity' in n ? n.opacity : 1
    if (opacity > 0.01) {
      for (const beam of props.beams) {
        const validatorIdx = props.validatorMap.get(beam.originAddress)
        if (validatorIdx === undefined) continue
        const originNode = props.nodes[validatorIdx]
        const pos = 'address' in originNode ? originNode.position : originNode.currentPosition
        const dist = ('address' in n ? n.position : n.currentPosition).distanceTo(pos)
        const waveDist = (time - beam.startTime) * ORB_CONFIG.BEAM_SPEED
        const waveWidth = 8.0

        if (dist < waveDist && dist > waveDist - waveWidth) {
          const p = 1 - (waveDist - dist) / waveWidth
          beamIntensity = Math.max(beamIntensity, Math.pow(p, 2))
        }
      }
    }

    // Block flash
    let blockFlash = 0
    if ('address' in n) {
      const timeSinceBlock = time - n.lastBlockTime
      if (timeSinceBlock < 1.5 && timeSinceBlock >= 0) {
        blockFlash = Math.pow(1 - (timeSinceBlock / 1.5), 3)
      }
    }

    // Scale
    let scale = 'address' in n ? 2.2 : 0.4
    if (beamIntensity > 0) scale *= (1 + beamIntensity * 0.8)
    if (blockFlash > 0) scale *= (1 + blockFlash * 0.5)
    scale *= opacity
    if (scale < 0.01) scale = 0

    tempMatrix.makeScale(scale, scale, scale)
    const pos = 'address' in n ? n.position : n.currentPosition
    tempMatrix.setPosition(pos)
    nodesMeshRef.value.setMatrixAt(i, tempMatrix)

    // Color
    if (blockFlash > 0) {
      tempColor.copy(beamColor).lerp('address' in n ? new THREE.Color(n.accentColor) : n.baseColor, 0.3)
      tempColor.multiplyScalar(3 + blockFlash * 20.0)
    }
    else if (beamIntensity > 0) {
      tempColor.copy(beamColor)
      tempColor.multiplyScalar(2 + beamIntensity * 15.0)
    }
    else {
      tempColor.copy('address' in n ? new THREE.Color(n.accentColor) : n.baseColor)
      tempColor.multiplyScalar('address' in n ? 3.0 : 1.5)
    }

    nodesMeshRef.value.setColorAt(i, tempColor)
  }

  nodesMeshRef.value.instanceMatrix.needsUpdate = true
  if (nodesMeshRef.value.instanceColor) nodesMeshRef.value.instanceColor.needsUpdate = true

  // Update links
  for (let i = 0; i < props.links.length; i++) {
    const link = props.links[i]
    const n1 = props.nodes[link.sourceIndex]
    const n2 = props.nodes[link.targetIndex]
    const pos1 = 'address' in n1 ? n1.position : n1.currentPosition
    const pos2 = 'address' in n2 ? n2.position : n2.currentPosition
    const dist = pos1.distanceTo(pos2)

    const op1 = 'opacity' in n1 ? n1.opacity : 1
    const op2 = 'opacity' in n2 ? n2.opacity : 1
    let alpha = Math.min(op1, op2)
    if (dist > 7.0) alpha = 0

    if (alpha < 0.01) {
      linePositions.setXYZ(i * 2, 0, 0, 0)
      linePositions.setXYZ(i * 2 + 1, 0, 0, 0)
      continue
    }

    linePositions.setXYZ(i * 2, pos1.x, pos1.y, pos1.z)
    linePositions.setXYZ(i * 2 + 1, pos2.x, pos2.y, pos2.z)

    // Beam on link
    let beamHit = 0
    const mid = new THREE.Vector3().lerpVectors(pos1, pos2, 0.5)
    for (const beam of props.beams) {
      const validatorIdx = props.validatorMap.get(beam.originAddress)
      if (validatorIdx === undefined) continue
      const originNode = props.nodes[validatorIdx]
      const origin = 'address' in originNode ? originNode.position : originNode.currentPosition
      const d = mid.distanceTo(origin)
      const waveDist = (time - beam.startTime) * ORB_CONFIG.BEAM_SPEED
      if (d < waveDist && d > waveDist - 6.0) {
        beamHit = Math.max(beamHit, 1 - (waveDist - d) / 6.0)
      }
    }

    if (beamHit > 0) {
      tempColor.copy(beamColor)
      tempColor.multiplyScalar(2 + beamHit * 10.0)
    }
    else {
      tempColor.set('#4FC3F7')
      tempColor.multiplyScalar(link.isValidatorLink ? 2.0 : 1.5)
    }

    tempColor.multiplyScalar(alpha)
    lineColors.setXYZ(i * 2, tempColor.r, tempColor.g, tempColor.b)
    lineColors.setXYZ(i * 2 + 1, tempColor.r, tempColor.g, tempColor.b)
  }

  linePositions.needsUpdate = true
  lineColors.needsUpdate = true
})
</script>

<template>
  <TresGroup ref="groupRef">
    <TresInstancedMesh ref="nodesMeshRef" :args="[undefined, undefined, nodes.length]">
      <TresSphereGeometry :args="[0.15, 16, 16]" />
      <TresMeshStandardMaterial :tone-mapped="false" :roughness="0.9" :metalness="0.1" emissive="#000000" :emissive-intensity="0" />
    </TresInstancedMesh>

    <TresLineSegments ref="linesRef">
      <TresBufferGeometry />
      <TresLineBasicMaterial vertex-colors :transparent="true" :opacity="0.4" :blending="THREE.AdditiveBlending" :depth-write="false" :tone-mapped="false" />
    </TresLineSegments>
  </TresGroup>
</template>

<script setup lang="ts">
import type { Beam, LinkData, NodeData } from '~/types/orb'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { onMounted, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { NodeType } from '~/types/orb'
import { generateGraph } from '~/utils/generate-graph'
import {
  BEAM_COLOR,
  BEAM_SPEED,
  BLOCK_INTERVAL_MS,
  COLOR_LINK,
  NODE_COUNT,
  ORB_RADIUS,
  PEER_LIFETIME_MS,
  PEER_TRANSITION_MS,
  VALIDATOR_COUNT,
  VALIDATOR_ROTATION_SPEED,
} from '~/utils/orb-constants'

const props = defineProps<{
  audioData: number
}>()

// Generate Graph
const graphData = shallowRef<{ nodes: NodeData[], links: LinkData[] } | null>(null)
watchEffect(() => {
  graphData.value = generateGraph()
})

const nodesMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const beamMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const linesRef = shallowRef<THREE.LineSegments | null>(null)
const groupRef = shallowRef<THREE.Group | null>(null)
const beams = ref<Beam[]>([])

const tempColor = new THREE.Color()
const tempMatrix = new THREE.Matrix4()
const tempStart = new THREE.Vector3()
const tempEnd = new THREE.Vector3()
const cLink = new THREE.Color(COLOR_LINK)
const cBeam = new THREE.Color(BEAM_COLOR)

// Initialize Line Buffers
watchEffect(() => {
  if (!linesRef.value || !graphData.value)
    return
})

watch(linesRef, (lines) => {
  if (lines && graphData.value) {
    const { links } = graphData.value
    const positions = new Float32Array(links.length * 6)
    const colors = new Float32Array(links.length * 6)
    lines.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    lines.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }
})

// Block Generator
let blockInterval: ReturnType<typeof setInterval>
onMounted(() => {
  blockInterval = setInterval(() => {
    const now = Date.now() / 1000
    const randomValidatorIdx = Math.floor(Math.random() * VALIDATOR_COUNT)
    if (graphData.value) {
      graphData.value.nodes[randomValidatorIdx]!.lastBlockTime = now
    }
    const newBeam: Beam = {
      id: Math.random().toString(36).slice(2),
      originIndex: randomValidatorIdx,
      startTime: now,
      maxDistance: ORB_RADIUS * 2.2,
    }
    beams.value = [...beams.value, newBeam]
  }, BLOCK_INTERVAL_MS)
})

onUnmounted(() => {
  clearInterval(blockInterval)
})

// Cleanup beams
const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  // Cleanup beams
  const currentTime = Date.now() / 1000
  beams.value = beams.value.filter(b => (currentTime - b.startTime) * BEAM_SPEED < b.maxDistance + 5)

  if (!graphData.value || !nodesMeshRef.value || !linesRef.value)
    return

  const linePositions = linesRef.value.geometry.getAttribute('position') as THREE.BufferAttribute
  const lineColors = linesRef.value.geometry.getAttribute('color') as THREE.BufferAttribute
  if (!linePositions || !lineColors)
    return

  const { nodes, links } = graphData.value
  const time = currentTime
  const dt = delta * 1000

  if (groupRef.value)
    groupRef.value.rotation.y += delta * 0.02

  // 1. Dynamic Rewiring
  if (Math.random() > 0.2) {
    const linkIdx = Math.floor(Math.random() * links.length)
    const link = links[linkIdx]
    if (link && !link.isValidatorLink && nodes[link.sourceIndex]!.state === 'ACTIVE' && link.connectionState === 'CONNECTED') {
      const candidateId = VALIDATOR_COUNT + Math.floor(Math.random() * (NODE_COUNT - VALIDATOR_COUNT))
      if (candidateId !== link.sourceIndex && candidateId !== link.targetIndex) {
        const dist = nodes[link.sourceIndex]!.currentPosition.distanceTo(nodes[candidateId]!.currentPosition)
        if (dist < 6.0)
          link.targetIndex = candidateId
      }
    }
  }

  // 2. Update Nodes
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!

    // --- Motion ---
    const noiseX = Math.sin(time * 0.5 + n.id) * 0.05
    const noiseY = Math.cos(time * 0.3 + n.id) * 0.05
    const noiseZ = Math.sin(time * 0.4 + n.id) * 0.05

    if (n.type === NodeType.VALIDATOR) {
      n.theta += VALIDATOR_ROTATION_SPEED * delta
      const x = n.radius * Math.sin(n.phi) * Math.cos(n.theta)
      const y = n.radius * Math.sin(n.phi) * Math.sin(n.theta)
      const z = n.radius * Math.cos(n.phi)
      n.currentPosition.set(x + noiseX, y + noiseY, z + noiseZ)
      n.opacity = 1
    }
    else {
      n.timer -= dt
      if (n.state === 'ACTIVE') {
        n.currentPosition.copy(n.targetPosition)
        n.currentPosition.x += noiseX
        n.currentPosition.y += noiseY
        n.currentPosition.z += noiseZ
        n.opacity = 1
        if (n.timer <= 0) { n.state = 'DYING'; n.timer = PEER_TRANSITION_MS }
      }
      else if (n.state === 'HIDDEN') {
        if (n.timer <= 0) {
          n.state = 'SPAWNING'; n.timer = PEER_TRANSITION_MS
          n.startPosition.copy(n.targetPosition).normalize().multiplyScalar(ORB_RADIUS * 1.6)
          n.currentPosition.copy(n.startPosition)
        }
      }
      else if (n.state === 'SPAWNING') {
        const p = 1 - (n.timer / PEER_TRANSITION_MS)
        n.currentPosition.lerpVectors(n.startPosition, n.targetPosition, 1 - (1 - p) ** 3)
        n.opacity = p
        if (n.timer <= 0) { n.state = 'ACTIVE'; n.timer = PEER_LIFETIME_MS + Math.random() * 5000 }
      }
      else if (n.state === 'DYING') {
        const p = n.timer / PEER_TRANSITION_MS
        // Move back to start position (outwards)
        n.currentPosition.lerpVectors(n.startPosition, n.targetPosition, 1 - (1 - p) ** 3)
        n.opacity = p
        if (n.timer <= 0) { n.state = 'HIDDEN'; n.timer = Math.random() * 5000 }
      }
    }

    // --- Beams Logic with Softer Decay ---
    let beamIntensity = 0
    if (n.opacity > 0.01) {
      for (const beam of beams.value) {
        const dist = n.currentPosition.distanceTo(nodes[beam.originIndex]!.currentPosition)
        const waveDist = (time - beam.startTime) * BEAM_SPEED
        const waveWidth = 8.0

        if (dist < waveDist && dist > waveDist - waveWidth) {
          const p = 1 - (waveDist - dist) / waveWidth

          // DECAY: Smoother fade.
          const ratio = dist / beam.maxDistance
          const decay = Math.max(0, 1 - ratio)

          // Reduce overall intensity (0.6 multiplier) so it's less dominant
          beamIntensity = Math.max(beamIntensity, p ** 2 * decay * 0.6)
        }
      }
    }

    // --- Validator Flash (Growing Glow Effect) ---
    let blockFlash = 0

    if (n.type === NodeType.VALIDATOR) {
      const timeSinceBlock = time - n.lastBlockTime
      // A 2-second lifecycle for the flash
      const flashDuration = 2.0
      const growTime = 0.4 // 0.4s to fully grow

      if (timeSinceBlock >= 0 && timeSinceBlock < flashDuration) {
        if (timeSinceBlock < growTime) {
          // Growth Phase: Smooth sine easing for a natural "swell"
          const t = timeSinceBlock / growTime
          blockFlash = Math.sin(t * Math.PI * 0.5)
        }
        else {
          // Decay Phase: Linear fade out
          const t = (timeSinceBlock - growTime) / (flashDuration - growTime)
          blockFlash = 1 - t
        }
      }
    }

    // --- Matrix & Scale ---
    let scale = 0.25
    if (n.type === NodeType.VALIDATOR)
      scale = 0.9 // Validators larger

    // Scale modification for beam hit
    if (beamIntensity > 0)
      scale *= (1 + beamIntensity * 0.2)

    // Scale modification for block generation
    // "Growing glow that doesn't grow much": limit scale increase to ~35%
    if (blockFlash > 0)
      scale *= (1 + blockFlash * 0.35)

    scale *= n.opacity
    if (scale < 0.01)
      scale = 0

    tempMatrix.makeScale(scale, scale, scale)
    tempMatrix.setPosition(n.currentPosition)

    // Rotation for "Gem" look
    const rot = (time * 0.5) + (n.id * 1.1)
    tempMatrix.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot, rot, rot)))

    nodesMeshRef.value.setMatrixAt(i, tempMatrix)

    // --- Color Logic ---
    if (blockFlash > 0) {
      // Source of Energy: Intense White
      tempColor.setHex(0xFFFFFF)
      // "Easy to spot": significant brightness boost for bloom
      // Base 1.5 + variable 5.5 = max 7.0 (Very bright, triggers bloom halo)
      // This creates the "glow" without physically growing the mesh too much.
      tempColor.multiplyScalar(1.5 + blockFlash * 5.5)
    }
    else if (beamIntensity > 0) {
      // Beam hit - White but softer
      tempColor.copy(cBeam)
      const intensity = 1 + beamIntensity * 8.0
      tempColor.multiplyScalar(intensity)
    }
    else {
      // Standard State
      if (n.baseColor)
        tempColor.copy(n.baseColor)
      if (n.type === NodeType.VALIDATOR) {
        tempColor.multiplyScalar(1.2)
      }
      else {
        tempColor.multiplyScalar(0.8)
      }
    }

    nodesMeshRef.value.setColorAt(i, tempColor)
  }

  nodesMeshRef.value.instanceMatrix.needsUpdate = true
  if (nodesMeshRef.value.instanceColor)
    nodesMeshRef.value.instanceColor.needsUpdate = true

  // 3. Update Links
  for (let i = 0; i < links.length; i++) {
    const link = links[i]!

    // --- Network Instability Simulation ---
    if (!link.isValidatorLink) {
      if (link.connectionState === 'CONNECTED') {
        // Random chance to drop connection
        if (Math.random() < 0.0003) {
          link.connectionState = 'DISCONNECTED'
          link.disconnectTimer = 1.0 + Math.random() * 2.0 // 1-3s downtime
          link.reconnectProgress = 0
        }
      }
      else if (link.connectionState === 'DISCONNECTED') {
        link.disconnectTimer -= delta
        if (link.disconnectTimer <= 0) {
          link.connectionState = 'RECONNECTING'
        }
      }
      else if (link.connectionState === 'RECONNECTING') {
        // Grow connection back
        link.reconnectProgress += delta * 1.5 // ~0.7s to reconnect
        if (link.reconnectProgress >= 1) {
          link.reconnectProgress = 1
          link.connectionState = 'CONNECTED'
        }
      }
    }
    else {
      // Validators always connected
      link.reconnectProgress = 1.0
    }

    const n1 = nodes[link.sourceIndex]!
    const n2 = nodes[link.targetIndex]!

    const dist = n1.currentPosition.distanceTo(n2.currentPosition)
    let alpha = Math.min(n1.opacity, n2.opacity)
    if (dist > 7.0)
      alpha = 0

    // Skip rendering if fully disconnected or nodes invisible
    if (link.reconnectProgress < 0.01 || alpha < 0.01) {
      linePositions.setXYZ(i * 2, 0, 0, 0); linePositions.setXYZ(i * 2 + 1, 0, 0, 0)

      // Hide beam instance if link is hidden
      if (beamMeshRef.value) {
        tempMatrix.makeScale(0, 0, 0)
        beamMeshRef.value.setMatrixAt(i, tempMatrix)
      }
      continue
    }

    // Calculate geometry: Grow line from Source to Target based on reconnectProgress
    let startX = n1.currentPosition.x
    let startY = n1.currentPosition.y
    let startZ = n1.currentPosition.z

    let endX = n2.currentPosition.x
    let endY = n2.currentPosition.y
    let endZ = n2.currentPosition.z

    // Retraction for dying nodes (Close connections nicely)
    if (n1.state === 'DYING') {
      const t = 1 - n1.opacity // 0 -> 1
      startX += (endX - startX) * t
      startY += (endY - startY) * t
      startZ += (endZ - startZ) * t
    }
    if (n2.state === 'DYING') {
      const t = 1 - n2.opacity // 0 -> 1
      endX += (startX - endX) * t
      endY += (startY - endY) * t
      endZ += (startZ - endZ) * t
    }

    // Reconnect Progress (Network Instability)
    if (link.reconnectProgress < 1.0) {
      endX = startX + (endX - startX) * link.reconnectProgress
      endY = startY + (endY - startY) * link.reconnectProgress
      endZ = startZ + (endZ - startZ) * link.reconnectProgress
    }

    linePositions.setXYZ(i * 2, startX, startY, startZ)
    linePositions.setXYZ(i * 2 + 1, endX, endY, endZ)

    // Beam on link
    let beamHit = 0

    // Skip beams for spawning nodes
    if (n1.state !== 'SPAWNING' && n2.state !== 'SPAWNING') {
      const mid = new THREE.Vector3(startX + (endX - startX) * 0.5, startY + (endY - startY) * 0.5, startZ + (endZ - startZ) * 0.5)

      // Calculate standard link color
      for (const beam of beams.value) {
        const origin = nodes[beam.originIndex]!.currentPosition
        const d = mid.distanceTo(origin)
        const waveDist = (time - beam.startTime) * BEAM_SPEED
        // Make wave wider for the "thick" beam effect
        const waveWidth = 10.0

        if (d < waveDist && d > waveDist - waveWidth) {
          // Calculate progress through the wave (0 to 1)
          const progress = 1 - (waveDist - d) / waveWidth

          // Sine wave for thickness: starts at 0, peaks at 1, ends at 0
          const thicknessPulse = Math.sin(progress * Math.PI)

          const decay = Math.max(0, 1 - (d / beam.maxDistance))
          beamHit = Math.max(beamHit, thicknessPulse * decay)
        }
      }
    }

    if (beamHit > 0.01) {
      // Update Beam Instance
      tempStart.set(startX, startY, startZ)
      tempEnd.set(endX, endY, endZ)

      const len = tempStart.distanceTo(tempEnd)

      // Align cylinder to link
      const sub = new THREE.Vector3().subVectors(tempEnd, tempStart)
      const up = new THREE.Vector3(0, 1, 0)
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, sub.normalize())

      // Scale: Thickness based on beamHit, Length matches link
      // Reduced thickness as requested (0.8 multiplier)
      const thickness = beamHit * 0.8

      tempMatrix.makeRotationFromQuaternion(quaternion)
      tempMatrix.scale(new THREE.Vector3(thickness, len, thickness))
      tempMatrix.setPosition(new THREE.Vector3((startX + endX) / 2, (startY + endY) / 2, (startZ + endZ) / 2))

      if (beamMeshRef.value) {
        beamMeshRef.value.setMatrixAt(i, tempMatrix)

        // Color: Beam Color but brighter
        tempColor.copy(cBeam)
        tempColor.multiplyScalar(1.2) // Reduced glow intensity
        beamMeshRef.value.setColorAt(i, tempColor)
      }
    }
    else {
      // Hide beam instance
      tempMatrix.makeScale(0, 0, 0)
      if (beamMeshRef.value)
        beamMeshRef.value.setMatrixAt(i, tempMatrix)
    }

    if (beamHit > 0) {
      tempColor.copy(cBeam)
      tempColor.multiplyScalar(0.5 + beamHit * 3.0) // softer beam on links
    }
    else {
      tempColor.copy(cLink)
      if (link.isValidatorLink) {
        tempColor.multiplyScalar(1.5)
      }
      else {
        tempColor.multiplyScalar(0.8)
      }
    }
    tempColor.multiplyScalar(alpha)

    // Set Colors
    // Start point is always the standard link color
    lineColors.setXYZ(i * 2, tempColor.r, tempColor.g, tempColor.b)

    // End point: If Reconnecting, highlight tip (Bright White)
    if (link.connectionState === 'RECONNECTING') {
      lineColors.setXYZ(i * 2 + 1, 1.0, 1.0, 1.0)
    }
    else {
      lineColors.setXYZ(i * 2 + 1, tempColor.r, tempColor.g, tempColor.b)
    }
  }

  if (beamMeshRef.value) {
    beamMeshRef.value.instanceMatrix.needsUpdate = true
    if (beamMeshRef.value.instanceColor)
      beamMeshRef.value.instanceColor.needsUpdate = true
  }

  linePositions.needsUpdate = true
  lineColors.needsUpdate = true
})
</script>

<template>
  <TresGroup ref="groupRef">
    <TresInstancedMesh ref="nodesMeshRef" :args="[undefined, undefined, NODE_COUNT]">
      <TresDodecahedronGeometry :args="[0.32, 0]" />
      <TresMeshStandardMaterial
        :tone-mapped="false"
        :roughness="0.2"
        :metalness="0.0"
        :flat-shading="true"
        emissive="#ffffff"
        :emissive-intensity="0.4"
        color="#666666"
      />
    </TresInstancedMesh>

    <!-- Energy Beams (Thick Links) -->
    <TresInstancedMesh ref="beamMeshRef" :args="[undefined, undefined, 5000]" :count="graphData?.links.length || 0">
      <TresCylinderGeometry :args="[0.1, 0.1, 1, 6, 1]" />
      <TresMeshBasicMaterial
        :color="BEAM_COLOR"
        transparent
        :opacity="0.6"
        :blending="THREE.AdditiveBlending"
        :depth-write="false"
        :tone-mapped="false"
      />
    </TresInstancedMesh>

    <TresLineSegments ref="linesRef">
      <TresBufferGeometry />
      <TresLineBasicMaterial
        vertex-colors
        transparent
        :opacity="0.3"
        :blending="THREE.AdditiveBlending"
        :depth-write="false"
        :tone-mapped="false"
      />
    </TresLineSegments>
  </TresGroup>
</template>

<script setup lang="ts">
import type { Beam, LinkData, NodeData } from '~/types/orb'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { useBlockchain } from '~/composables/useBlockchain'
import { NodeType } from '~/types/orb'
import { generateGraph } from '~/utils/generate-graph'
import { VALIDATOR_COUNT } from '~/utils/orb-constants'

defineProps<{ audioData: number }>()

const { config, updateMetrics, graphVersion, beamSpeed } = useOrbConfig()

// FPS tracking
let lastFpsUpdate = 0
let frameCount = 0
let currentFps = 0

// Helper to get current validator count
const getValidatorCount = () => VALIDATOR_COUNT.value

// Generate Graph
const graphData = shallowRef<{ nodes: NodeData[], links: LinkData[] } | null>(null)
if (import.meta.client) {
  graphData.value = generateGraph()
}

// Regenerate graph when graphVersion changes (triggered by debug panel)
watch(graphVersion, () => {
  if (import.meta.client) {
    graphData.value = generateGraph()
  }
})

const nodesMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const nodeHaloMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const beamMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const beamGlowMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const beamMidGlowMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const linesRef = shallowRef<THREE.LineSegments | null>(null)
const groupRef = shallowRef<THREE.Group | null>(null)
const beams = ref<Beam[]>([])

// Create bumpy Sphere geometry for ball-like nodes with noise
const bumpySphereGeometry = (() => {
  const geometry = new THREE.SphereGeometry(0.32, 32, 24)
  const positionAttr = geometry.getAttribute('position')
  const vertex = new THREE.Vector3()

  // Simple 3D noise function for displacement
  const noise3D = (x: number, y: number, z: number) => {
    const freq = 4.0
    return (
      Math.sin(x * freq) * Math.cos(y * freq * 1.3) * Math.sin(z * freq * 0.8) * 0.5
      + Math.sin(x * freq * 2.1 + 1.3) * Math.cos(z * freq * 1.7) * 0.25
      + Math.cos(y * freq * 2.5 + 0.7) * Math.sin(x * freq * 1.9) * 0.25
    )
  }

  // Displace vertices along their normals based on noise
  for (let i = 0; i < positionAttr.count; i++) {
    vertex.fromBufferAttribute(positionAttr, i)
    const normal = vertex.clone().normalize()
    const noiseValue = noise3D(vertex.x * 3, vertex.y * 3, vertex.z * 3)
    const displacement = 0.03 + noiseValue * 0.025 // Subtle bumps
    vertex.addScaledVector(normal, displacement)
    positionAttr.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  geometry.computeVertexNormals()
  return geometry
})()

// Halo Sphere Geometry (larger, lower poly for performance)
const haloSphereGeometry = new THREE.SphereGeometry(0.3, 16, 12)

// Number of segments per curved link (constant - changing requires buffer rebuild)
const CURVE_SEGMENTS = 4

// Pre-allocated objects to avoid garbage collection in render loop
const tempColor = new THREE.Color()
const tempMatrix = new THREE.Matrix4()
const tempStart = new THREE.Vector3()
const tempEnd = new THREE.Vector3()
const cLink = new THREE.Color()
const cBeam = new THREE.Color()

// Additional pre-allocated objects for render loop optimization
const tempQuaternion = new THREE.Quaternion()
const tempEuler = new THREE.Euler()
const tempVec3 = new THREE.Vector3()
const tempVec3_2 = new THREE.Vector3()
const tempScale = new THREE.Vector3()
const tempRotMatrix = new THREE.Matrix4()
const glowMatrix = new THREE.Matrix4()
const midGlowMatrix = new THREE.Matrix4()
const upVector = new THREE.Vector3(0, 1, 0)

// Pre-allocated vectors for curve calculation
const curveStart = new THREE.Vector3()
const curveEnd = new THREE.Vector3()
const curveControl = new THREE.Vector3()
const curveMid = new THREE.Vector3()
const curvePoint = new THREE.Vector3()
const curvePointPrev = new THREE.Vector3()

// Pre-allocated vectors for depth fade calculation
const cameraDirection = new THREE.Vector3()
const nodeNormal = new THREE.Vector3()

// Initialize Line Buffers
watchEffect(() => {
  if (!linesRef.value || !graphData.value) {
    //
  }
})

watch(linesRef, (lines) => {
  if (lines && graphData.value) {
    const { links } = graphData.value
    // For curved lines: each link has CURVE_SEGMENTS segments, each segment has 2 points (start and end)
    // Total points per link = CURVE_SEGMENTS * 2
    const pointsPerLink = CURVE_SEGMENTS * 2
    const positions = new Float32Array(links.length * pointsPerLink * 3)
    const colors = new Float32Array(links.length * pointsPerLink * 3)
    lines.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    lines.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }
})

// Block Generator
const { onBlockEvent } = useBlockchain()

onMounted(() => {
  onBlockEvent((block: BlockEvent) => {
    const now = Date.now() / 1000

    // Find validator node by address
    let validatorIdx = -1
    if (block.validatorAddress && graphData.value) {
      validatorIdx = graphData.value.nodes.findIndex(
        n => n.type === NodeType.VALIDATOR && n.validatorAddress === block.validatorAddress,
      )
    }

    // Fallback to random validator if address not found
    if (validatorIdx === -1) {
      const validatorCount = getValidatorCount()
      validatorIdx = Math.floor(Math.random() * validatorCount)
    }

    if (graphData.value) {
      graphData.value.nodes[validatorIdx]!.lastBlockTime = now
    }
    const newBeam: Beam = {
      id: Math.random().toString(36).slice(2),
      originIndex: validatorIdx,
      startTime: now,
      maxDistance: config.value.orbRadius * config.value.beamMaxDistanceMultiplier,
    }
    beams.value = [...beams.value, newBeam]
  })
})

// Cleanup beams
const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, camera }) => {
  // Cleanup beams
  const currentTime = Date.now() / 1000
  beams.value = beams.value.filter(b => (currentTime - b.startTime) * beamSpeed.value < b.maxDistance + 5)

  // Update colors from config
  cLink.set(config.value.colorLink)
  cBeam.set(config.value.beamColor)

  // Get camera direction for depth fade (camera looks at origin)
  if (camera?.value) {
    camera.value.getWorldDirection(cameraDirection)
  }

  if (!graphData.value || !nodesMeshRef.value || !linesRef.value)
    return

  const linePositions = linesRef.value.geometry.getAttribute('position') as THREE.BufferAttribute
  const lineColors = linesRef.value.geometry.getAttribute('color') as THREE.BufferAttribute
  if (!linePositions || !lineColors)
    return

  const { nodes, links } = graphData.value
  const time = currentTime
  const dt = delta * 1000

  if (groupRef.value) {
    // Infinity (lemniscate) slow rotation pattern
    const t = time * 0.1
    groupRef.value.rotation.y += delta * config.value.groupRotationSpeed
    groupRef.value.rotation.x = Math.sin(t * 2) * config.value.groupRotationXAmplitude
    groupRef.value.rotation.z = Math.cos(t) * config.value.groupRotationZAmplitude
  }

  // 1. Dynamic Rewiring - throttled to reduce computation
  if (Math.random() > 0.85) { // Reduced from 0.2 to 0.85 (only 15% of frames)
    const linkIdx = Math.floor(Math.random() * links.length)
    const link = links[linkIdx]
    if (link && !link.isValidatorLink && nodes[link.sourceIndex]!.state === 'ACTIVE' && link.connectionState === 'CONNECTED') {
      const candidateId = getValidatorCount() + Math.floor(Math.random() * (config.value.nodeCount - getValidatorCount()))
      if (candidateId !== link.sourceIndex && candidateId !== link.targetIndex) {
        const dist = nodes[link.sourceIndex]!.currentPosition.distanceTo(nodes[candidateId]!.currentPosition)
        if (dist < config.value.linkRewireDistance)
          link.targetIndex = candidateId
      }
    }
  }

  // 2. Update Nodes
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!

    // --- Motion ---
    const noiseAmp = config.value.nodeNoiseAmplitude
    const noiseX = Math.sin(time * 0.5 + n.id) * noiseAmp
    const noiseY = Math.cos(time * 0.3 + n.id) * noiseAmp
    const noiseZ = Math.sin(time * 0.4 + n.id) * noiseAmp

    if (n.type === NodeType.VALIDATOR) {
      n.theta += config.value.validatorRotationSpeed * delta
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
        if (n.timer <= 0) {
          n.state = 'DYING'
          n.timer = config.value.peerTransitionMs
        }
      }
      else if (n.state === 'HIDDEN') {
        if (n.timer <= 0) {
          n.state = 'SPAWNING'
          n.timer = config.value.peerTransitionMs
          n.startPosition.copy(n.targetPosition).normalize().multiplyScalar(config.value.orbRadius * 1.6)
          n.currentPosition.copy(n.startPosition)
        }
      }
      else if (n.state === 'SPAWNING') {
        const p = 1 - (n.timer / config.value.peerTransitionMs)
        n.currentPosition.lerpVectors(n.startPosition, n.targetPosition, 1 - (1 - p) ** 3)
        n.opacity = p
        if (n.timer <= 0) {
          n.state = 'ACTIVE'
          n.timer = config.value.peerLifetimeMs + Math.random() * 5000
        }
      }
      else if (n.state === 'DYING') {
        const p = n.timer / config.value.peerTransitionMs
        // Move back to start position (outwards)
        n.currentPosition.lerpVectors(n.startPosition, n.targetPosition, 1 - (1 - p) ** 3)
        n.opacity = p
        if (n.timer <= 0) {
          n.state = 'HIDDEN'
          n.timer = Math.random() * 5000
        }
      }
    }

    // --- Beams Logic with Softer Decay ---
    let beamIntensity = 0
    // Skip beam calculation for hidden nodes
    if (n.opacity > 0.01 && n.state !== 'HIDDEN' && beams.value.length > 0) {
      // Early exit if no active beams
      const activeBeams = beams.value
      const beamCount = activeBeams.length
      for (let b = 0; b < beamCount; b++) {
        const beam = activeBeams[b]!
        const waveDist = (time - beam.startTime) * beamSpeed.value
        // Early skip if beam hasn't reached this distance yet
        if (waveDist < 0)
          continue

        const dist = n.currentPosition.distanceTo(nodes[beam.originIndex]!.currentPosition)
        const waveWidth = config.value.beamWaveWidth

        if (dist < waveDist && dist > waveDist - waveWidth) {
          const p = 1 - (waveDist - dist) / waveWidth
          const ratio = dist / beam.maxDistance
          const decay = Math.max(0, 1 - ratio)
          beamIntensity = Math.max(beamIntensity, p ** 2 * decay * config.value.beamIntensityMultiplier)
        }
      }
    }

    // --- Validator Flash (Growing Glow Effect) ---
    let blockFlash = 0

    if (n.type === NodeType.VALIDATOR) {
      const timeSinceBlock = time - n.lastBlockTime
      const flashDuration = config.value.flashDuration
      const growTime = config.value.flashGrowTime

      if (timeSinceBlock >= 0 && timeSinceBlock < flashDuration) {
        if (timeSinceBlock < growTime) {
          const t = timeSinceBlock / growTime
          blockFlash = Math.sin(t * Math.PI * 0.5)
        }
        else {
          const t = (timeSinceBlock - growTime) / (flashDuration - growTime)
          blockFlash = 1 - t
        }
      }
    }

    // --- Matrix & Scale ---
    let scale = config.value.peerNodeScale
    if (n.type === NodeType.VALIDATOR)
      scale = config.value.validatorNodeScale

    // Scale modification for beam hit
    if (beamIntensity > 0)
      scale *= (1 + beamIntensity * config.value.beamScaleMultiplier)

    // Scale modification for block generation
    if (blockFlash > 0)
      scale *= (1 + blockFlash * config.value.flashScaleMultiplier)

    scale *= n.opacity
    if (scale < 0.01)
      scale = 0

    tempMatrix.makeScale(scale, scale, scale)
    tempMatrix.setPosition(n.currentPosition)

    // Rotation for "Gem" look
    const rot = (time * 0.5) + (n.id * 1.1)
    tempEuler.set(rot, rot, rot)
    tempRotMatrix.makeRotationFromEuler(tempEuler)
    tempMatrix.multiply(tempRotMatrix)

    nodesMeshRef.value.setMatrixAt(i, tempMatrix)

    // --- Update Halo to match node ---
    if (nodeHaloMeshRef.value && scale > 0.01) {
      const haloScale = scale * config.value.nodeHaloScale
      const haloMatrix = new THREE.Matrix4()
      haloMatrix.makeScale(haloScale, haloScale, haloScale)
      haloMatrix.setPosition(n.currentPosition)
      haloMatrix.multiply(tempRotMatrix) // Match rotation

      nodeHaloMeshRef.value.setMatrixAt(i, haloMatrix)
    }
    else if (nodeHaloMeshRef.value) {
      // Hide halo if node is hidden
      const emptyMatrix = new THREE.Matrix4()
      emptyMatrix.makeScale(0, 0, 0)
      nodeHaloMeshRef.value.setMatrixAt(i, emptyMatrix)
    }

    // --- Color Logic ---
    // Check if this node is the origin of an active beam
    let isBeamOrigin = false
    if (n.type === NodeType.VALIDATOR && beams.value.length > 0) {
      for (const beam of beams.value) {
        if (beam.originIndex === i) {
          isBeamOrigin = true
          break
        }
      }
    }

    if (blockFlash > 0) {
      // Source of Energy: Intense White with orange tint
      tempColor.setHex(0xFFCC88)
      // "Easy to spot": significant brightness boost for bloom
      tempColor.multiplyScalar(3.0 + blockFlash * 12.0)
    }
    else if (isBeamOrigin) {
      // Beam origin node - use beam color (orange) with high intensity
      tempColor.copy(cBeam)
      tempColor.multiplyScalar(4.5)
    }
    else if (beamIntensity > 0) {
      // Beam hit - Orange glow
      tempColor.copy(cBeam)
      const intensity = 2.5 + beamIntensity * 5.0
      tempColor.multiplyScalar(intensity)
    }
    else {
      // Standard State - Different for validators vs peers
      if (n.baseColor)
        tempColor.copy(n.baseColor)
      if (n.type === NodeType.VALIDATOR) {
        // Validators: bright purple glow
        tempColor.multiplyScalar(3.5)
      }
      else {
        // Peers: gray/white, subtle glow
        tempColor.multiplyScalar(1.2)
      }
    }

    // --- Depth Fade: dim nodes on the back of the sphere ---
    // Calculate node normal (pointing outward from sphere center)
    nodeNormal.copy(n.currentPosition).normalize()
    // Dot product with camera direction: negative = facing camera, positive = facing away
    const dotProduct = nodeNormal.dot(cameraDirection)
    // Map: front (dot=-1) -> 1.0, back (dot=1) -> 0.25
    const depthFade = Math.max(0.25, 0.625 - dotProduct * 0.375)
    n.depthFade = depthFade // Store for link calculation
    tempColor.multiplyScalar(depthFade)

    nodesMeshRef.value.setColorAt(i, tempColor)

    // --- Update Halo Color ---
    if (nodeHaloMeshRef.value && scale > 0.01) {
      // Use similar color but dimmer for subtlety
      const haloColor = tempColor.clone()
      haloColor.multiplyScalar(0.6)
      nodeHaloMeshRef.value.setColorAt(i, haloColor)
    }
  }

  nodesMeshRef.value.instanceMatrix.needsUpdate = true
  if (nodesMeshRef.value.instanceColor)
    nodesMeshRef.value.instanceColor.needsUpdate = true

  // Update halo mesh
  if (nodeHaloMeshRef.value) {
    nodeHaloMeshRef.value.instanceMatrix.needsUpdate = true
    if (nodeHaloMeshRef.value.instanceColor)
      nodeHaloMeshRef.value.instanceColor.needsUpdate = true
  }

  // 3. Update Links
  for (let i = 0; i < links.length; i++) {
    const link = links[i]!

    // --- Network Instability Simulation (throttled) ---
    if (!link.isValidatorLink) {
      if (link.connectionState === 'CONNECTED') {
        // Random chance to drop connection (reduced frequency)
        if (Math.random() < 0.0001) { // Reduced from 0.0003
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
    // Skip setting validator reconnect progress if already 1 (avoid unnecessary assignment)

    const n1 = nodes[link.sourceIndex]!
    const n2 = nodes[link.targetIndex]!

    const dist = n1.currentPosition.distanceTo(n2.currentPosition)
    let alpha = Math.min(n1.opacity, n2.opacity)
    if (dist > 7.0)
      alpha = 0

    // Skip rendering if fully disconnected or nodes invisible
    if (link.reconnectProgress < 0.01 || alpha < 0.01) {
      // Hide all curve segments
      const baseIdx = i * CURVE_SEGMENTS * 2
      for (let seg = 0; seg < CURVE_SEGMENTS; seg++) {
        linePositions.setXYZ(baseIdx + seg * 2, 0, 0, 0)
        linePositions.setXYZ(baseIdx + seg * 2 + 1, 0, 0, 0)
      }

      // Hide beam instances if link is hidden
      tempMatrix.makeScale(0, 0, 0)
      if (beamMeshRef.value)
        beamMeshRef.value.setMatrixAt(i, tempMatrix)
      if (beamMidGlowMeshRef.value)
        beamMidGlowMeshRef.value.setMatrixAt(i, tempMatrix)
      if (beamGlowMeshRef.value)
        beamGlowMeshRef.value.setMatrixAt(i, tempMatrix)
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

    // --- CURVED LINE RENDERING (Quadratic Bezier) ---
    // Set up curve control points
    curveStart.set(startX, startY, startZ)
    curveEnd.set(endX, endY, endZ)

    // Midpoint
    curveMid.addVectors(curveStart, curveEnd).multiplyScalar(0.5)

    // Control point: push midpoint outward to create arch
    curveControl.copy(curveMid).normalize()
    const linkDist = curveStart.distanceTo(curveEnd)
    const archHeight = linkDist * config.value.linkArchHeight
    curveControl.multiplyScalar(archHeight).add(curveMid)

    // Generate CURVE_SEGMENTS curved segments using quadratic bezier
    const baseIdx = i * CURVE_SEGMENTS * 2
    for (let seg = 0; seg < CURVE_SEGMENTS; seg++) {
      const t0 = seg / CURVE_SEGMENTS
      const t1 = (seg + 1) / CURVE_SEGMENTS

      // Quadratic Bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      // where P0 = start, P1 = control, P2 = end

      // Point at t0
      const it0 = 1 - t0
      curvePoint.set(
        it0 * it0 * curveStart.x + 2 * it0 * t0 * curveControl.x + t0 * t0 * curveEnd.x,
        it0 * it0 * curveStart.y + 2 * it0 * t0 * curveControl.y + t0 * t0 * curveEnd.y,
        it0 * it0 * curveStart.z + 2 * it0 * t0 * curveControl.z + t0 * t0 * curveEnd.z,
      )

      // Point at t1
      const it1 = 1 - t1
      curvePointPrev.set(
        it1 * it1 * curveStart.x + 2 * it1 * t1 * curveControl.x + t1 * t1 * curveEnd.x,
        it1 * it1 * curveStart.y + 2 * it1 * t1 * curveControl.y + t1 * t1 * curveEnd.y,
        it1 * it1 * curveStart.z + 2 * it1 * t1 * curveControl.z + t1 * t1 * curveEnd.z,
      )

      // Store segment
      linePositions.setXYZ(baseIdx + seg * 2, curvePoint.x, curvePoint.y, curvePoint.z)
      linePositions.setXYZ(baseIdx + seg * 2 + 1, curvePointPrev.x, curvePointPrev.y, curvePointPrev.z)
    }

    // Beam on link
    let beamHit = 0

    // Skip beams for spawning nodes or if no active beams
    if (n1.state !== 'SPAWNING' && n2.state !== 'SPAWNING' && beams.value.length > 0) {
      // Use pre-allocated vector for midpoint
      tempVec3.set(startX + (endX - startX) * 0.5, startY + (endY - startY) * 0.5, startZ + (endZ - startZ) * 0.5)

      // Calculate standard link color - use indexed loop for better performance
      const activeBeams = beams.value
      const beamCount = activeBeams.length
      for (let b = 0; b < beamCount; b++) {
        const beam = activeBeams[b]!
        const waveDist = (time - beam.startTime) * beamSpeed.value
        // Early skip if beam hasn't started
        if (waveDist < 0)
          continue

        const origin = nodes[beam.originIndex]!.currentPosition
        const d = tempVec3.distanceTo(origin)
        const waveWidth = config.value.beamWaveWidth

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

      // Align cylinder to link (use pre-allocated objects)
      tempVec3.subVectors(tempEnd, tempStart).normalize()
      tempQuaternion.setFromUnitVectors(upVector, tempVec3)

      // Scale: Thickness based on beamHit, Length matches link
      // Reduced thickness as requested (0.8 multiplier)
      const thickness = beamHit * 0.8
      tempVec3_2.set((startX + endX) / 2, (startY + endY) / 2, (startZ + endZ) / 2)

      // Core beam
      tempMatrix.makeRotationFromQuaternion(tempQuaternion)
      tempScale.set(thickness, len, thickness)
      tempMatrix.scale(tempScale)
      tempMatrix.setPosition(tempVec3_2)

      if (beamMeshRef.value) {
        beamMeshRef.value.setMatrixAt(i, tempMatrix)

        // Color: Beam Color but brighter
        tempColor.copy(cBeam)
        tempColor.multiplyScalar(1.2) // Reduced glow intensity
        beamMeshRef.value.setColorAt(i, tempColor)
      }

      // Middle glow layer (larger, softer)
      midGlowMatrix.makeRotationFromQuaternion(tempQuaternion)
      tempScale.set(thickness * 1.8, len, thickness * 1.8)
      midGlowMatrix.scale(tempScale)
      midGlowMatrix.setPosition(tempVec3_2)

      if (beamMidGlowMeshRef.value) {
        beamMidGlowMeshRef.value.setMatrixAt(i, midGlowMatrix)
        tempColor.copy(cBeam)
        tempColor.multiplyScalar(0.8)
        beamMidGlowMeshRef.value.setColorAt(i, tempColor)
      }

      // Outer glow layer (largest, most diffuse)
      glowMatrix.makeRotationFromQuaternion(tempQuaternion)
      tempScale.set(thickness * 3.0, len, thickness * 3.0)
      glowMatrix.scale(tempScale)
      glowMatrix.setPosition(tempVec3_2)

      if (beamGlowMeshRef.value) {
        beamGlowMeshRef.value.setMatrixAt(i, glowMatrix)
        tempColor.copy(cBeam)
        tempColor.multiplyScalar(0.5)
        beamGlowMeshRef.value.setColorAt(i, tempColor)
      }
    }
    else {
      // Hide beam instance
      tempMatrix.makeScale(0, 0, 0)
      if (beamMeshRef.value)
        beamMeshRef.value.setMatrixAt(i, tempMatrix)
      if (beamMidGlowMeshRef.value)
        beamMidGlowMeshRef.value.setMatrixAt(i, tempMatrix)
      if (beamGlowMeshRef.value)
        beamGlowMeshRef.value.setMatrixAt(i, tempMatrix)
    }

    if (beamHit > 0) {
      tempColor.copy(cBeam)
      tempColor.multiplyScalar(0.5 + beamHit * 3.0)
    }
    else {
      tempColor.copy(cLink)
      if (link.isValidatorLink) {
        tempColor.multiplyScalar(1.5)
      }
      else {
        tempColor.multiplyScalar(0.5)
      }
    }
    tempColor.multiplyScalar(alpha)

    // Apply depth fade based on connected nodes (use average, less aggressive for links)
    const avgDepthFade = ((n1.depthFade ?? 1) + (n2.depthFade ?? 1)) * 0.5
    // Softer fade for links: remap 0.25-1 to 0.4-1
    const linkDepthFade = 0.4 + avgDepthFade * 0.6
    tempColor.multiplyScalar(linkDepthFade)

    // Set Colors for all curve segments
    for (let seg = 0; seg < CURVE_SEGMENTS; seg++) {
      const segmentColor = tempColor.clone()

      // If reconnecting, brighten the growing tip
      if (link.connectionState === 'RECONNECTING' && seg === CURVE_SEGMENTS - 1) {
        segmentColor.setRGB(1.0, 1.0, 1.0)
      }

      lineColors.setXYZ(baseIdx + seg * 2, segmentColor.r, segmentColor.g, segmentColor.b)
      lineColors.setXYZ(baseIdx + seg * 2 + 1, segmentColor.r, segmentColor.g, segmentColor.b)
    }
  }

  if (beamMeshRef.value) {
    beamMeshRef.value.instanceMatrix.needsUpdate = true
    if (beamMeshRef.value.instanceColor)
      beamMeshRef.value.instanceColor.needsUpdate = true
  }

  if (beamMidGlowMeshRef.value) {
    beamMidGlowMeshRef.value.instanceMatrix.needsUpdate = true
    if (beamMidGlowMeshRef.value.instanceColor)
      beamMidGlowMeshRef.value.instanceColor.needsUpdate = true
  }

  if (beamGlowMeshRef.value) {
    beamGlowMeshRef.value.instanceMatrix.needsUpdate = true
    if (beamGlowMeshRef.value.instanceColor)
      beamGlowMeshRef.value.instanceColor.needsUpdate = true
  }

  linePositions.needsUpdate = true
  lineColors.needsUpdate = true

  // Update metrics (throttled to ~10Hz)
  frameCount++
  if (time - lastFpsUpdate >= 0.1) {
    currentFps = frameCount / (time - lastFpsUpdate)
    lastFpsUpdate = time
    frameCount = 0

    // Count active nodes and connected links
    let activeNodes = 0
    let connectedLinks = 0
    for (const n of nodes) {
      if (n.opacity > 0.1)
        activeNodes++
    }
    for (const l of links) {
      if (l.connectionState === 'CONNECTED')
        connectedLinks++
    }

    updateMetrics({ fps: currentFps, activeBeams: beams.value.length, activeNodes, connectedLinks })
  }
})
</script>

<template>
  <TresGroup ref="groupRef">
    <!-- Node Halos (Glow Effect) -->
    <TresInstancedMesh ref="nodeHaloMeshRef" :args="[haloSphereGeometry, undefined, config.nodeCount]">
      <TresMeshBasicMaterial :tone-mapped="false" transparent :opacity="0.25" :blending="THREE.AdditiveBlending" :depth-write="false" color="#0095FF" />
    </TresInstancedMesh>

    <!-- Existing nodes mesh -->
    <TresInstancedMesh ref="nodesMeshRef" :args="[bumpySphereGeometry, undefined, config.nodeCount]">
      <TresMeshStandardMaterial :tone-mapped="false" :roughness="0.05" :metalness="0.5" emissive="#0095FF" :emissive-intensity="1.2" color="#e0f0ff" :side="THREE.FrontSide" />
    </TresInstancedMesh>

    <!-- Middle glow layer -->
    <TresInstancedMesh ref="beamMidGlowMeshRef" :args="[undefined, undefined, 5000]" :count="graphData?.links.length || 0">
      <TresCylinderGeometry :args="[0.32, 0.32, 1, 12, 1]" />
      <TresMeshBasicMaterial :color="config.beamColor" transparent :opacity="0.2" :blending="THREE.AdditiveBlending" :depth-write="false" :tone-mapped="false" />
    </TresInstancedMesh>
    <!-- Core beam layer -->
    <!-- <TresInstancedMesh ref="beamMeshRef" :args="[undefined, undefined, 5000]" :count="graphData?.links.length || 0">
      <TresCylinderGeometry :args="[0.15, 0.15, 1, 12, 1]" />
      <TresMeshBasicMaterial
        :color="BEAM_COLOR"
        transparent
        :opacity="0.4"
        :blending="THREE.AdditiveBlending"
        :depth-write="false"
        :tone-mapped="false"
      />
    </TresInstancedMesh> -->

    <TresLineSegments ref="linesRef">
      <TresBufferGeometry />
      <TresLineBasicMaterial
        vertex-colors
        transparent
        :opacity="0.8"
        :blending="THREE.AdditiveBlending"
        :depth-write="false"
        :tone-mapped="false"
      />
    </TresLineSegments>
  </TresGroup>
</template>

<script setup lang="ts">
import type { Beam, LinkData, NodeData } from '~/types/orb'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { useBlockchain } from '~/composables/useBlockchain'
import { NodeType } from '~/types/orb'
import { generateGraph } from '~/utils/generate-graph'

import {
  BEAM_COLOR,
  BEAM_SPEED,
  COLOR_LINK,
  EDGE_COLOR,
  NODE_COUNT,
  ORB_RADIUS,
  PEER_LIFETIME_MS,
  PEER_TRANSITION_MS,
  VALIDATOR_COUNT,
  VALIDATOR_ROTATION_SPEED,
} from '~/utils/orb-constants'

defineProps<{
  audioData: number
}>()

// Generate Graph
const graphData = shallowRef<{ nodes: NodeData[], links: LinkData[] } | null>(null)
watchEffect(() => {
  graphData.value = generateGraph()
})

const nodesMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const nodeWireframeMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const beamMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const beamGlowMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const beamMidGlowMeshRef = shallowRef<THREE.InstancedMesh | null>(null)
const linesRef = shallowRef<THREE.LineSegments | null>(null)
const groupRef = shallowRef<THREE.Group | null>(null)
const beams = ref<Beam[]>([])

// Create Truncated Octahedron geometry (Archimedean solid with 8 hexagons and 6 squares)
const truncatedOctahedronGeometry = (() => {
  const r = 0.32
  const s = r / Math.sqrt(5) // Scale factor for unit truncated octahedron

  // 24 vertices: all permutations of (0, ±1, ±2), (±1, ±2, 0), (±2, 0, ±1)
  const vertices = [
    // (0, ±1, ±2)
    [0, 1, 2],
    [0, 1, -2],
    [0, -1, 2],
    [0, -1, -2],
    // (0, ±2, ±1)
    [0, 2, 1],
    [0, 2, -1],
    [0, -2, 1],
    [0, -2, -1],
    // (±1, 0, ±2)
    [1, 0, 2],
    [1, 0, -2],
    [-1, 0, 2],
    [-1, 0, -2],
    // (±2, 0, ±1)
    [2, 0, 1],
    [2, 0, -1],
    [-2, 0, 1],
    [-2, 0, -1],
    // (±1, ±2, 0)
    [1, 2, 0],
    [1, -2, 0],
    [-1, 2, 0],
    [-1, -2, 0],
    // (±2, ±1, 0)
    [2, 1, 0],
    [2, -1, 0],
    [-2, 1, 0],
    [-2, -1, 0],
  ]

  const points = vertices.map(v => new THREE.Vector3(v[0]! * s, v[1]! * s, v[2]! * s))

  // Create convex hull geometry from points
  // Since we can't import ConvexGeometry easily, we'll create it manually with correct winding
  const positions: number[] = []

  // Helper to add a triangle with correct winding (CCW when viewed from outside)
  const addTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    // Calculate center of triangle
    const center = new THREE.Vector3().addVectors(a, b).add(c).divideScalar(3)
    // Calculate normal
    const ab = new THREE.Vector3().subVectors(b, a)
    const ac = new THREE.Vector3().subVectors(c, a)
    const normal = new THREE.Vector3().crossVectors(ab, ac)
    // If normal points inward (toward origin), reverse winding
    if (normal.dot(center) < 0) {
      positions.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z)
    }
    else {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    }
  }

  // Helper to triangulate a convex polygon (fan triangulation from first vertex)
  const addFace = (indices: number[]) => {
    const pts = indices.map(i => points[i]!)
    for (let i = 1; i < pts.length - 1; i++) {
      addTri(pts[0]!, pts[i]!, pts[i + 1]!)
    }
  }

  // 6 Square faces
  addFace([12, 20, 13, 21]) // +X
  addFace([14, 22, 15, 23]) // -X
  addFace([4, 16, 5, 18]) // +Y (wrong indices, fixing)
  addFace([6, 17, 7, 19]) // -Y
  addFace([0, 8, 2, 10]) // +Z
  addFace([1, 9, 3, 11]) // -Z

  // 8 Hexagonal faces
  addFace([0, 4, 16, 20, 12, 8]) // corner at +X+Y+Z
  addFace([0, 10, 14, 22, 18, 4]) // corner at -X+Y+Z
  addFace([2, 8, 12, 21, 17, 6]) // corner at +X-Y+Z
  addFace([2, 6, 19, 23, 14, 10]) // corner at -X-Y+Z
  addFace([1, 5, 16, 20, 13, 9]) // corner at +X+Y-Z
  addFace([1, 11, 15, 22, 18, 5]) // corner at -X+Y-Z
  addFace([3, 9, 13, 21, 17, 7]) // corner at +X-Y-Z
  addFace([3, 7, 19, 23, 15, 11]) // corner at -X-Y-Z

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()

  return geometry
})()

// Create geometry with only hexagonal edges as thin mesh tubes (no square edges)
const hexagonEdgesGeometry = (() => {
  const r = 0.32
  const s = r / Math.sqrt(5)
  const edgeRadius = 0.008 // Thin edge thickness

  // Same 24 vertices as the truncated octahedron
  const vertices = [
    [0, 1, 2],
    [0, 1, -2],
    [0, -1, 2],
    [0, -1, -2],
    [0, 2, 1],
    [0, 2, -1],
    [0, -2, 1],
    [0, -2, -1],
    [1, 0, 2],
    [1, 0, -2],
    [-1, 0, 2],
    [-1, 0, -2],
    [2, 0, 1],
    [2, 0, -1],
    [-2, 0, 1],
    [-2, 0, -1],
    [1, 2, 0],
    [1, -2, 0],
    [-1, 2, 0],
    [-1, -2, 0],
    [2, 1, 0],
    [2, -1, 0],
    [-2, 1, 0],
    [-2, -1, 0],
  ]

  const points = vertices.map(v => new THREE.Vector3(v[0]! * s, v[1]! * s, v[2]! * s))

  // 8 Hexagonal faces - only their edges
  const hexFaces = [
    [0, 4, 16, 20, 12, 8],
    [0, 10, 14, 22, 18, 4],
    [2, 8, 12, 21, 17, 6],
    [2, 6, 19, 23, 14, 10],
    [1, 5, 16, 20, 13, 9],
    [1, 11, 15, 22, 18, 5],
    [3, 9, 13, 21, 17, 7],
    [3, 7, 19, 23, 15, 11],
  ]

  // Collect unique edges (avoid duplicates)
  const edgeSet = new Set<string>()
  const edges: [THREE.Vector3, THREE.Vector3][] = []

  for (const face of hexFaces) {
    for (let i = 0; i < face.length; i++) {
      const i1 = face[i]!
      const i2 = face[(i + 1) % face.length]!
      const key = i1 < i2 ? `${i1}-${i2}` : `${i2}-${i1}`
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push([points[i1]!, points[i2]!])
      }
    }
  }

  // Create mesh geometry for all edges (triangular prism for each edge)
  const positions: number[] = []
  const normals: number[] = []

  for (const [p1, p2] of edges) {
    // Direction along the edge
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize()

    // Find perpendicular vectors
    const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const perp1 = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(edgeRadius)
    const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize().multiplyScalar(edgeRadius)

    // Create 3 vertices around each endpoint (triangular cross-section)
    const angle1 = 0
    const angle2 = (Math.PI * 2) / 3
    const angle3 = (Math.PI * 4) / 3

    const getOffset = (angle: number) => {
      return new THREE.Vector3()
        .addScaledVector(perp1, Math.cos(angle))
        .addScaledVector(perp2, Math.sin(angle))
    }

    const o1 = getOffset(angle1)
    const o2 = getOffset(angle2)
    const o3 = getOffset(angle3)

    // 6 vertices: 3 at p1, 3 at p2
    const v1a = new THREE.Vector3().addVectors(p1, o1)
    const v1b = new THREE.Vector3().addVectors(p1, o2)
    const v1c = new THREE.Vector3().addVectors(p1, o3)
    const v2a = new THREE.Vector3().addVectors(p2, o1)
    const v2b = new THREE.Vector3().addVectors(p2, o2)
    const v2c = new THREE.Vector3().addVectors(p2, o3)

    // 3 rectangular faces (each split into 2 triangles)
    // Face 1: v1a, v2a, v2b, v1b
    positions.push(v1a.x, v1a.y, v1a.z, v2a.x, v2a.y, v2a.z, v2b.x, v2b.y, v2b.z)
    positions.push(v1a.x, v1a.y, v1a.z, v2b.x, v2b.y, v2b.z, v1b.x, v1b.y, v1b.z)
    // Face 2: v1b, v2b, v2c, v1c
    positions.push(v1b.x, v1b.y, v1b.z, v2b.x, v2b.y, v2b.z, v2c.x, v2c.y, v2c.z)
    positions.push(v1b.x, v1b.y, v1b.z, v2c.x, v2c.y, v2c.z, v1c.x, v1c.y, v1c.z)
    // Face 3: v1c, v2c, v2a, v1a
    positions.push(v1c.x, v1c.y, v1c.z, v2c.x, v2c.y, v2c.z, v2a.x, v2a.y, v2a.z)
    positions.push(v1c.x, v1c.y, v1c.z, v2a.x, v2a.y, v2a.z, v1a.x, v1a.y, v1a.z)

    // Normals (pointing outward from edge center)
    const n1 = new THREE.Vector3().addVectors(o1, o2).normalize()
    const n2 = new THREE.Vector3().addVectors(o2, o3).normalize()
    const n3 = new THREE.Vector3().addVectors(o3, o1).normalize()

    for (let i = 0; i < 6; i++) normals.push(n1.x, n1.y, n1.z)
    for (let i = 0; i < 6; i++) normals.push(n2.x, n2.y, n2.z)
    for (let i = 0; i < 6; i++) normals.push(n3.x, n3.y, n3.z)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

  return geometry
})()

const tempColor = new THREE.Color()
const tempMatrix = new THREE.Matrix4()
const tempStart = new THREE.Vector3()
const tempEnd = new THREE.Vector3()
const cLink = new THREE.Color(COLOR_LINK)
const cBeam = new THREE.Color(BEAM_COLOR)

// Initialize Line Buffers
watchEffect(() => {
  if (!linesRef.value || !graphData.value) {
    //
  }
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
const { onBlockEvent } = useBlockchain()

onMounted(() => {
  onBlockEvent((block: BlockEvent) => {
    const now = Date.now() / 1000

    // Select validator based on address hash or random
    let validatorIdx = Math.floor(Math.random() * VALIDATOR_COUNT)
    if (block.validatorAddress) {
      let hash = 0
      for (let i = 0; i < block.validatorAddress.length; i++) {
        hash = (hash << 5) - hash + block.validatorAddress.charCodeAt(i)
        hash |= 0
      }
      validatorIdx = Math.abs(hash) % VALIDATOR_COUNT
    }

    if (graphData.value) {
      graphData.value.nodes[validatorIdx]!.lastBlockTime = now
    }
    const newBeam: Beam = {
      id: Math.random().toString(36).slice(2),
      originIndex: validatorIdx,
      startTime: now,
      maxDistance: ORB_RADIUS * 2.2,
    }
    beams.value = [...beams.value, newBeam]
  })
})

// Cleanup beams
const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
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

  if (groupRef.value) {
    // Infinity (lemniscate) slow rotation pattern
    const t = time * 0.1 // Very slow base speed
    // Parametric infinity curve mapped to rotation
    groupRef.value.rotation.y += delta * 0.08
    groupRef.value.rotation.x = Math.sin(t * 2) * 0.15
    groupRef.value.rotation.z = Math.cos(t) * 0.1
  }

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
        if (n.timer <= 0) {
          n.state = 'DYING'
          n.timer = PEER_TRANSITION_MS
        }
      }
      else if (n.state === 'HIDDEN') {
        if (n.timer <= 0) {
          n.state = 'SPAWNING'
          n.timer = PEER_TRANSITION_MS
          n.startPosition.copy(n.targetPosition).normalize().multiplyScalar(ORB_RADIUS * 1.6)
          n.currentPosition.copy(n.startPosition)
        }
      }
      else if (n.state === 'SPAWNING') {
        const p = 1 - (n.timer / PEER_TRANSITION_MS)
        n.currentPosition.lerpVectors(n.startPosition, n.targetPosition, 1 - (1 - p) ** 3)
        n.opacity = p
        if (n.timer <= 0) {
          n.state = 'ACTIVE'
          n.timer = PEER_LIFETIME_MS + Math.random() * 5000
        }
      }
      else if (n.state === 'DYING') {
        const p = n.timer / PEER_TRANSITION_MS
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
      scale *= (1 + beamIntensity * 1.5)

    // Scale modification for block generation
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

    // Update wireframe mesh for validators
    if (nodeWireframeMeshRef.value) {
      if (n.type === NodeType.VALIDATOR && scale > 0.01) {
        // Scale wireframe slightly larger to prevent z-fighting
        const wireScale = scale * 1.01
        const wireMatrix = new THREE.Matrix4()
        wireMatrix.makeScale(wireScale, wireScale, wireScale)
        wireMatrix.setPosition(n.currentPosition)
        // Apply same rotation
        const rotW = (time * 0.5) + (n.id * 1.1)
        wireMatrix.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rotW, rotW, rotW)))
        nodeWireframeMeshRef.value.setMatrixAt(i, wireMatrix)
        // Use edge color for hexagon outlines
        const wireColor = new THREE.Color(EDGE_COLOR)
        nodeWireframeMeshRef.value.setColorAt(i, wireColor)
      }
      else {
        // Hide wireframe for non-validators
        const hideMatrix = new THREE.Matrix4().makeScale(0, 0, 0)
        nodeWireframeMeshRef.value.setMatrixAt(i, hideMatrix)
      }
    }
  }

  nodesMeshRef.value.instanceMatrix.needsUpdate = true
  if (nodesMeshRef.value.instanceColor)
    nodesMeshRef.value.instanceColor.needsUpdate = true

  if (nodeWireframeMeshRef.value) {
    nodeWireframeMeshRef.value.instanceMatrix.needsUpdate = true
    if (nodeWireframeMeshRef.value.instanceColor)
      nodeWireframeMeshRef.value.instanceColor.needsUpdate = true
  }

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
      linePositions.setXYZ(i * 2, 0, 0, 0)
      linePositions.setXYZ(i * 2 + 1, 0, 0, 0)

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
      const centerPos = new THREE.Vector3((startX + endX) / 2, (startY + endY) / 2, (startZ + endZ) / 2)

      // Core beam
      tempMatrix.makeRotationFromQuaternion(quaternion)
      tempMatrix.scale(new THREE.Vector3(thickness, len, thickness))
      tempMatrix.setPosition(centerPos)

      if (beamMeshRef.value) {
        beamMeshRef.value.setMatrixAt(i, tempMatrix)

        // Color: Beam Color but brighter
        tempColor.copy(cBeam)
        tempColor.multiplyScalar(1.2) // Reduced glow intensity
        beamMeshRef.value.setColorAt(i, tempColor)
      }

      // Middle glow layer (larger, softer)
      const midGlowMatrix = new THREE.Matrix4()
      midGlowMatrix.makeRotationFromQuaternion(quaternion)
      midGlowMatrix.scale(new THREE.Vector3(thickness * 1.8, len, thickness * 1.8))
      midGlowMatrix.setPosition(centerPos)

      if (beamMidGlowMeshRef.value) {
        beamMidGlowMeshRef.value.setMatrixAt(i, midGlowMatrix)
        tempColor.copy(cBeam)
        tempColor.multiplyScalar(0.8)
        beamMidGlowMeshRef.value.setColorAt(i, tempColor)
      }

      // Outer glow layer (largest, most diffuse)
      const glowMatrix = new THREE.Matrix4()
      glowMatrix.makeRotationFromQuaternion(quaternion)
      glowMatrix.scale(new THREE.Vector3(thickness * 3.0, len, thickness * 3.0))
      glowMatrix.setPosition(centerPos)

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
})
</script>

<template>
  <TresGroup ref="groupRef">
    <TresInstancedMesh ref="nodesMeshRef" :args="[truncatedOctahedronGeometry, undefined, NODE_COUNT]">
      <TresMeshStandardMaterial
        :tone-mapped="false"
        :roughness="0.2"
        :metalness="0.0"
        :flat-shading="true"
        emissive="#ffffff"
        :emissive-intensity="0.4"
        color="#666666"
        :side="THREE.DoubleSide"
      />
    </TresInstancedMesh>

    <!-- Hexagon edges overlay for validator nodes -->
    <TresInstancedMesh ref="nodeWireframeMeshRef" :args="[hexagonEdgesGeometry, undefined, NODE_COUNT]">
      <TresMeshBasicMaterial
        :color="EDGE_COLOR"
        :tone-mapped="false"
        :transparent="true"
        :opacity="1.0"
        :side="THREE.DoubleSide"
      />
    </TresInstancedMesh>

    <!-- Energy Beams (Thick Links) with blur effect -->
    <!-- Outer glow layer (blur effect) -->
    <TresInstancedMesh ref="beamGlowMeshRef" :args="[undefined, undefined, 5000]" :count="graphData?.links.length || 0">
      <TresCylinderGeometry :args="[0.25, 0.25, 1, 8, 1]" />
      <TresMeshBasicMaterial
        :color="BEAM_COLOR"
        transparent
        :opacity="0.15"
        :blending="THREE.AdditiveBlending"
        :depth-write="false"
        :tone-mapped="false"
      />
    </TresInstancedMesh>
    <!-- Middle glow layer -->
    <TresInstancedMesh ref="beamMidGlowMeshRef" :args="[undefined, undefined, 5000]" :count="graphData?.links.length || 0">
      <TresCylinderGeometry :args="[0.16, 0.16, 1, 8, 1]" />
      <TresMeshBasicMaterial
        :color="BEAM_COLOR"
        transparent
        :opacity="0.15"
        :blending="THREE.AdditiveBlending"
        :depth-write="false"
        :tone-mapped="false"
      />
    </TresInstancedMesh>
    <!-- Core beam layer -->
    <TresInstancedMesh ref="beamMeshRef" :args="[undefined, undefined, 5000]" :count="graphData?.links.length || 0">
      <TresCylinderGeometry :args="[0.08, 0.08, 1, 6, 1]" />
      <TresMeshBasicMaterial
        :color="BEAM_COLOR"
        transparent
        :opacity="0.6"
        :blending="THREE.NormalBlending"
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

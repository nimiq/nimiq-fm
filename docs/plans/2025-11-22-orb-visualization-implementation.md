# DataOrb 3D Blockchain Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 3D blockchain orb with 72 real validators, ~2000 simulated peers, energy beams on blocks

**Architecture:** TresJS/Three.js instanced meshes for nodes, BufferGeometry for connections, WebSocket for real-time blocks, validators API for node data

**Tech Stack:** TresJS, Three.js, Nuxt 4, Vue 3 Composition API, TypeScript

---

## Task 1: Create Core Types

**Files:**
- Create: `app/types/orb.ts`

**Step 1: Write types file**

Create `app/types/orb.ts`:

```ts
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
```

**Step 2: Commit**

```bash
git add app/types/orb.ts
git commit -m "feat: add orb types"
```

---

## Task 2: Create Constants File

**Files:**
- Create: `app/utils/orb-constants.ts`

**Step 1: Write constants**

Create `app/utils/orb-constants.ts`:

```ts
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
```

**Step 2: Commit**

```bash
git add app/utils/orb-constants.ts
git commit -m "feat: add orb constants and theme palettes"
```

---

## Task 3: Create Validators Composable

**Files:**
- Create: `app/composables/useValidators.ts`

**Step 1: Write composable**

Create `app/composables/useValidators.ts`:

```ts
import type { ValidatorAPIResponse } from '~/types/orb'

export function useValidators() {
  const validators = ref<ValidatorAPIResponse[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchValidators = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ValidatorAPIResponse[]>(
        'https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false',
      )
      validators.value = response
    }
    catch (e) {
      error.value = e as Error
      console.error('Failed to fetch validators:', e)
    }
    finally {
      loading.value = false
    }
  }

  const getValidatorByAddress = (address: string) => {
    return validators.value.find(v => v.address === address)
  }

  return { validators: readonly(validators), loading: readonly(loading), error: readonly(error), fetchValidators, getValidatorByAddress }
}
```

**Step 2: Commit**

```bash
git add app/composables/useValidators.ts
git commit -m "feat: add validators composable"
```

---

## Task 4: Create Graph Generation Utility

**Files:**
- Create: `app/utils/generate-graph.ts`

**Step 1: Write graph generator**

Create `app/utils/generate-graph.ts`:

```ts
import type { LinkData, PeerNode, ValidatorAPIResponse, ValidatorNode } from '~/types/orb'
import * as THREE from 'three'
import { DEFAULT_VALIDATOR_COLOR, ORB_CONFIG, THEME_PALETTES } from './orb-constants'

export function generateGraph(validators: ValidatorAPIResponse[], peerCount: number, theme: 'dunesOfDessert' | 'qinim') {
  const nodes: Array<ValidatorNode | PeerNode> = []
  const links: LinkData[] = []
  const validatorMap = new Map<string, number>()

  const palette = THEME_PALETTES[theme].peer

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
      if (i === j)
        continue
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
      if (i === j)
        continue
      const pNode = nodes[j] as PeerNode
      peerDistances.push({ id: j, dist: node.targetPosition.distanceTo(pNode.targetPosition) })
    }
    peerDistances.sort((a, b) => a.dist - b.dist)

    let peerConnections = 0
    for (let k = 0; k < 8 && peerConnections < 2 && k < peerDistances.length; k++) {
      const targetId = peerDistances[k].id
      if (peerDistances[k].dist > 5.0)
        continue
      links.push({ sourceIndex: i, targetIndex: targetId, isValidatorLink: false, phaseOffset: 0 })
      peerConnections++
    }
  }

  return { nodes, links, validatorMap }
}
```

**Step 2: Commit**

```bash
git add app/utils/generate-graph.ts
git commit -m "feat: add graph generation utility"
```

---

## Task 5: Create OrbMesh Component

**Files:**
- Create: `app/components/OrbMesh.vue`

**Step 1: Write component**

Create `app/components/OrbMesh.vue`:

```vue
<script setup lang="ts">
import type { Beam, LinkData, PeerNode, ValidatorNode } from '~/types/orb'
import { useRenderLoop } from '@tresjs/core'
import * as THREE from 'three'
import { shallowRef, watchEffect } from 'vue'
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
  if (!linesRef.value || !props.links.length)
    return
  const positions = new Float32Array(props.links.length * 6)
  const colors = new Float32Array(props.links.length * 6)
  linesRef.value.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  linesRef.value.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
})

const { onLoop } = useRenderLoop()

onLoop(({ delta, elapsed }) => {
  if (!nodesMeshRef.value || !linesRef.value || !props.nodes.length)
    return

  const linePositions = linesRef.value.geometry.getAttribute('position') as THREE.BufferAttribute
  const lineColors = linesRef.value.geometry.getAttribute('color') as THREE.BufferAttribute
  if (!linePositions || !lineColors)
    return

  const time = elapsed
  const dt = delta * 1000

  if (groupRef.value)
    groupRef.value.rotation.y += delta * 0.04

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
        n.currentPosition.lerpVectors(n.startPosition, n.targetPosition, 1 - (1 - p) ** 3)
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
        if (validatorIdx === undefined)
          continue
        const originNode = props.nodes[validatorIdx]
        const pos = 'address' in originNode ? originNode.position : originNode.currentPosition
        const dist = ('address' in n ? n.position : n.currentPosition).distanceTo(pos)
        const waveDist = (time - beam.startTime) * ORB_CONFIG.BEAM_SPEED
        const waveWidth = 8.0

        if (dist < waveDist && dist > waveDist - waveWidth) {
          const p = 1 - (waveDist - dist) / waveWidth
          beamIntensity = Math.max(beamIntensity, p ** 2)
        }
      }
    }

    // Block flash
    let blockFlash = 0
    if ('address' in n) {
      const timeSinceBlock = time - n.lastBlockTime
      if (timeSinceBlock < 1.5 && timeSinceBlock >= 0) {
        blockFlash = (1 - (timeSinceBlock / 1.5)) ** 3
      }
    }

    // Scale
    let scale = 'address' in n ? 2.2 : 0.4
    if (beamIntensity > 0)
      scale *= (1 + beamIntensity * 0.8)
    if (blockFlash > 0)
      scale *= (1 + blockFlash * 0.5)
    scale *= opacity
    if (scale < 0.01)
      scale = 0

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
  if (nodesMeshRef.value.instanceColor)
    nodesMeshRef.value.instanceColor.needsUpdate = true

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
    if (dist > 7.0)
      alpha = 0

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
      if (validatorIdx === undefined)
        continue
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
```

**Step 2: Commit**

```bash
git add app/components/OrbMesh.vue
git commit -m "feat: add OrbMesh component"
```

---

## Task 6: Create OrbScene Component

**Files:**
- Create: `app/components/OrbScene.vue`

**Step 1: Write component**

Create `app/components/OrbScene.vue`:

```vue
<script setup lang="ts">
import type { Beam, LinkData, PeerNode, ValidatorNode } from '~/types/orb'
import { OrbitControls, Sparkles, Stars } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { Bloom, EffectComposer, Noise, Vignette } from '@tresjs/post-processing'
import * as THREE from 'three'
import { THEME_PALETTES } from '~/utils/orb-constants'

const props = defineProps<{
  nodes: Array<ValidatorNode | PeerNode>
  links: LinkData[]
  validatorMap: Map<string, number>
  beams: Beam[]
  theme: 'dunesOfDessert' | 'qinim'
  validatorCount: number
}>()

const themeColors = computed(() => THEME_PALETTES[props.theme])
</script>

<template>
  <TresCanvas
    clear-color="#000000"
    :tone-mapping="THREE.ACESFilmicToneMapping"
    :tone-mapping-exposure="1.2"
  >
    <TresPerspectiveCamera :position="[0, 0, 32]" :fov="35" />

    <TresAmbientLight :intensity="0.3" :color="themeColors.ambient" />
    <TresPointLight :position="[0, 0, 0]" :intensity="2" :color="themeColors.beam" :distance="20" :decay="2" />
    <TresPointLight :position="[30, 10, 20]" :intensity="15" :color="themeColors.pointLight1" :distance="100" :decay="1" />
    <TresPointLight :position="[-30, -10, -10]" :intensity="15" :color="themeColors.pointLight2" :distance="100" :decay="1" />

    <Sparkles :count="100" :scale="25" :size="4" :speed="0.4" :opacity="0.5" :color="themeColors.pointLight1" />
    <Sparkles :count="100" :scale="35" :size="6" :speed="0.2" :opacity="0.4" :color="themeColors.beam" />
    <Stars :radius="100" :depth="50" :count="1000" :factor="4" :saturation="0.5" :fade="true" :speed="0.2" />

    <OrbMesh :nodes="nodes" :links="links" :validator-map="validatorMap" :beams="beams" :theme="theme" :validator-count="validatorCount" />

    <Suspense>
      <EffectComposer>
        <Bloom :luminance-threshold="0.2" :intensity="1.0" :radius="0.5" :levels="8" mipmap-blur />
        <Noise :opacity="0.05" />
        <Vignette :offset="0.1" :darkness="0.6" />
      </EffectComposer>
    </Suspense>

    <OrbitControls :enable-pan="false" :enable-zoom="true" :min-distance="15" :max-distance="70" :auto-rotate="true" :auto-rotate-speed="0.3" />
  </TresCanvas>
</template>
```

**Step 2: Commit**

```bash
git add app/components/OrbScene.vue
git commit -m "feat: add OrbScene component"
```

---

## Task 7: Create DataOrb Component

**Files:**
- Create: `app/components/DataOrb.vue`

**Step 1: Write component**

Create `app/components/DataOrb.vue`:

```vue
<script setup lang="ts">
import type { Beam, ValidatorNode } from '~/types/orb'
import { generateGraph } from '~/utils/generate-graph'
import { ORB_CONFIG } from '~/utils/orb-constants'

const props = defineProps<{
  audioData: Float32Array
  songTheme: 'dunesOfDessert' | 'qinim'
  peerCount: number
}>()

const { validators, fetchValidators } = useValidators()
const graphData = shallowRef<ReturnType<typeof generateGraph>>()
const beams = ref<Beam[]>([])

// Fetch validators on mount
onMounted(async () => {
  await fetchValidators()
})

// Generate graph when validators loaded
watchEffect(() => {
  if (validators.value.length > 0) {
    graphData.value = generateGraph(validators.value, props.peerCount, props.songTheme)
  }
})

// Watch peer count changes
watch(() => props.peerCount, (newCount) => {
  if (!graphData.value || validators.value.length === 0)
    return
  graphData.value = generateGraph(validators.value, newCount, props.songTheme)
})

// Watch theme changes
watch(() => props.songTheme, (newTheme) => {
  if (!graphData.value || validators.value.length === 0)
    return
  graphData.value = generateGraph(validators.value, props.peerCount, newTheme)
})

// Trigger block (called from parent)
function triggerBlock(validatorAddress?: string) {
  if (!graphData.value)
    return

  let address = validatorAddress
  if (!address) {
    // Random validator
    const randomValidator = validators.value[Math.floor(Math.random() * validators.value.length)]
    address = randomValidator?.address
  }

  if (!address)
    return

  const validatorIdx = graphData.value.validatorMap.get(address)
  if (validatorIdx !== undefined && graphData.value.nodes[validatorIdx]) {
    const validator = graphData.value.nodes[validatorIdx] as ValidatorNode
    validator.lastBlockTime = Date.now() / 1000

    beams.value.push({
      id: crypto.randomUUID(),
      originAddress: address,
      startTime: Date.now() / 1000,
      maxDistance: ORB_CONFIG.ORB_RADIUS * 2.5,
    })
  }
}

// Cleanup beams
useIntervalFn(() => {
  const now = Date.now() / 1000
  beams.value = beams.value.filter(b => (now - b.startTime) * ORB_CONFIG.BEAM_SPEED < b.maxDistance + 5)
}, 1000)

defineExpose({ triggerBlock })
</script>

<template>
  <div v-if="graphData" class="w-full h-full">
    <OrbScene
      :nodes="graphData.nodes"
      :links="graphData.links"
      :validator-map="graphData.validatorMap"
      :beams="beams"
      :theme="songTheme"
      :validator-count="validators.length"
    />
  </div>
  <div v-else class="w-full h-full flex items-center justify-center text-white">
    Loading validators...
  </div>
</template>
```

**Step 2: Commit**

```bash
git add app/components/DataOrb.vue
git commit -m "feat: add DataOrb component"
```

---

## Task 8: Update orb-demo Page to Use Real Blocks

**Files:**
- Modify: `app/pages/orb-demo.vue`

**Step 1: Update page to trigger on real blocks**

Replace content of `app/pages/orb-demo.vue`:

```vue
<script setup lang="ts">
const songTheme = ref('dunesOfDessert')
const peerCount = ref(2000)
const orbRef = ref()

const { init, playBlockSound } = useStrudel()
const { startListening, onBlockEvent } = useBlockchain()

function toggleTheme() {
  songTheme.value = songTheme.value === 'dunesOfDessert' ? 'qinim' : 'dunesOfDessert'
}

function simulatePeerFluctuation() {
  setInterval(() => {
    const change = Math.floor(Math.random() * 40) - 20
    peerCount.value = Math.max(1500, Math.min(3000, peerCount.value + change))
  }, 5000)
}

onMounted(async () => {
  await init()
  startListening()

  onBlockEvent((block) => {
    playBlockSound({ validatorAddress: block.validatorAddress || block.hash })

    if (orbRef.value?.triggerBlock) {
      orbRef.value.triggerBlock(block.validatorAddress)
    }

    if (Math.random() > 0.5) {
      peerCount.value = Math.min(3000, peerCount.value + Math.floor(Math.random() * 10))
    }
  })

  simulatePeerFluctuation()
})
</script>

<template>
  <div class="orb-demo-page">
    <div class="orb-container">
      <DataOrb ref="orbRef" :audio-data="new Float32Array(512)" :song-theme="songTheme" :peer-count="peerCount" />
    </div>

    <div class="controls">
      <div class="peer-info">
        Peers: {{ peerCount }}
      </div>
      <button class="theme-toggle" @click="toggleTheme">
        Toggle Theme ({{ songTheme }})
      </button>
    </div>
  </div>
</template>

<style scoped>
.orb-demo-page {
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.orb-container {
  width: 600px;
  height: 600px;
  max-width: 90vw;
  max-height: 90vh;
}

.controls {
  position: absolute;
  bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.peer-info {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.theme-toggle {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
```

**Step 2: Commit**

```bash
git add app/pages/orb-demo.vue
git commit -m "feat: connect orb to real blockchain events"
```

---

## Task 9: Test and Verify

**Files:**
- N/A

**Step 1: Run dev server**

```bash
nr dev
```

Expected: Server starts without errors

**Step 2: Navigate to orb demo**

Open browser to `http://localhost:3000/orb-demo`

Expected:
- "Loading validators..." appears briefly
- 3D orb renders with ~72 larger validator nodes
- ~2000 smaller peer nodes spawn/fade
- Orb rotates slowly
- When blocks arrive via WebSocket, beams propagate from validator
- Validators flash orange on block production
- Theme toggle switches color palettes

**Step 3: Check browser console**

Expected: No errors, validators fetched successfully

**Step 4: Verify WebSocket connection**

Check Network tab for WebSocket connection to `/blocks`

Expected: Connected, receiving block messages

---

## Implementation Complete

All components created:
- Types and constants
- Validators composable
- Graph generation
- OrbMesh rendering
- OrbScene setup
- DataOrb wrapper
- orb-demo page integration

The orb now visualizes real Nimiq blockchain data with 72 validators from API and simulated peers.

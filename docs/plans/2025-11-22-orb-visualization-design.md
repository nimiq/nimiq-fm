# DataOrb 3D Blockchain Visualization

## Purpose

Visualize Nimiq blockchain network as 3D orb with:
- 72 real validators from API
- ~2000 simulated peers
- Energy beams when blocks arrive
- Real-time WebSocket block data

## Architecture

### Components

**DataOrb.vue** - Data fetching, exposes `triggerBlock()` method
**OrbScene.vue** - TresJS Canvas, camera, lights, effects, controls  
**OrbMesh.vue** - 3D rendering: instanced meshes, connections, beams

### Props

- `audioData: Float32Array` - Strudel audio data for reactive effects
- `songTheme: string` - 'dunesOfDessert' or 'qinim' color palette
- `peerCount: number` - Target peer node count

### Data Structures

```ts
interface ValidatorNode {
  address: string
  name: string
  balance: number
  accentColor: string
  position: Vector3
  phi: number
  theta: number
  radius: number
}

interface PeerNode {
  id: number
  position: Vector3
  state: 'hidden' | 'spawning' | 'active' | 'dying'
  timer: number
  opacity: number
}

interface Beam {
  id: string
  originAddress: string
  startTime: number
}
```

## Visual Design

### Nodes

**Validators** - InstancedMesh (72), size 2.0
- Use API `accentColor` for pools (22)
- Generic color for unknown validators (50)

**Peers** - InstancedMesh (~2000), size 0.4
- Random palette colors
- Opacity animated during lifecycle

**Materials** - MeshStandardMaterial, emissive colors, toneMapped=false for bloom

### Animation

**Validators** - Slow rotation around sphere axis
**Peers** - Lifecycle: spawn (2s fade in) → active (20-40s) → dying (2s fade out) → hidden (0-5s wait) → repeat
**Beams** - Spherical wave from validator, nodes/links light orange on pass
**Block flash** - Validator pulses bright orange 1.5s when producing block

### Connections

**Validator mesh** - Each connects to 2-3 nearest validators
**Peer connections** - 1-2 validators + 2-3 peers within distance
**Rendering** - BufferGeometry, vertexColors, additive blending

## Data Integration

### Validators API

Fetch `https://validators-api-mainnet.pages.dev/api/v1/validators?only-known=false` on mount
Extract: address, name, balance, accentColor
Map validators to sphere positions (spherical coords)
Store address → index mapping for block lookup

### Blockchain WebSocket

Use `useBlockchain()` composable
On block event: find validator by address, trigger beam, flash node
Parent calls `playBlockSound()` and `orbRef.triggerBlock()`

### Theme System

Map `songTheme` to palettes:
- 'dunesOfDessert' - warm (orange/yellow/red)
- 'qinim' - cool (blue/purple/cyan)

Apply to: peer colors, lights, beams, background

### Peer Count Reactivity

Watch `peerCount` prop
Add/remove peers dynamically
New peers start hidden, excess peers transition to dying

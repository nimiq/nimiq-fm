<script setup lang="ts">
import { gsap } from 'gsap'
import { createIdenticon } from 'identicons-esm'
import * as THREE from 'three'
import { onMounted } from 'vue'

const { block, micro, svg } = storeToRefs(useBlocks())
const container = ref(null)
let scene
let camera
let renderer
const notes = []
let lastNoteTime = 0
let gridHelper
const NOTE_SPEED = 2
const NOTE_INTERVAL = 250 // 4 notes per second (in milliseconds)

function createHexagonShape() {
  const shape = new THREE.Shape()
  const size = 0.3
  const vertices = 6
  const radius = size

  shape.moveTo(radius, 0)
  for (let i = 1; i <= vertices; i++) {
    const angle = (i * 2 * Math.PI) / vertices
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    shape.lineTo(x, y)
  }

  const extrudeSettings = {
    depth: 0.05,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  }

  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

function shakeGrid() {
  const intensity = 0.1
  const duration = 0.05

  gsap.to(gridHelper.rotation, {
    x: `+=${intensity * (Math.random() - 0.5)}`,
    z: `+=${intensity * (Math.random() - 0.5)}`,
    duration: duration / 2,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      // Reset rotation to avoid accumulation
      gridHelper.rotation.x = 0
      gridHelper.rotation.z = 0
    },
  })

  // Subtle position shake
  gsap.to(gridHelper.position, {
    x: `+=${intensity * (Math.random() - 0.5)}`,
    z: `+=${intensity * (Math.random() - 0.5)}`,
    duration: duration / 2,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      // Reset position (except y which should stay at -3)
      gridHelper.position.x = 0
      gridHelper.position.z = 0
    },
  })
};

function setupScene() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.value.appendChild(renderer.domElement)

  // Setup camera
  camera.position.z = 5
  camera.position.y = -2
  camera.rotation.x = 0.3

  // Add ambient light
  // const ambientLight = new THREE.AmbientLight(0x404040)
  const ambientLight = new THREE.AmbientLight(0x000000)
  scene.add(ambientLight)

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1)
  directionalLight.position.set(0, 1, 1)
  scene.add(directionalLight)

  // Add background effects
  createBackground()
}

function createBackground() {
  // Create a grid
  gridHelper = new THREE.GridHelper(20, 20, 0x0CA6FE, 0x0CA6FE)
  gridHelper.position.y = -3
  scene.add(gridHelper)

  // Add neon post-processing
  const renderScene = new THREE.Scene()
  renderScene.background = new THREE.Color(0x0CA6FE)
}
// 12 166 254 blue
// 36 204 162; green
// 255 153 0  orange
// 255 92 72; red
// 255 196 59; gold
// 143 63 213; puple
function createNote() {
  // const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00]
  const colors = [0x0CA6FE, 0x24CCA2, 0xFF9900, 0xFF5C48, 0xFFC43B, 0x8F3FD5]
  const geometry = createHexagonShape()
  const material = new THREE.MeshPhongMaterial({
    color: colors[Math.floor(Math.random() * colors.length)],
    emissive: 0x444444,
    shininess: 100,
    flatShading: true,
    side: THREE.DoubleSide,
  })

  // Create the texture from SVG
  // const texture = createTextureFromSVG(svg.value)

  // Create a material with the texture
  // const material = new THREE.MeshStandardMaterial({ map: texture })

  // Create a mesh with geometry and material
  // const hexagon = new THREE.Mesh(geometry, material);

  const note = new THREE.Mesh(geometry, material)
  note.position.set(
    (Math.random() - 0.5) * 4,
    -3,
    0,
  )

  note.rotation.z = Math.PI / 2
  note.rotation.y = Math.PI

  gsap.from(note.scale, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.2,
    ease: 'back.out',
  })

  scene.add(note)
  notes.push(note)
}

function animate(time) {
  requestAnimationFrame(animate)
  if (time - lastNoteTime > NOTE_INTERVAL) {
    createNote()
    lastNoteTime = time
  }

  notes.forEach((note, index) => {
    note.position.y += NOTE_SPEED * 0.015
    note.rotation.y += 0.015

    if (note.position.y > 5) {
      scene.remove(note)
      notes.splice(index, 1)
    }
  })

  renderer.render(scene, camera)
}

function handleResize() {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

useEventListener(handleResize)

onMounted(() => {
  setupScene()
  // animate(0)
})

watch(block, shakeGrid)

watch(micro, async (b) => {
  console.log({ prod: b.producer, b })
  const svgString = await createIdenticon(b.producer.validator)
  animate(0, svgString)
})
</script>

<template>
  <div ref="container" bg-pink class="game-container" />
</template>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: black;
}
</style>

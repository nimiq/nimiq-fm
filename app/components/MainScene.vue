<script setup>
import { gsap } from 'gsap'
import * as THREE from 'three'
import { onBeforeUnmount, onMounted } from 'vue'

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
  const intensity = 0.05
  const duration = 0.3

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
  const ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1)
  directionalLight.position.set(0, 1, 1)
  scene.add(directionalLight)

  // Add background effects
  createBackground()

  // Start periodic grid shake
  setInterval(shakeGrid, 1000)
}

function createBackground() {
  // Create a grid
  gridHelper = new THREE.GridHelper(20, 20, 0x00FF00, 0x00FF00)
  gridHelper.position.y = -3
  scene.add(gridHelper)

  // Add neon post-processing
  const renderScene = new THREE.Scene()
  renderScene.background = new THREE.Color(0x000011)
}

function createNote() {
  const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00]
  const geometry = createHexagonShape()
  const material = new THREE.MeshPhongMaterial({
    color: colors[Math.floor(Math.random() * colors.length)],
    emissive: 0x444444,
    shininess: 100,
    flatShading: true,
    side: THREE.DoubleSide,
  })

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
    note.position.y += NOTE_SPEED * 0.02
    note.rotation.y += 0.02

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
  animate(0)
})

onBeforeUnmount(() => {
  // Clear the shake interval
  clearInterval(shakeGrid)
})
</script>

<template>
  <div ref="container" class="game-container" />
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

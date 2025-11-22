<script setup lang="ts">
import { gsap } from 'gsap'
import { createIdenticon } from 'identicons-esm'
import * as THREE from 'three'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const { block, micro, svg } = storeToRefs(useBlocks())
const container = ref(null)
let scene
let camera
let renderer
const notes = []
let gridHelper
const NOTE_SPEED = 2
let animationId

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
      gridHelper.rotation.x = 0
      gridHelper.rotation.z = 0
    },
  })

  gsap.to(gridHelper.position, {
    x: `+=${intensity * (Math.random() - 0.5)}`,
    z: `+=${intensity * (Math.random() - 0.5)}`,
    duration: duration / 2,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 1,
    onComplete: () => {
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

  camera.position.z = 5
  camera.position.y = -2
  camera.rotation.x = 0.3

  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1)
  directionalLight.position.set(0, 1, 1)
  scene.add(directionalLight)

  createBackground()
}

function createBackground() {
  gridHelper = new THREE.GridHelper(20, 20, 0x0CA6FE, 0x0CA6FE)
  gridHelper.position.y = -3
  scene.add(gridHelper)
}

function createTextureFromSVG(svgString) {
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  const texture = new THREE.Texture(img)
  img.onload = () => { texture.needsUpdate = true }
  return texture
}

function createNote(svgString = null) {
  const geometry = createHexagonShape()
  let material

  if (svgString) {
    const texture = createTextureFromSVG(svgString)
    // Map the texture to the hexagon size (radius 0.3 -> width/height ~0.6)
    // UVs are based on world units. Range is approx -0.3 to 0.3.
    // We want to map this range to 0..1
    // 0 -> 0.5
    // 0.3 -> 1.0 => 0.3 * repeat + 0.5 = 1.0 => repeat = 0.5 / 0.3 = 1.666
    texture.repeat.set(1.666, 1.666)
    texture.offset.set(0.5, 0.5)

    // Use array of materials: [face, side]
    // ExtrudeGeometry uses index 0 for faces (top/bottom) and 1 for sides
    const faceMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xFFFFFF
    })
    const sideMaterial = new THREE.MeshBasicMaterial({
      color: 0x222222
    })
    material = [faceMaterial, sideMaterial]
  } else {
    const colors = [0x0CA6FE, 0x24CCA2, 0xFF9900, 0xFF5C48, 0xFFC43B, 0x8F3FD5]
    material = new THREE.MeshPhongMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      emissive: 0x444444,
      shininess: 100,
      flatShading: true,
      side: THREE.DoubleSide,
    })
  }

  const note = new THREE.Mesh(geometry, material)
  note.position.set(
    (Math.random() - 0.5) * 4,
    -3,
    0,
  )

  note.rotation.z = 0
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

function animate() {
  animationId = requestAnimationFrame(animate)

  notes.forEach((note, index) => {
    note.position.y += NOTE_SPEED * 0.015
    note.rotation.y += 0.015

    if (note.position.y > 5) {
      scene.remove(note)

      if (Array.isArray(note.material)) {
        note.material.forEach(m => {
          if (m.map) m.map.dispose()
          m.dispose()
        })
      } else {
        if (note.material.map) note.material.map.dispose()
        note.material.dispose()
      }

      note.geometry.dispose()
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

useEventListener(window, 'resize', handleResize)

onMounted(() => {
  setupScene()
  animate()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
})

watch(block, shakeGrid)

watch(micro, async (b) => {
  const svgString = await createIdenticon(b.producer.validator)
  createNote(svgString)
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
